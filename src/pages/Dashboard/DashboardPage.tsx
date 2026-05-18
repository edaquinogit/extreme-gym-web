import { useAuth } from '../../hooks/useAuth'
import { API_URL } from '../../config/api'
import { dashboardSummary } from './dashboardSummary'

export function DashboardPage() {
  const { user } = useAuth()

  const firstName = (() => {
    const raw = user?.nome ?? user?.name ?? user?.username ?? user?.email ?? 'Admin'
    return raw.split(/[\s@]/)[0]
  })()

  return (
    <>
      <section className="dashboard-welcome-banner">
        <div className="dashboard-welcome-content">
          <p className="page-kicker">BEM-VINDO</p>
          <h1>Ola, {firstName}.</h1>
          <p className="page-description">
            Gerencie a operacao da academia com visibilidade centralizada
            e fluxos integrados a API.
          </p>
        </div>
        <div className="dashboard-welcome-badges">
          <span className="welcome-badge is-role">{user?.role ?? 'ADMIN'}</span>
          <span className="welcome-badge is-status">API conectada</span>
          <span className="welcome-badge is-url">{API_URL}</span>
        </div>
      </section>

      <section className="dashboard-overview" aria-label="Resumo operacional">
        <article className="overview-panel">
          <span className="overview-label">Operacao</span>
          <strong>Ambiente administrativo ativo</strong>
          <p>
            Use o menu lateral para acompanhar alunos, planos, matriculas,
            pagamentos e check-ins em um fluxo unico de atendimento.
          </p>
        </article>

        <article className="overview-panel is-compact">
          <span className="overview-label">Status</span>
          <strong>API conectada</strong>
          <p>Dados carregados diretamente dos modulos disponiveis.</p>
        </article>
      </section>

      <section className="metric-grid">
        {dashboardSummary.map((item) => (
          <article className="metric-card" key={item.label}>
            <div className="metric-card-header">
              <span>{item.label}</span>
              <i aria-hidden="true" />
            </div>
            <strong>{item.value}</strong>
            <small>{item.helper}</small>
          </article>
        ))}
      </section>
    </>
  )
}
