import { lazy, Suspense } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { DashboardRecepcao } from './DashboardRecepcao'
import { appPaths } from '../../app/routes/paths'
import { navigateTo } from '../../app/routes/router'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { MetricCard } from '../../components/ui/MetricCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useDashboardData, type DashboardPaymentItem } from './useDashboardData'
import ChartCard from '../../shared/components/charts/ChartCard'
import EmptyChartState from '../../shared/components/charts/EmptyChartState'

const PaymentsStatusChart = lazy(() => import('../../shared/components/charts/PaymentsStatusChart'))
const CheckinsLast7DaysChart = lazy(() => import('../../shared/components/charts/CheckinsLast7DaysChart'))
const RevenueByMonthChart = lazy(() => import('../../shared/components/charts/RevenueByMonthChart'))
const MatriculasStatusChart = lazy(() => import('../../shared/components/charts/MatriculasStatusChart'))

export function DashboardPage() {
  const { user } = useAuth()

  if (user?.role === 'RECEPCAO') {
    return <DashboardRecepcao />
  }

  return <AdminDashboard />
}

function AdminDashboard() {
  const { user } = useAuth()
  const data = useDashboardData()

  const firstName = resolveFirstName(user)
  const alerts = buildAlerts(data)

  const inadimplenciaVariant =
    (data.taxaInadimplencia ?? 0) >= 20 ? 'danger'
    : (data.taxaInadimplencia ?? 0) >= 10 ? 'warning'
    : 'default'

  const vencimentoVariant =
    (data.matriculasAVencer7dias ?? 0) >= 5 ? 'warning' : 'default'

  return (
    <div className="dashboard-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-text">
          <p className="page-kicker">PAINEL ADMIN</p>
          <h1>Ola, {firstName}.</h1>
        </div>
        <div className="dashboard-hero-badges">
          <span className="welcome-badge is-role">{user?.role ?? 'ADMIN'}</span>
          <span
            className={`api-status-dot ${
              data.loading ? 'is-loading' : data.error ? 'is-error' : 'is-ok'
            }`}
            title={
              data.loading ? 'Conectando...'
              : data.error ? 'API indisponivel'
              : 'API conectada'
            }
          />
        </div>
      </section>

      {/* ── KPIs primários ───────────────────────────────────────────────── */}
      <section className="metric-grid" aria-label="Indicadores principais">
        <MetricCard
          title="Alunos ativos"
          value={data.alunosAtivos ?? '-'}
          helper="Base operacional ativa"
          loading={data.loading}
          error={data.error ?? null}
          actionLabel="Ver alunos"
          onAction={() => navigateTo(withQuery(appPaths.alunos, { status: 'ATIVO' }))}
        />
        <MetricCard
          title="Matriculas ativas"
          value={data.matriculasAtivas ?? '-'}
          helper="Contratos vigentes"
          loading={data.loading}
          error={data.error ?? null}
          actionLabel="Ver matriculas"
          onAction={() => navigateTo(withQuery(appPaths.matriculas, { status: 'ATIVA' }))}
        />
        <MetricCard
          title="Check-ins hoje"
          value={data.checkinsHoje ?? '-'}
          helper="Entradas registradas no dia"
          loading={data.loading}
          error={data.error ?? null}
          actionLabel="Ver acessos"
          onAction={() => navigateTo(appPaths.checkins)}
        />
        <MetricCard
          title="Receita mensal"
          value={data.receitaMensal ?? '-'}
          helper="Pagamentos confirmados no mes"
          loading={data.loading}
          error={data.error ?? null}
          actionLabel="Ver pagos"
          onAction={() => navigateTo(withQuery(appPaths.pagamentos, { status: 'PAGO' }))}
        />
        <MetricCard
          title="Pagamentos pendentes"
          value={data.pagamentosPendentes ?? '-'}
          helper="Aguardando confirmacao"
          loading={data.loading}
          error={data.error ?? null}
          variant={(data.pagamentosPendentes ?? 0) >= 3 ? 'warning' : 'default'}
          actionLabel="Cobrar"
          onAction={() => navigateTo(withQuery(appPaths.pagamentos, { status: 'PENDENTE' }))}
        />
      </section>

      {/* ── KPIs secundários ─────────────────────────────────────────────── */}
      <section className="kpi-secondary" aria-label="Indicadores operacionais">
        <KpiSecondaryItem
          label="Inadimplencia"
          value={data.loading ? '...' : `${data.taxaInadimplencia ?? 0}%`}
          detail={data.inadimplentes !== undefined
            ? `${data.inadimplentes} aluno(s) com atraso`
            : undefined}
          variant={inadimplenciaVariant}
          loading={data.loading}
          onClick={() => navigateTo(withQuery(appPaths.alunos, { status: 'INADIMPLENTE' }))}
        />
        <KpiSecondaryItem
          label="Novos este mes"
          value={data.loading ? '...' : String(data.alunosNovosEsteMes ?? 0)}
          detail="Alunos cadastrados no periodo"
          variant="default"
          loading={data.loading}
          onClick={() => navigateTo(appPaths.alunos)}
        />
        <KpiSecondaryItem
          label="Vencendo em 7 dias"
          value={data.loading ? '...' : String(data.matriculasAVencer7dias ?? 0)}
          detail="Matriculas ativas proximas do vencimento"
          variant={vencimentoVariant}
          loading={data.loading}
          onClick={() => navigateTo(withQuery(appPaths.matriculas, { status: 'ATIVA' }))}
        />
        <KpiSecondaryItem
          label="Ticket medio"
          value={data.loading ? '...' : (data.ticketMedio ?? '-')}
          detail="Receita mensal por aluno ativo"
          variant="default"
          loading={data.loading}
          onClick={() => navigateTo(withQuery(appPaths.pagamentos, { status: 'PAGO' }))}
        />
      </section>

      {/* ── Alertas operacionais ─────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <section className="dashboard-alerts" aria-label="Alertas operacionais">
          {alerts.map((alert) => (
            <div
              key={alert.title}
              className={`dashboard-alert-item ${alert.isError ? 'is-error' : ''}`}
            >
              <div className="dashboard-alert-icon" aria-hidden="true">
                {alert.isError ? '!' : '~'}
              </div>
              <div className="dashboard-alert-body">
                <strong>{alert.title}</strong>
                <p>{alert.detail}</p>
              </div>
              <button
                className="ghost-button btn-sm"
                type="button"
                onClick={() => navigateTo(alert.path)}
              >
                {alert.actionLabel}
              </button>
            </div>
          ))}
        </section>
      )}

      {/* ── Fila de cobrança + Check-ins 7d ─────────────────────────────── */}
      <section className="dashboard-grid-2">
        <PaymentQueueCard
          items={data.pagamentosPendentesLista ?? []}
          loading={data.loading}
          onViewAll={() => navigateTo(withQuery(appPaths.pagamentos, { status: 'PENDENTE' }))}
        />
        <ChartCard
          title="Check-ins — ultimos 7 dias"
          description="Frequencia de entradas registradas na academia."
          loading={data.loading}
          error={data.error ?? null}
        >
          {data.checkinsPorDia && data.checkinsPorDia.length > 0 ? (
            <Suspense fallback={<ChartFallback />}>
              <CheckinsLast7DaysChart data={data.checkinsPorDia} />
            </Suspense>
          ) : (
            <EmptyChartState message="Nenhum check-in nos ultimos 7 dias." />
          )}
        </ChartCard>
      </section>

      {/* ── Receita 6m + Status pagamentos ──────────────────────────────── */}
      <section className="dashboard-grid-2">
        <ChartCard
          title="Receita — ultimos 6 meses"
          description="Pagamentos confirmados por mes."
          loading={data.loading}
          error={data.error ?? null}
        >
          {data.receitaPorMes && data.receitaPorMes.some((m) => m.value > 0) ? (
            <Suspense fallback={<ChartFallback />}>
              <RevenueByMonthChart data={data.receitaPorMes} />
            </Suspense>
          ) : (
            <EmptyChartState message="Nenhuma receita confirmada nos ultimos 6 meses." />
          )}
        </ChartCard>
        <ChartCard
          title="Distribuicao de pagamentos"
          description="Proporcao por situacao financeira."
          loading={data.loading}
          error={data.error ?? null}
        >
          {data.pagamentosPorStatus && data.pagamentosPorStatus.length > 0 ? (
            <Suspense fallback={<ChartFallback />}>
              <PaymentsStatusChart data={data.pagamentosPorStatus} />
            </Suspense>
          ) : (
            <EmptyChartState message="Nenhum pagamento registrado ainda." />
          )}
        </ChartCard>
      </section>

      {/* ── Matriculas por status ────────────────────────────────────────── */}
      <section className="dashboard-grid-2">
        <ChartCard
          title="Matriculas por status"
          description="Situacao atual dos contratos cadastrados."
          loading={data.loading}
          error={data.error ?? null}
        >
          {data.matriculasPorStatus && data.matriculasPorStatus.length > 0 ? (
            <Suspense fallback={<ChartFallback />}>
              <MatriculasStatusChart data={data.matriculasPorStatus} />
            </Suspense>
          ) : (
            <EmptyChartState message="Nenhuma matricula encontrada." />
          )}
        </ChartCard>
      </section>

    </div>
  )
}

/* ── Sub-componentes ──────────────────────────────────────────────────────── */

type KpiSecondaryItemProps = {
  label: string
  value: string
  detail?: string
  variant: 'default' | 'warning' | 'danger'
  loading: boolean
  onClick: () => void
}

function KpiSecondaryItem({ label, value, detail, variant, loading, onClick }: KpiSecondaryItemProps) {
  return (
    <button
      type="button"
      className={`kpi-secondary-item kpi-secondary-item--${variant}`}
      onClick={onClick}
    >
      <span className="kpi-secondary-label">{label}</span>
      {loading ? (
        <span className="kpi-secondary-value kpi-secondary-value--loading">
          <LoadingSpinner size={16} />
        </span>
      ) : (
        <span className="kpi-secondary-value">{value}</span>
      )}
      {detail && <span className="kpi-secondary-detail">{detail}</span>}
    </button>
  )
}

function PaymentQueueCard({
  items,
  loading,
  onViewAll,
}: {
  items: DashboardPaymentItem[]
  loading: boolean
  onViewAll: () => void
}) {
  return (
    <article className="operation-card">
      <header className="operation-card-header">
        <strong>Fila de cobranca</strong>
        <button className="ghost-button btn-sm" type="button" onClick={onViewAll}>
          Ver todos
        </button>
      </header>

      {loading ? (
        <div className="operation-card-loading">
          <LoadingSpinner size={18} />
          <span>Carregando...</span>
        </div>
      ) : items.length > 0 ? (
        <div className="operation-list">
          {items.map((item) => (
            <button
              key={item.id}
              className="operation-item"
              type="button"
              onClick={onViewAll}
            >
              <strong>{item.alunoNome ?? `Pagamento #${item.id}`}</strong>
              <span className="operation-item-side">
                <StatusBadge status={item.status} />
                <strong>{formatMoney(item.valor)}</strong>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="operation-empty">Nenhum pagamento pendente.</p>
      )}
    </article>
  )
}

function ChartFallback() {
  return (
    <div className="chart-loading-fallback">
      <LoadingSpinner size={18} />
      <small>Carregando...</small>
    </div>
  )
}

/* ── Utilitários ──────────────────────────────────────────────────────────── */

type Alert = {
  title: string
  detail: string
  actionLabel: string
  path: string
  isError: boolean
}

function buildAlerts(data: ReturnType<typeof useDashboardData>): Alert[] {
  if (data.loading || data.error) return []

  const alerts: Alert[] = []

  if ((data.taxaInadimplencia ?? 0) >= 15) {
    alerts.push({
      title: `Inadimplencia em ${data.taxaInadimplencia}% da base ativa`,
      detail: `${data.inadimplentes} aluno(s) com pagamento em atraso. Acoes preventivas reduzem churn.`,
      actionLabel: 'Ver inadimplentes',
      path: withQuery(appPaths.alunos, { status: 'INADIMPLENTE' }),
      isError: (data.taxaInadimplencia ?? 0) >= 25,
    })
  }

  if ((data.pagamentosPendentes ?? 0) >= 3) {
    alerts.push({
      title: `${data.pagamentosPendentes} pagamento(s) aguardando confirmacao`,
      detail: 'Confirme recebimentos para manter o fluxo financeiro atualizado.',
      actionLabel: 'Confirmar',
      path: withQuery(appPaths.pagamentos, { status: 'PENDENTE' }),
      isError: (data.pagamentosPendentes ?? 0) >= 8,
    })
  }

  if ((data.matriculasAVencer7dias ?? 0) > 0) {
    alerts.push({
      title: `${data.matriculasAVencer7dias} matricula(s) vencem nos proximos 7 dias`,
      detail: 'Entre em contato proativamente para garantir renovacoes.',
      actionLabel: 'Ver matriculas',
      path: withQuery(appPaths.matriculas, { status: 'ATIVA' }),
      isError: false,
    })
  }

  if (data.checkinsHoje === 0) {
    alerts.push({
      title: 'Nenhum check-in registrado hoje',
      detail: 'Verifique se a operacao de acesso esta ativa.',
      actionLabel: 'Ver acessos',
      path: appPaths.checkins,
      isError: false,
    })
  }

  return alerts
}

function resolveFirstName(
  user: { nome?: string; name?: string; username?: string; email?: string } | null | undefined,
) {
  const raw = user?.nome ?? user?.name ?? user?.username ?? user?.email ?? 'Admin'
  return raw.split(/[\s@]/)[0]
}

function withQuery(path: string, params: Record<string, string>) {
  return `${path}?${new URLSearchParams(params).toString()}`
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
