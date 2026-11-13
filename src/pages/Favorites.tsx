import { Link, useOutletContext } from 'react-router'
import { ArrowRight, Heart, Star } from 'lucide-react'
import { algorithmLocationMap, detailPath } from '@/data/catalog'
import type { LearningController } from '@/hooks/useLearning'

export default function Favorites() {
  const learning = useOutletContext<LearningController>()
  const favorites = learning.data.favorites.map((id) => algorithmLocationMap.get(id)).filter(Boolean)
  return <div className="library-page">
    <header className="page-heading"><div><div className="breadcrumb">我的学习 <span>/</span> 收藏</div><h1>我的收藏</h1><p>把常用公式放在一起，随时打开 3D 复习。</p></div><div className="page-stat"><strong>{favorites.length}</strong><span>收藏公式</span></div></header>
    {favorites.length ? <div className="favorite-list">{favorites.map((location) => {
      if (!location) return null
      const { item, algorithm } = location
      return <article key={algorithm.id} className="favorite-row"><div className="favorite-icon"><Star fill="currentColor" /></div><div className="favorite-main"><div><strong>{item.cubeCase.name}</strong><span>{item.cubeCase.groupZh}</span></div><code>{algorithm.alg}</code></div><div className="favorite-row-actions"><button className="icon-button" onClick={() => learning.toggleFavorite(algorithm.id)} aria-label={`取消收藏${item.cubeCase.name}`}><Heart fill="currentColor" /></button><Link className="secondary-button" to={detailPath(item, item.category.id, algorithm.id)}>打开 3D<ArrowRight /></Link></div></article>
    })}</div> : <div className="empty-state favorite-empty"><Heart /><h2>还没有收藏公式</h2><p>在公式卡片或详情页点击星标，常用公式就会出现在这里。</p><Link className="primary-button" to="/category/f2l">浏览 F2L 公式<ArrowRight /></Link></div>}
  </div>
}
