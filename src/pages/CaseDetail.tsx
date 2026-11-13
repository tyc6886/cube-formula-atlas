import { Link, useOutletContext, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, Check, Clipboard, ExternalLink, Star } from 'lucide-react'
import CubePlayer from '@/components/CubePlayer'
import { categoryMap, categoryVariants, detailPath, slotName } from '@/data/catalog'
import type { LearningController } from '@/hooks/useLearning'
import type { CategoryId, LearningStatus } from '@/types'

export default function CaseDetail() {
  const { categoryId: rawCategory, variantId } = useParams()
  const categoryId = (rawCategory || 'f2l') as CategoryId
  const category = categoryMap[categoryId]
  const items = categoryVariants[categoryId] || []
  const itemIndex = items.findIndex((entry) => entry.variant.id === variantId)
  const item = items[itemIndex]
  const learning = useOutletContext<LearningController>()
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = item?.variant.algorithms.find((alg) => alg.id === searchParams.get('alg')) || item?.variant.algorithms[0]
  const favorite = selected ? learning.data.favorites.includes(selected.id) : false
  const status: LearningStatus = selected ? learning.data.statuses[selected.id] || 'unlearned' : 'unlearned'
  const siblingVariants = item?.cubeCase.variants || []

  if (!item || !selected || !category) return <div className="empty-state"><h1>没有找到这个公式情况</h1><Link className="primary-button" to="/">返回首页</Link></div>

  const copyFormula = async () => {
    try { await navigator.clipboard.writeText(selected.alg); learning.setToast('公式已复制') }
    catch { learning.setToast('复制失败，请手动选择公式') }
  }
  const chooseAlgorithm = (id: string) => setSearchParams({ alg: id })
  const previous = items[itemIndex - 1]
  const next = items[itemIndex + 1]

  return (
    <div className="detail-page">
      <div className="detail-breadcrumb"><Link to={`/category/${categoryId}`}><ArrowLeft />返回{category.name}</Link><span>{category.name} / {item.cubeCase.name}</span></div>
      <header className="detail-heading"><div><div className="case-eyebrow">{item.cubeCase.groupZh}{categoryId === 'zbll' ? ` · ${item.cubeCase.zbllGroup || 'PLL'} 组` : ''}</div><h1>{item.cubeCase.name}</h1><p>{category.description} · {slotName(item.variant.orientation)}</p></div><div className="detail-actions"><button className={`secondary-button ${favorite ? 'favorite-active' : ''}`} onClick={() => learning.toggleFavorite(selected.id)}><Star fill={favorite ? 'currentColor' : 'none'} />{favorite ? '已收藏' : '收藏'}</button><button className="secondary-button" onClick={copyFormula}><Clipboard />复制公式</button></div></header>

      {siblingVariants.length > 1 && <div className="orientation-tabs" aria-label="选择目标槽向">{siblingVariants.map((variant) => {
        const sibling = { ...item, variant }
        return <Link key={variant.id} className={variant.id === item.variant.id ? 'active' : ''} to={detailPath(sibling, categoryId === 'f2l' ? 'f2l4' : categoryId)}>{slotName(variant.orientation)}<small>{variant.algorithms.length} 条</small></Link>
      })}</div>}

      <div className="detail-layout">
        <section className="viewer-panel" aria-label="三维公式演示"><div className="viewer-panel-head"><span><i className="live-dot" />3D 公式演示</span><span>黄顶 · 蓝前</span></div><CubePlayer key={selected.id} algorithm={selected.alg} label={item.cubeCase.name} /></section>
        <aside className="formula-panel">
          <div className="formula-panel-section"><div className="panel-label">当前公式 <span>{selected.recommended ? '推荐' : '备选'}</span></div><div className="formula-large">{selected.alg}</div><div className="formula-stats"><span><strong>{selected.moves}</strong> 步</span>{selected.votes > 0 && <span><strong>{selected.votes}</strong> 来源投票</span>}</div></div>
          <div className="formula-panel-section"><div className="panel-label">学习状态</div><div className="learning-buttons">{(['unlearned', 'learning', 'mastered'] as LearningStatus[]).map((value) => <button key={value} className={status === value ? `active ${value}` : ''} onClick={() => learning.setStatus(selected.id, value)}>{value === 'mastered' && <Check />}{value === 'unlearned' ? '未学习' : value === 'learning' ? '学习中' : '已掌握'}</button>)}</div></div>
          <div className="formula-panel-section source-section"><div className="panel-label">公式来源</div><p>主目录与公式来自 SpeedCubeDB，已通过 cubing.js 记号解析。</p><a href={item.cubeCase.source} target="_blank" rel="noreferrer">查看原始情况<ExternalLink /></a></div>
        </aside>
      </div>

      <section className="alternatives-section"><div className="section-heading compact"><div><span className="section-kicker">选择适合你的手法</span><h2>推荐与备选公式</h2></div><p>同一情况的不同解法。切换后，3D 模型会从对应初始状态重新演示。</p></div><div className="alternative-list">{item.variant.algorithms.map((algorithm, index) => <button key={algorithm.id} className={selected.id === algorithm.id ? 'active' : ''} onClick={() => chooseAlgorithm(algorithm.id)}><span className="alternative-index">{index === 0 ? '推荐' : `备选 ${index}`}</span><code>{algorithm.alg}</code><span className="alternative-meta">{algorithm.moves} 步{algorithm.votes > 0 ? ` · ${algorithm.votes} 票` : ''}<ArrowRight /></span></button>)}</div></section>

      <nav className="detail-pagination" aria-label="相邻公式情况">{previous ? <Link to={detailPath(previous, categoryId)}><ArrowLeft /><span>上一个情况<strong>{previous.cubeCase.name}</strong></span></Link> : <span />}{next ? <Link to={detailPath(next, categoryId)} className="next"><span>下一个情况<strong>{next.cubeCase.name}</strong></span><ArrowRight /></Link> : <Link to={`/category/${categoryId}`} className="next"><span>返回分类<strong>查看全部情况</strong></span><ArrowRight /></Link>}</nav>
    </div>
  )
}
