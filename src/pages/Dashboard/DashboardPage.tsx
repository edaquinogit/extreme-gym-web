import { PageHeader } from '../../components/ui/PageHeader'
import { dashboardSummary } from './dashboardSummary'

export function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Visao geral da operacao"
        description="Indicadores preparados para receber dados reais da Extreme Gym API quando os endpoints agregados estiverem disponiveis."
      />

      <section className="metric-grid">
        {dashboardSummary.map((item) => (
          <article className="metric-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.helper}</small>
          </article>
        ))}
      </section>
    </>
  )
}
