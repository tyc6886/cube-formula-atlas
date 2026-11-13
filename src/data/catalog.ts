import rawData from './algorithms.json'
import type { Algorithm, CatalogVariant, Category, CategoryId, CubeCase } from '@/types'

export const metadata = rawData.meta
export const cases = rawData.cases as unknown as CubeCase[]

export const categories: Category[] = [
  {
    id: 'f2l', name: '标准 F2L', shortName: 'F2L', title: '标准 F2L · 41 案',
    description: '前两层角棱配对', longDescription: '覆盖基础 CFOP 的 41 个标准末槽情况。默认以前右槽为目标，每个情况保留推荐公式与常见备选。', accent: '#3167e3',
  },
  {
    id: 'f2l4', name: '四向 F2L', shortName: '4-way', title: '四向 F2L · 全槽向',
    description: '四个槽向，减少转体', longDescription: '将 41 个标准情况扩展到前右、前左、后左、后右四个槽向，按实际目标槽直接学习，无需额外转体换算。', accent: '#147d77',
  },
  {
    id: 'af2l', name: '非标 F2L', shortName: 'Advanced', title: '高级／非标 F2L · 54 案',
    description: '被困角块与棱块', longDescription: '收录角块被困、棱块被困、两块均被困等高级情况，并保留全部四向公式。', accent: '#b05b25',
  },
  {
    id: 'oll', name: 'OLL', shortName: 'OLL', title: 'OLL · 57 案',
    description: '顶层全部定向', longDescription: '最后一层定向的完整 57 个情况，按点、线、鱼形及其他常见形态分组。', accent: '#c49319',
  },
  {
    id: 'pll', name: 'PLL', shortName: 'PLL', title: 'PLL · 21 案',
    description: '顶层块位排列', longDescription: '最后一层排列的完整 21 个情况，包含相邻交换、相对交换与 EPLL。', accent: '#7758c7',
  },
  {
    id: 'zbll', name: 'ZBLL', shortName: 'ZBLL', title: 'ZBLL · 493 案',
    description: '棱块已定向，一步完成顶层', longDescription: '完整 ZBLL 学习视图：472 个独立 ZBLL 情况，加 21 个与 PLL 重合的情况。按 T、U、L、H、Pi、S、AS 与 PLL 分组。', accent: '#d24d68',
  },
]

export const categoryMap = Object.fromEntries(categories.map((category) => [category.id, category])) as Record<CategoryId, Category>

export function variantsForCategory(categoryId: CategoryId): CatalogVariant[] {
  const category = categoryMap[categoryId]
  const output: CatalogVariant[] = []
  for (const cubeCase of cases) {
    const included = categoryId === 'zbll'
      ? cubeCase.family === 'zbll' || cubeCase.family === 'pll'
      : cubeCase.family === categoryId || (categoryId === 'f2l4' && cubeCase.family === 'f2l')
    if (!included) continue
    for (const variant of cubeCase.variants) {
      if (categoryId === 'f2l' && variant.orientation !== 0) continue
      output.push({ cubeCase, variant, category })
    }
  }
  return output
}

export const categoryVariants = Object.fromEntries(
  categories.map((category) => [category.id, variantsForCategory(category.id)]),
) as Record<CategoryId, CatalogVariant[]>

export const variantMap = new Map<string, CatalogVariant>()
for (const category of categories) {
  for (const item of categoryVariants[category.id]) {
    if (!variantMap.has(item.variant.id)) variantMap.set(item.variant.id, item)
  }
}

export const algorithmLocationMap = new Map<string, { item: CatalogVariant; algorithm: Algorithm }>()
for (const item of variantMap.values()) {
  for (const algorithm of item.variant.algorithms) {
    algorithmLocationMap.set(algorithm.id, { item, algorithm })
  }
}

export function naturalCategory(item: CatalogVariant): CategoryId {
  if (item.cubeCase.family === 'f2l') return item.variant.orientation === 0 ? 'f2l' : 'f2l4'
  return item.cubeCase.family
}

export function detailPath(item: CatalogVariant, categoryId?: CategoryId, algorithmId?: string): string {
  const category = categoryId || naturalCategory(item)
  const suffix = algorithmId ? `?alg=${encodeURIComponent(algorithmId)}` : ''
  return `/category/${category}/case/${item.variant.id}${suffix}`
}

export function slotName(orientation: number): string {
  return ['前右槽', '前左槽', '后左槽', '后右槽'][orientation] || '标准槽向'
}

export function allAlgorithmsForCategory(categoryId: CategoryId): Algorithm[] {
  return categoryVariants[categoryId].flatMap((item) => item.variant.algorithms)
}
