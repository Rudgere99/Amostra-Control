import React, { useEffect, useState } from 'react'
import { Bell, LogIn, Menu, Search } from '../components/LocalIcons.jsx'
import TrindadeLogo from '../components/TrindadeLogo.jsx'

export default function AppLayout({ children, navItems, activePage, onChangePage, loggedUser, onLogout }) {
  const [clock, setClock] = useState('--:--:--')
  const [date, setDate] = useState('--/--/----')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setClock(now.toLocaleTimeString('pt-BR'))
      setDate(now.toLocaleDateString('pt-BR'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <TrindadeLogo />
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activePage === item.id ? 'nav-item--active' : ''}`}
                onClick={() => {
                  onChangePage(item.id)
                  setMobileOpen(false)
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-user">
          <div>
            <span>Usuário logado</span>
            <strong>{loggedUser?.name || 'Operador'}</strong>
            <small>{loggedUser?.badge || 'Sem matrícula'}</small>
          </div>
          <button className="sidebar-logout" type="button" onClick={onLogout}>
            <LogIn size={16} /> Sair
          </button>
        </div>

        <div className="sidebar__footer">
          <span>MonPlant Style</span>
          <strong>v1.0</strong>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-only" type="button" onClick={() => setMobileOpen(!mobileOpen)}>
            <Menu size={21} />
          </button>

          <div className="topbar__search">
            <Search size={18} />
            <input placeholder="Buscar horário, status, amostrador..." />
          </div>

          <div className="topbar__right">
            <button className="notification-btn" type="button">
              <Bell size={18} />
              <span></span>
            </button>
            <div className="clock-card">
              <strong>{clock}</strong>
              <span>{date}</span>
            </div>
          </div>
        </header>

        <section className="content-area">
          {children}
        </section>
      </main>
    </div>
  )
}
