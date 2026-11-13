import { useMemo, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import CaseCard from '@/components/CaseCard'
import { categories, slotName, variantMap } from '@/data/catalog'
import { normalizeSearch } from '@/lib/search'
import type { LearningController } from '@/hooks/useLearning'

function SearchForm({ initialQuery }: { initialQuery: string }) {
  const [, setParams] = useSearchParams()
  const [input, setInput] = useState(initialQuery)
  return <form className="search-page-form" onSubmit={(event) => { event.preventDefault(); setParams(input.trim() ? { q: input.trim() } : {}) }}><Search /><label className="sr-only" htmlFor="search-page-input">搜索全部公式</label><input id="search-page-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="例如：ZBLL T 1、PLL、R U R′" autoFocus /><button className="primary-button" type="submit">搜索</button></form>
}

export default function SearchResults() {
  const [params] = useSearchParams()
  const query = params.get('q') || ''
  const learning = useOutletContext<LearningController>()
  const results = useMemo(() => {
    const normalized = normalizeSearch(query)
    if (!normalized) return []
    return Array.from(variantMap.values()).filter((item) => [
      item.cubeCase.name,
      item.cubeCase.group,
      item.cubeCase.groupZh,
      item.category.name,
      slotName(item.variant.orientation),
      ...item.variant.algorithms.map((algorithm) => algorithm.alg),
    ].some((value) => normalizeSearch(value).includes(normalized)))
  }, [query])
  return <div className="search-page">
    <header className="page-heading"><div><div className="breadcrumb">全站搜索</div><h1>{query ? `“${query}”的搜索结果` : '搜索全部公式'}</h1><p>可搜索情况编号、分类名称、槽向或完整／部分公式。</p></div></header>
    <SearchForm key={query} initialQuery={query} />
    {query ? <><div className="results-line"><span>共找到 <strong>{results.length}</strong> 个情况</span><span>{results.length > 60 ? '当前显示前 60 个，请缩小范围' : '点击卡片查看详情'}</span></div>{results.length ? <div className="case-grid">{results.slice(0, 60).map((item) => <CaseCard key={item.variant.id} item={item} learning={learning} />)}</div> : <div className="empty-state"><Search /><h2>没有找到匹配内容</h2><p>检查公式记号，或尝试更短的编号。</p></div>}</> : <div className="search-suggestions"><h2>从分类开始</h2><div>{categories.map((category) => <Link key={category.id} to={`/category/${category.id}`}>{category.name}<span>→</span></Link>)}</div></div>}
  </div>
}
