import { useState, type ReactNode } from 'react'
import { appPaths } from '../../app/routes/paths'
import { navigateTo, useCurrentPath } from '../../app/routes/router'
import { useAuth } from '../../hooks/useAuth'

const navigationItems = [
  { compactLabel: 'D', label: 'Dashboard', path: appPaths.dashboard },
  { compactLabel: 'A', label: 'Alunos', path: appPaths.alunos },
  { compactLabel: 'P', label: 'Planos', path: appPaths.planos },
  { compactLabel: 'M', label: 'Matriculas', path: appPaths.matriculas },
  { compactLabel: '$', label: 'Pagamentos', path: appPaths.pagamentos },
  { compactLabel: 'C', label: 'Check-ins', path: appPaths.checkins },
  { compactLabel: 'A', label: 'Acesso', path: appPaths.acessos },
  { compactLabel: '⬡', label: 'Catraca', path: appPaths.catraca },
]

type AdminLayoutProps = {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const currentPath = useCurrentPath()
  const { logout, user } = useAuth()

  function handleNavigate(path: string) {
    navigateTo(path)
    setIsMenuOpen(false)
  }

  function handleLogout() {
    logout()
    navigateTo(appPaths.login)
  }

  const userLabel = user?.nome ?? user?.name ?? user?.email ?? user?.username ?? 'Admin'
  const sidebarClassName = [
    'admin-sidebar',
    isMenuOpen ? 'is-open' : '',
    isSidebarCollapsed ? 'is-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`admin-layout ${isSidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <button
        className={`sidebar-overlay ${isMenuOpen ? 'is-visible' : ''}`}
        type="button"
        aria-label="Fechar menu"
        onClick={() => setIsMenuOpen(false)}
      />

      <aside className={sidebarClassName}>
        <div className="sidebar-top">
          <div className="brand-block">
            <span className="brand-mark">EG</span>
            <div className="brand-copy">
              <strong>Extreme Gym</strong>
              <small>Painel administrativo</small>
            </div>
          </div>

          <button
            className="icon-button sidebar-toggle"
            type="button"
            aria-label={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-pressed={isSidebarCollapsed}
            onClick={() => setIsSidebarCollapsed((isCollapsed) => !isCollapsed)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className="brand-block mobile-brand">
          <span className="brand-mark">EG</span>
          <div className="brand-copy">
            <strong>Extreme Gym</strong>
            <small>Painel administrativo</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegacao principal">
          {navigationItems.map((item) => (
            <button
              className={currentPath === item.path ? 'nav-link is-active' : 'nav-link'}
              key={item.path}
              title={item.label}
              type="button"
              onClick={() => handleNavigate(item.path)}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.compactLabel}
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="header-start">
            <button
              className="icon-button menu-button"
              type="button"
              aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            >
              <span />
              <span />
              <span />
            </button>

            <div className="header-context">
              <strong>Painel administrativo</strong>
              <span>Operacao Extreme Gym</span>
            </div>
          </div>

          <div className="header-user">
            <span>{userLabel}</span>
            <button className="ghost-button" type="button" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}
