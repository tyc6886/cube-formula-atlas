import type { CubeCase } from '../types/index.ts'

export type FaceName = 'U' | 'R' | 'F' | 'D' | 'L' | 'B'
export type CubeFaces = Record<FaceName, string>

export const stickerColors: Record<string, string> = {
  y: '#f2ca32', r: '#d94b50', g: '#319a68', o: '#e98a36', b: '#3278c5', w: '#f7f8f4', l: '#dce1e3',
}

const blank = 'lllllllll'
const rotateClockwise = (face: string) => [6, 3, 0, 7, 4, 1, 8, 5, 2].map((index) => face[index]).join('')
const transpose = (face: string) => [0, 3, 6, 1, 4, 7, 2, 5, 8].map((index) => face[index]).join('')

function sourceFaces(cubeCase: CubeCase): CubeFaces {
  const f2l = cubeCase.image['data-fl']
  if (f2l) return { U: f2l.slice(0, 9), F: f2l.slice(9, 18), R: f2l.slice(18, 27), D: blank, L: blank, B: blank }
  // SpeedCubeDB stores the LL top face column-first; side strings start with the visible top row.
  return {
    U: transpose(cubeCase.image['data-us'] || blank),
    F: cubeCase.image['data-uf'] || blank,
    R: cubeCase.image['data-ur'] || blank,
    D: blank,
    L: cubeCase.image['data-ul'] || blank,
    B: cubeCase.image['data-ub'] || blank,
  }
}

export function getCaseFaces(cubeCase: CubeCase, orientation = 0): CubeFaces {
  let result = sourceFaces(cubeCase)
  for (let turn = 0; turn < orientation; turn++) {
    result = {
      U: rotateClockwise(result.U),
      F: result.R,
      R: result.B,
      B: result.L,
      L: result.F,
      D: rotateClockwise(result.D),
    }
  }
  return result
}

interface PieceOrbit { pieces: number[]; orientation: number[] }
interface PatternData { EDGES: PieceOrbit; CORNERS: PieceOrbit; CENTERS: PieceOrbit }

const centerColors = ['w', 'o', 'g', 'r', 'b', 'y']
const edgePositions = [
  ['U', 'F'], ['U', 'R'], ['U', 'B'], ['U', 'L'],
  ['D', 'F'], ['D', 'R'], ['D', 'B'], ['D', 'L'],
  ['F', 'R'], ['F', 'L'], ['B', 'R'], ['B', 'L'],
] as const
const cornerPositions = [
  ['U', 'R', 'F'], ['U', 'B', 'R'], ['U', 'L', 'B'], ['U', 'F', 'L'],
  ['D', 'F', 'R'], ['D', 'L', 'F'], ['D', 'B', 'L'], ['D', 'R', 'B'],
] as const
const solvedFaces: CubeFaces = { U: 'wwwwwwwww', F: 'ggggggggg', R: 'rrrrrrrrr', D: 'yyyyyyyyy', L: 'ooooooooo', B: 'bbbbbbbbb' }

function stickerAt(data: PatternData, piece: number, positionFaces: readonly FaceName[], face: FaceName) {
  const isCorner = positionFaces.length === 3
  const orbit = isCorner ? data.CORNERS : data.EDGES
  const pieceIndex = orbit.pieces[piece]
  const orientation = orbit.orientation[piece]
  const positionIndex = positionFaces.indexOf(face)
  const sourceFace = (isCorner ? cornerPositions : edgePositions)[pieceIndex][(positionIndex - orientation + positionFaces.length) % positionFaces.length]
  return solvedFaces[sourceFace][4]
}

export function patternToFaces(data: PatternData): CubeFaces {
  const U = [stickerAt(data, 2, cornerPositions[2], 'U'), stickerAt(data, 2, edgePositions[2], 'U'), stickerAt(data, 1, cornerPositions[1], 'U'), stickerAt(data, 3, edgePositions[3], 'U'), centerColors[data.CENTERS.pieces[0]], stickerAt(data, 1, edgePositions[1], 'U'), stickerAt(data, 3, cornerPositions[3], 'U'), stickerAt(data, 0, edgePositions[0], 'U'), stickerAt(data, 0, cornerPositions[0], 'U')]
  const F = [stickerAt(data, 3, cornerPositions[3], 'F'), stickerAt(data, 0, edgePositions[0], 'F'), stickerAt(data, 0, cornerPositions[0], 'F'), stickerAt(data, 9, edgePositions[9], 'F'), centerColors[data.CENTERS.pieces[2]], stickerAt(data, 8, edgePositions[8], 'F'), stickerAt(data, 5, cornerPositions[5], 'F'), stickerAt(data, 4, edgePositions[4], 'F'), stickerAt(data, 4, cornerPositions[4], 'F')]
  const R = [stickerAt(data, 0, cornerPositions[0], 'R'), stickerAt(data, 1, edgePositions[1], 'R'), stickerAt(data, 1, cornerPositions[1], 'R'), stickerAt(data, 8, edgePositions[8], 'R'), centerColors[data.CENTERS.pieces[3]], stickerAt(data, 10, edgePositions[10], 'R'), stickerAt(data, 4, cornerPositions[4], 'R'), stickerAt(data, 5, edgePositions[5], 'R'), stickerAt(data, 7, cornerPositions[7], 'R')]
  const L = [stickerAt(data, 2, cornerPositions[2], 'L'), stickerAt(data, 3, edgePositions[3], 'L'), stickerAt(data, 3, cornerPositions[3], 'L'), stickerAt(data, 11, edgePositions[11], 'L'), centerColors[data.CENTERS.pieces[1]], stickerAt(data, 9, edgePositions[9], 'L'), stickerAt(data, 6, cornerPositions[6], 'L'), stickerAt(data, 7, edgePositions[7], 'L'), stickerAt(data, 5, cornerPositions[5], 'L')]
  const B = [stickerAt(data, 1, cornerPositions[1], 'B'), stickerAt(data, 2, edgePositions[2], 'B'), stickerAt(data, 2, cornerPositions[2], 'B'), stickerAt(data, 10, edgePositions[10], 'B'), centerColors[data.CENTERS.pieces[4]], stickerAt(data, 11, edgePositions[11], 'B'), stickerAt(data, 7, cornerPositions[7], 'B'), stickerAt(data, 6, edgePositions[6], 'B'), stickerAt(data, 6, cornerPositions[6], 'B')]
  return { U: U.join(''), F: F.join(''), R: R.join(''), L: L.join(''), B: B.join(''), D: `llll${centerColors[data.CENTERS.pieces[5]]}llll` }
}

export async function getPlayerCaseFaces(cubeCase: CubeCase, orientation: number, algorithm: string): Promise<CubeFaces> {
  const [{ Alg }, { cube3x3x3 }] = await Promise.all([import('cubing/alg'), import('cubing/puzzles')])
  const puzzle = await cube3x3x3.kpuzzle()
  const initial = puzzle.defaultPattern().applyAlg('z2 y2').applyAlg(new Alg(algorithm).invert())
  const actual = patternToFaces(initial.toJSON().patternData as PatternData)
  const mask = getCaseFaces(cubeCase, orientation)
  return Object.fromEntries(Object.entries(actual).map(([faceName, face]) => [faceName, face.split('').map((color, index) => index === 4 ? color : mask[faceName as FaceName][index] === 'l' ? 'l' : color).join('')])) as CubeFaces
}
