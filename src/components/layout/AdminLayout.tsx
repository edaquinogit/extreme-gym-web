import { useState, type ReactNode } from 'react'
import { appPaths } from '../../app/routes/paths'
import { navigateTo, useCurrentPath } from '../../app/routes/router'
import { useAuth } from '../../hooks/useAuth'

const navigationItems = [
  { label: 'Dashboard', path: appPaths.dashboard },
  { label: 'Alunos', path: appPaths.alunos },
  { label: 'Planos', path: appPaths.planos },
  { label: 'Matriculas', path: appPaths.matriculas },
  { label: 'Pagamentos', path: appPaths.pagamentos },
  { label: 'Check-ins', path: appPaths.checkins },
]

type AdminLayoutProps = {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${isMenuOpen ? 'is-open' : ''}`}>
        <div className="brand-block">
          <span className="brand-mark">EG</span>
          <div>
            <strong>Extreme Gym</strong>
            <small>Admin Web</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegacao principal">
          {navigationItems.map((item) => (
            <button
              className={currentPath === item.path ? 'nav-link is-active' : 'nav-link'}
              key={item.path}
              type="button"
              onClick={() => handleNavigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button
            className="icon-button menu-button"
            type="button"
            aria-label="Abrir menu"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            <span />
            <span />
            <span />
          </button>

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
