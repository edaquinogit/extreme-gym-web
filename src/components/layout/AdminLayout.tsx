import { useState, type ReactNode } from 'react'
import { appPaths } from '../../app/routes/paths'
import { navigateTo, useCurrentPath } from '../../app/routes/router'
import { useAuth } from '../../hooks/useAuth'

const navigationItems = [
  { compactLabel: 'IN', label: 'Inicio', path: appPaths.dashboard },
  { compactLabel: 'AL', label: 'Alunos', path: appPaths.alunos },
  { compactLabel: 'PL', label: 'Planos', path: appPaths.planos },
  { compactLabel: 'MA', label: 'Matriculas', path: appPaths.matriculas },
  { compactLabel: 'PG', label: 'Pagamentos', path: appPaths.pagamentos },
  { compactLabel: 'CH', label: 'Check-ins', path: appPaths.checkins },
  { compactLabel: 'AC', label: 'Acesso', path: appPaths.acessos },
  { compactLabel: 'CA', label: 'Catraca', path: appPaths.catraca },
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
  const userInitials = userLabel
    .split(/[\s@]/)[0]
    .split('')
    .slice(0, 2)
    .map((char) => char.toUpperCase())
    .join('')
  const sidebarClassName = [
    'admin-sidebar',
    isMenuOpen ? 'is-open' : '',
    isSidebarCollapsed ? 'is-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const currentNavItem = navigationItems.find((i) => i.path === currentPath)

  return (
    <div className={`admin-layout ${isSidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <button
        className={`sidebar-overlay ${isMenuOpen ? 'is-visible' : ''}`}
        type="button"
        aria-label="Fechar menu"
        onClick={() => setIsMenuOpen(false)}
      />

      <aside className={sidebarClassName} aria-label="Barra lateral principal">
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
          {navigationItems.map((item) => {
            const isActive = currentPath === item.path
            return (
              <button
                className={`nav-link ${isActive ? 'is-active' : ''}`}
                key={item.path}
                title={item.label}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavigate(item.path)}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.compactLabel}
                </span>
                <span className="nav-label">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-user-block" role="region" aria-label="Informacoes do usuario">
          <div className="sidebar-user-avatar" aria-hidden>
            {userInitials}
          </div>
          <div className="sidebar-user-info">
            <strong>{userLabel}</strong>
            <small>{user?.role ?? 'Admin'}</small>
          </div>
        </div>
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
              <strong>{currentNavItem?.label ?? 'Painel administrativo'}</strong>
              <span>{currentNavItem ? 'Area de ' + currentNavItem.label.toLowerCase() : 'Operacao Extreme Gym'}</span>
            </div>
          </div>

          <div className="header-user">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="sidebar-user-avatar" aria-hidden style={{ width: 36, height: 36 }}>
                {userInitials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 700 }}>{userLabel}</span>
                <small style={{ color: 'var(--color-text-muted)' }}>{user?.role ?? 'Admin'}</small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="ghost-button" type="button" onClick={() => handleNavigate(appPaths.alunos)} title="Ir para Alunos">
                Alunos
              </button>
              <button className="primary-button" type="button" onClick={handleLogout} aria-label="Sair">
                Sair
              </button>
            </div>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}
