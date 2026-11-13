export type LearningStatus = 'unlearned' | 'learning' | 'mastered'

export interface Algorithm {
  id: string
  alg: string
  moves: number
  votes: number
  recommended: boolean
}

export interface CaseVariant {
  id: string
  orientation: number
  slot: string
  algorithms: Algorithm[]
}

export interface CubeCase {
  id: string
  name: string
  group: string
  groupZh: string
  setup: string
  source: string
  sourceSet: string
  family: 'f2l' | 'af2l' | 'oll' | 'pll' | 'zbll'
  set: 'F2L' | 'AF2L' | 'OLL' | 'PLL' | 'ZBLL'
  zbllGroup?: 'T' | 'U' | 'L' | 'H' | 'Pi' | 'S' | 'AS'
  image: Record<string, string>
  variants: CaseVariant[]
}

export type CategoryId = 'f2l' | 'f2l4' | 'af2l' | 'oll' | 'pll' | 'zbll'

export interface Category {
  id: CategoryId
  name: string
  shortName: string
  title: string
  description: string
  longDescription: string
  accent: string
}

export interface CatalogVariant {
  cubeCase: CubeCase
  variant: CaseVariant
  category: Category
}
