import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { BookOpen, Box, CheckCircle2, Heart, Menu, Search, X } from 'lucide-react'
import { categories } from '@/data/catalog'
import type { LearningController } from '@/hooks/useLearning'

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return <Link to="/" className="brand" aria-label="三阶魔方公式库首页" onClick={onNavigate}><span className="brand-mark"><i /><i /><i /><i /></span><span><strong>三阶魔方</strong><small>公式图鉴</small></span></Link>
}

export default function Layout({ learning }: { learning: LearningController }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const menuRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])
  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    const menuButton = menuButtonRef.current
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
      if (event.key !== 'Tab') return
      const controls = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input') || [])
      if (!controls.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      menuButton?.focus()
    }
  }, [menuOpen])

  const search = (event: React.FormEvent) => {
    event.preventDefault()
    if (query.trim()) {
      setMenuOpen(false)
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const navigation = (searchId: string) => <>
    <form className="sidebar-search" onSubmit={search} role="search">
      <Search aria-hidden="true" /><label className="sr-only" htmlFor={searchId}>搜索全部公式</label>
      <input id={searchId} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索情况或公式…" />
    </form>
    <nav className="main-nav" aria-label="主导航" onClick={() => setMenuOpen(false)}>
      <NavLink to="/" end><Box />首页</NavLink>
      <div className="nav-label">公式库</div>
      {categories.map((category) => <NavLink key={category.id} to={`/category/${category.id}`}><span className="nav-dot" style={{ backgroundColor: category.accent }} />{category.name}<span className="nav-arrow">→</span></NavLink>)}
      <div className="nav-label">我的学习</div>
      <NavLink to="/progress"><CheckCircle2 />学习进度</NavLink>
      <NavLink to="/favorites"><Heart />我的收藏</NavLink>
      <NavLink to="/guide"><BookOpen />记号与来源</NavLink>
    </nav>
    <div className="sidebar-note"><span className="status-dot" />3,408 条公式已完成记号解析</div>
  </>

  return (
    <div className="app-shell">
      <aside className="sidebar"><Brand />{navigation('global-search')}</aside>
      <header className="mobile-header"><Brand /><button ref={menuButtonRef} className="icon-button" onClick={() => setMenuOpen(true)} aria-label="打开导航" aria-expanded={menuOpen}><Menu /></button></header>
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)}>
        <aside ref={menuRef} className="mobile-menu" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-label="网站导航">
          <div className="mobile-menu-head"><Brand onNavigate={() => setMenuOpen(false)} /><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="关闭导航" autoFocus><X /></button></div>{navigation('mobile-global-search')}
        </aside>
      </div>}
      <main className="main-content"><Outlet context={learning} /><footer className="site-footer"><span>三阶魔方公式库</span><span>公式来源 SpeedCubeDB · 3D 由 cubing.js 驱动</span></footer></main>
      {learning.toast && <div className="toast" role="status">{learning.toast}</div>}
    </div>
  )
}
