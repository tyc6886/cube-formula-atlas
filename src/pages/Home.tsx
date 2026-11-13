import { Link, useOutletContext } from 'react-router'
import { ArrowRight, BookOpen, CheckCircle2, MousePointer2, Play } from 'lucide-react'
import CubePlayer from '@/components/CubePlayer'
import { categories, categoryVariants, metadata } from '@/data/catalog'
import type { LearningController } from '@/hooks/useLearning'

export default function Home() {
  const learning = useOutletContext<LearningController>()
  const mastered = Object.values(learning.data.statuses).filter((status) => status === 'mastered').length
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="hero-kicker"><span />CFOP · F2L · ZBLL</div>
          <h1>把每一条公式，<br /><em>转给你看。</em></h1>
          <p>从 41 个标准 F2L 到完整 ZBLL。每个情况都有可旋转的 3D 魔方，让公式不再只是一串字母。</p>
          <div className="hero-actions"><Link className="primary-button" to="/category/f2l"><Play />开始浏览公式</Link><Link className="text-link" to="/guide">先了解公式记号<ArrowRight /></Link></div>
          <div className="hero-proof"><span><CheckCircle2 />完整分类目录</span><span><MousePointer2 />逐条 3D 演示</span></div>
        </div>
        <div className="hero-player-wrap">
          <div className="hero-player-label"><span>3D 公式示例</span><strong>R U R′ U′</strong></div>
          <CubePlayer algorithm="R U R' U'" label="首页公式示例" />
        </div>
      </section>

      <section className="stats-strip" aria-label="公式库统计">
        <div><strong>{metadata.algorithmCount.toLocaleString()}</strong><span>条公式记录</span></div>
        <div><strong>41 × 4</strong><span>标准情况与四向槽位</span></div>
        <div><strong>493</strong><span>完整 ZBLL 学习视图</span></div>
        <div><strong>{mastered}</strong><span>条已掌握公式</span></div>
      </section>

      <section className="home-catalog-section">
        <div className="section-heading"><div><span className="section-kicker">公式目录</span><h2>从一个阶段，开始深入</h2></div><p>先理解块的位置，再选择适合你的公式。所有分类都保留常见备选方案。</p></div>
        <div className="category-grid">
          {categories.map((category) => {
            const items = categoryVariants[category.id]
            const algCount = items.reduce((sum, item) => sum + item.variant.algorithms.length, 0)
            return <Link to={`/category/${category.id}`} className="category-card" key={category.id} style={{ '--category-accent': category.accent } as React.CSSProperties}>
              <div className="category-card-top"><span className="category-monogram">{category.shortName}</span><ArrowRight /></div>
              <h3>{category.name}</h3><p>{category.description}</p>
              <div className="category-card-bottom"><span>{items.length} 个展示情况</span><span>{algCount.toLocaleString()} 条公式</span></div>
            </Link>
          })}
        </div>
      </section>

      <section className="learning-banner">
        <div className="learning-icon"><BookOpen /></div>
        <div><span className="section-kicker">你的学习空间</span><h2>看过的公式，也有自己的位置。</h2><p>收藏常用公式，标记学习状态。记录只保存在当前浏览器，无需注册。</p></div>
        <Link to="/progress" className="secondary-button">查看学习进度<ArrowRight /></Link>
      </section>
    </div>
  )
}
