import { useState } from 'react'
import { useOutletContext, useParams } from 'react-router'
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import CaseCard from '@/components/CaseCard'
import { categoryMap, categoryVariants } from '@/data/catalog'
import type { LearningController } from '@/hooks/useLearning'
import type { CategoryId, LearningStatus } from '@/types'
import { normalizeSearch } from '@/lib/search'

const PAGE_SIZE = 24

export default function Catalog() {
  const { categoryId: rawCategory } = useParams()
  const categoryId = (rawCategory || 'f2l') as CategoryId
  return <CatalogContent key={categoryId} categoryId={categoryId} />
}

function CatalogContent({ categoryId }: { categoryId: CategoryId }) {
  const category = categoryMap[categoryId]
  const learning = useOutletContext<LearningController>()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [status, setStatus] = useState<'all' | 'favorites' | LearningStatus>('all')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const allItems = categoryVariants[categoryId] || []

  const groups = Array.from(new Map(allItems.map((item) => {
    const key = categoryId === 'zbll' ? item.cubeCase.zbllGroup || 'PLL' : item.cubeCase.group
    const label = categoryId === 'zbll' ? key : item.cubeCase.groupZh
    return [key, label]
  })).entries())

  const normalizedQuery = normalizeSearch(query)
  const filtered = allItems.filter((item) => {
    const matchesQuery = !normalizedQuery || [item.cubeCase.name, item.cubeCase.group, item.cubeCase.groupZh, ...item.variant.algorithms.map((alg) => alg.alg)].some((value) => normalizeSearch(value).includes(normalizedQuery))
    const itemGroup = categoryId === 'zbll' ? item.cubeCase.zbllGroup || 'PLL' : item.cubeCase.group
    const matchesGroup = group === 'all' || itemGroup === group
    const algorithms = item.variant.algorithms
    const matchesStatus = status === 'all' || algorithms.some((algorithm) => {
      if (status === 'favorites') return learning.data.favorites.includes(algorithm.id)
      return (learning.data.statuses[algorithm.id] || 'unlearned') === status
    })
    return matchesQuery && matchesGroup && matchesStatus
  })

  const updateQuery = (value: string) => { setQuery(value); setVisible(PAGE_SIZE) }
  const updateGroup = (value: string) => { setGroup(value); setVisible(PAGE_SIZE) }
  const updateStatus = (value: typeof status) => { setStatus(value); setVisible(PAGE_SIZE) }
  const clearFilters = () => { setQuery(''); setGroup('all'); setStatus('all'); setVisible(PAGE_SIZE) }

  if (!category) return <div className="empty-state"><h1>没有找到这个分类</h1></div>
  const algCount = allItems.reduce((sum, item) => sum + item.variant.algorithms.length, 0)

  return (
    <div className="catalog-page">
      <header className="page-heading">
        <div><div className="breadcrumb">公式库 <span>/</span> {category.name}</div><h1>{category.title}</h1><p>{category.longDescription}</p></div>
        <div className="page-stat" style={{ color: category.accent }}><strong>{allItems.length}</strong><span>展示情况</span><small>{algCount.toLocaleString()} 条公式</small></div>
      </header>

      <section className="filter-panel" aria-label="筛选公式">
        <div className="catalog-search"><Search /><label className="sr-only" htmlFor="catalog-search">在当前分类搜索</label><input id="catalog-search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="搜索编号或输入公式，例如 R U R′…" />{query && <button onClick={() => updateQuery('')} aria-label="清空搜索">×</button>}</div>
        <div className="status-filter"><SlidersHorizontal /><label htmlFor="status-filter">学习状态</label><select id="status-filter" value={status} onChange={(event) => updateStatus(event.target.value as typeof status)}><option value="all">全部</option><option value="favorites">已收藏</option><option value="learning">学习中</option><option value="mastered">已掌握</option><option value="unlearned">未学习</option></select></div>
      </section>

      <div className="group-filter" aria-label="按子分类筛选">
        <button className={group === 'all' ? 'active' : ''} onClick={() => updateGroup('all')}>全部</button>
        {groups.map(([key, label]) => <button key={key} className={group === key ? 'active' : ''} onClick={() => updateGroup(key)}>{label}</button>)}
      </div>

      <div className="results-line"><span>找到 <strong>{filtered.length}</strong> 个情况</span><span>点击卡片打开 3D 演示</span></div>
      {filtered.length ? <>
        <div className="case-grid">{filtered.slice(0, visible).map((item) => <CaseCard key={`${item.category.id}-${item.variant.id}`} item={item} learning={learning} />)}</div>
        {visible < filtered.length && <button className="load-more" onClick={() => setVisible((count) => count + PAGE_SIZE)}>再显示 {Math.min(PAGE_SIZE, filtered.length - visible)} 个情况<span>↓</span></button>}
      </> : <div className="empty-state"><Search /><h2>没有匹配的情况</h2><p>试试缩短公式，或清除分类与学习状态筛选。</p><button className="secondary-button" onClick={clearFilters}><RotateCcw />清除筛选</button></div>}
    </div>
  )
}
