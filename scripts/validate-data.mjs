import { readFile } from "node:fs/promises";
import { Alg } from "cubing/alg";
import { cube3x3x3 } from "cubing/puzzles";
import { getPlayerCaseFaces, patternToFaces } from "../src/lib/casePatterns.ts";

const data = JSON.parse(await readFile(new URL("../src/data/algorithms.json", import.meta.url), "utf8"));
const puzzle = await cube3x3x3.kpuzzle();
const target = puzzle.defaultPattern().applyAlg("z2 y2");
const ids = new Set();
const caseIds = new Set();
const variantIds = new Set();
let checked = 0;
let variantCount = 0;
const failures = [];
for (const rotation of ["x", "y", "z", "x2", "y2", "z2", "z2 y2", "x y z"]) {
  const faces = patternToFaces(puzzle.defaultPattern().applyAlg(rotation).toJSON().patternData);
  for (const [face, pattern] of Object.entries(faces)) {
    if (face !== "D" && !pattern.split("").every((color) => color === pattern[4])) failures.push(`Decoder failed solved rotation ${rotation}: ${face}`);
  }
}

for (const cubeCase of data.cases) {
  const isF2L = ["F2L", "AF2L"].includes(cubeCase.set);
  const requiredImages = isF2L ? { "data-fl": 45 } : { "data-us": 9, "data-ub": 9, "data-uf": 9, "data-ul": 9, "data-ur": 9 };
  for (const [key, length] of Object.entries(requiredImages)) {
    const pattern = cubeCase.image[key];
    if (!pattern || pattern.length !== length || /[^yrgbowl]/.test(pattern)) failures.push(`${cubeCase.id}: invalid ${key} diagram stickers`);
  }
  if (caseIds.has(cubeCase.id)) failures.push(`${cubeCase.id}: duplicate case id`);
  caseIds.add(cubeCase.id);
  const expectedOrientations = ["F2L", "AF2L"].includes(cubeCase.set) ? [0, 1, 2, 3] : [0];
  if (JSON.stringify(cubeCase.variants.map((variant) => variant.orientation)) !== JSON.stringify(expectedOrientations)) failures.push(`${cubeCase.id}: incorrect orientations`);
  for (const variant of cubeCase.variants) {
    variantCount++;
    if (variantIds.has(variant.id)) failures.push(`${variant.id}: duplicate variant id`);
    variantIds.add(variant.id);
    if (!variant.algorithms.length) failures.push(`${variant.id}: no algorithms`);
    try {
      const initial = target.applyAlg(new Alg(variant.algorithms[0].alg).invert());
      const detailFaces = patternToFaces(initial.toJSON().patternData);
      const cardFaces = await getPlayerCaseFaces(cubeCase, variant.orientation, variant.algorithms[0].alg);
      for (const [face, pattern] of Object.entries(cardFaces)) {
        for (let index = 0; index < 9; index++) {
          if (pattern[index] !== "l" && pattern[index] !== detailFaces[face][index]) failures.push(`${variant.id}: card/detail mismatch at ${face}${index}`);
        }
      }
    } catch (error) {
      failures.push(`${variant.id}: card state generation failed: ${error}`);
    }
    for (const algorithm of variant.algorithms) {
      if (ids.has(algorithm.id)) failures.push(`${algorithm.id}: duplicate id`);
      ids.add(algorithm.id);
      try {
        const alg = new Alg(algorithm.alg);
        const leafCount = Array.from(alg.childAlgNodes()).length;
        const tokenCount = algorithm.alg.split(/\s+/).filter(Boolean).length;
        if (algorithm.moves !== leafCount || tokenCount !== leafCount) failures.push(`${algorithm.id}: move count mismatch`);
        const initial = target.applyAlg(alg.invert());
        const result = initial.applyAlg(alg);
        if (!result.isIdentical(target)) failures.push(`${algorithm.id}: state roundtrip failed`);
        checked++;
      } catch (error) {
        failures.push(`${algorithm.id}: ${error}`);
      }
    }
  }
}

const counts = Object.fromEntries(["F2L", "AF2L", "OLL", "PLL", "ZBLL"].map((set) => [set, data.cases.filter((item) => item.set === set).length]));
if (counts.F2L !== 41 || counts.AF2L !== 54 || counts.OLL !== 57 || counts.PLL !== 21 || counts.ZBLL !== 472) failures.push(`Case counts wrong: ${JSON.stringify(counts)}`);
if (checked !== 3408) failures.push(`Expected 3408 formulas, checked ${checked}`);
if (variantCount !== 930) failures.push(`Expected 930 variants, checked ${variantCount}`);
console.log(JSON.stringify({ checked, uniqueIds: ids.size, caseCount: caseIds.size, variantCount, counts, zbllView: counts.ZBLL + counts.PLL, failures }, null, 2));
if (failures.length) process.exit(1);
