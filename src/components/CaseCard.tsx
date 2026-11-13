import { useRef } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Star } from 'lucide-react'
import CaseCubeModel from './CaseCubeModel'
import { detailPath, slotName } from '@/data/catalog'
import type { LearningController } from '@/hooks/useLearning'
import type { CatalogVariant } from '@/types'

export default function CaseCard({ item, learning }: { item: CatalogVariant; learning: LearningController }) {
  const primary = item.variant.algorithms[0]
  const favorite = learning.data.favorites.includes(primary.id)
  const status = learning.data.statuses[primary.id] || item.variant.algorithms.map((algorithm) => learning.data.statuses[algorithm.id]).find(Boolean) || 'unlearned'
  const gesture = useRef({ x: 0, y: 0, active: false, dragged: false })

  return (
    <article className="case-card">
      <Link
        to={detailPath(item, item.category.id)}
        className="case-card-link"
        aria-label={`查看${item.cubeCase.name}${slotName(item.variant.orientation)}公式`}
        onDragStart={(event) => event.preventDefault()}
        onPointerDownCapture={(event) => {
          const fromModel = event.target instanceof Element && event.target.closest('.case-cube-model')
          gesture.current = fromModel
            ? { x: event.clientX, y: event.clientY, active: true, dragged: false }
            : { x: 0, y: 0, active: false, dragged: false }
        }}
        onPointerMoveCapture={(event) => {
          if (!gesture.current.active) return
          if (Math.abs(event.clientX - gesture.current.x) + Math.abs(event.clientY - gesture.current.y) > 3) {
            gesture.current.dragged = true
          }
        }}
        onPointerUpCapture={() => {
          // Keep the guard until click arrives, even if that click targets the link itself.
          gesture.current.active = false
        }}
        onPointerCancelCapture={() => {
          gesture.current.active = false
          gesture.current.dragged = false
        }}
        onClickCapture={(event) => {
          if (!gesture.current.dragged) return
          event.preventDefault()
          event.stopPropagation()
          gesture.current.dragged = false
        }}
      >
        <div className="case-card-head">
          <div>
            <div className="case-eyebrow">{item.cubeCase.groupZh}{item.variant.orientation > 0 || item.category.id === 'f2l4' || item.category.id === 'af2l' ? ` · ${slotName(item.variant.orientation)}` : ''}</div>
            <h3>{item.cubeCase.name}</h3>
          </div>
          <ArrowUpRight className="case-arrow" />
        </div>
        <CaseCubeModel cubeCase={item.cubeCase} orientation={item.variant.orientation} algorithm={primary.alg} />
        <div className="card-algorithm">{primary.alg}</div>
        <div className="case-card-meta"><span>{primary.moves} 步</span><span>{item.variant.algorithms.length} 条公式</span><span className={`status-text status-${status}`}>{status === 'mastered' ? '已掌握' : status === 'learning' ? '学习中' : '未学习'}</span></div>
      </Link>
      <button className={`card-favorite ${favorite ? 'active' : ''}`} onClick={() => learning.toggleFavorite(primary.id)} aria-label={favorite ? '取消收藏主公式' : '收藏主公式'} title={favorite ? '取消收藏' : '收藏'}><Star fill={favorite ? 'currentColor' : 'none'} /></button>
    </article>
  )
}
