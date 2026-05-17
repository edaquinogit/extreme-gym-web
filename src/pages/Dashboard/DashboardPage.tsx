import { PageHeader } from '../../components/ui/PageHeader'
import { dashboardSummary } from './dashboardSummary'

export function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Visao geral da operacao"
        description="Acompanhe os principais sinais da academia e acesse rapidamente as areas de gestao."
      />

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
