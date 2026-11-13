import { useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import { ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react'
import { allAlgorithmsForCategory, categories } from '@/data/catalog'
import type { LearningController } from '@/hooks/useLearning'

export default function Progress() {
  const learning = useOutletContext<LearningController>()
  const [confirmReset, setConfirmReset] = useState(false)
  const statuses = Object.values(learning.data.statuses)
  const mastered = statuses.filter((status) => status === 'mastered').length
  const studying = statuses.filter((status) => status === 'learning').length
  return <div className="progress-page">
    <header className="page-heading"><div><div className="breadcrumb">我的学习 <span>/</span> 进度</div><h1>学习进度</h1><p>按公式记录状态。四向公式与标准公式会分别计入对应学习视图。</p></div><button className="secondary-button" onClick={() => setConfirmReset(true)} disabled={!statuses.length && !learning.data.favorites.length}><RotateCcw />清空记录</button></header>
    {confirmReset && <div className="confirm-banner" role="alert"><div><strong>确定清空所有收藏和学习状态？</strong><span>此操作只影响当前浏览器，且无法撤销。</span></div><button onClick={() => setConfirmReset(false)}>取消</button><button className="danger-button" onClick={() => { learning.resetProgress(); setConfirmReset(false) }}>确认清空</button></div>}
    <section className="progress-summary"><div><span>已掌握</span><strong>{mastered}</strong><small>条公式</small></div><div><span>学习中</span><strong>{studying}</strong><small>条公式</small></div><div><span>已收藏</span><strong>{learning.data.favorites.length}</strong><small>条公式</small></div><div className="progress-message"><CheckCircle2 /><p>{mastered ? `已经完成 ${mastered} 条公式，保持自己的节奏。` : '从一条常用公式开始，标记你的第一个进度。'}</p></div></section>
    <section className="category-progress-section"><div className="section-heading compact"><div><span className="section-kicker">分类进度</span><h2>每个阶段，都看得见</h2></div></div><div className="progress-list">{categories.map((category) => {
      const algorithms = allAlgorithmsForCategory(category.id)
      const done = algorithms.filter((algorithm) => learning.data.statuses[algorithm.id] === 'mastered').length
      const active = algorithms.filter((algorithm) => learning.data.statuses[algorithm.id] === 'learning').length
      const percent = algorithms.length ? done / algorithms.length * 100 : 0
      return <Link to={`/category/${category.id}`} className="progress-row" key={category.id}><div className="progress-row-head"><span className="nav-dot" style={{ backgroundColor: category.accent }} /><strong>{category.name}</strong><span>{done} / {algorithms.length} 已掌握{active ? ` · ${active} 学习中` : ''}</span><ArrowRight /></div><div className="progress-track"><i style={{ width: `${percent}%`, backgroundColor: category.accent }} /></div></Link>
    })}</div></section>
    <p className="local-data-note">学习记录使用浏览器本地存储，不会上传或跨设备同步。清除浏览器数据前，请留意这一点。</p>
  </div>
}
