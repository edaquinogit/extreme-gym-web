import { lazy, Suspense } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { API_URL } from '../../config/api'
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

type DashboardAction = {
  title: string
  detail: string
  tone?: 'normal' | 'error' | 'success'
  actionLabel: string
  path: string
}

export function DashboardPage() {
  const { user } = useAuth()

  const firstName = (() => {
    const raw = user?.nome ?? user?.name ?? user?.username ?? user?.email ?? 'Admin'
    return raw.split(/[\s@]/)[0]
  })()

  const data = useDashboardData()

  const dashboardActions: DashboardAction[] = []

  if (!data.loading && !data.error) {
    if (data.pagamentosVencidos && data.pagamentosVencidos > 0) {
      dashboardActions.push({
        title: 'Existem pagamentos vencidos para acompanhar.',
        detail: 'Priorize a recuperacao financeira e contacte os clientes com atraso.',
        tone: 'error',
        actionLabel: 'Ver vencidos',
        path: withQuery(appPaths.pagamentos, { status: 'ATRASADO' }),
      })
    }

    if (data.pagamentosPendentes && data.pagamentosPendentes > 0) {
      dashboardActions.push({
        title: 'Há pagamentos pendentes.',
        detail: 'Verifique boletos e confirmações para reduzir inadimplência.',
        actionLabel: 'Ver pendentes',
        path: withQuery(appPaths.pagamentos, { status: 'PENDENTE' }),
      })
    }

    if (data.checkinsHoje !== undefined && data.checkinsHoje === 0) {
      dashboardActions.push({
        title: 'Nenhum check-in registrado hoje.',
        detail: 'Acompanhe a frequencia dos alunos para identificar fluxos de atendimento.',
        actionLabel: 'Abrir check-ins',
        path: appPaths.checkins,
      })
    }

    if (data.proximosVencimentos && data.proximosVencimentos.length > 0) {
      dashboardActions.push({
        title: 'Há próximos vencimentos agendados.',
        detail: 'Fique atento a pagamentos e renovações nos próximos 14 dias.',
        actionLabel: 'Ver agenda',
        path: withQuery(appPaths.pagamentos, { status: 'PENDENTE' }),
      })
    }
  }

  function goTo(path: string) {
    navigateTo(path)
  }

  return (
    <div className="dashboard-page">
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
          <span className="welcome-badge is-status">{data.loading ? 'Conectando...' : data.error ? 'API indisponivel' : 'API conectada'}</span>
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
          <strong>{data.loading ? 'Carregando dados...' : data.error ? 'Erro nos dados' : 'Dados atualizados'}</strong>
          <p>{data.error ?? 'Dados carregados diretamente dos modulos disponiveis.'}</p>
        </article>
      </section>

      <section className="metric-grid">
        <MetricCard
          title="Alunos ativos"
          value={data.alunosAtivos ?? '-'}
          helper="Base de alunos em acompanhamento"
          loading={data.loading}
          error={data.error ?? null}
          actionLabel="Ver alunos"
          onAction={() => goTo(withQuery(appPaths.alunos, { status: 'ATIVO' }))}
        />

        <MetricCard
          title="Matriculas ativas"
          value={data.matriculasAtivas ?? '-'}
          helper="Contratos vigentes no periodo"
          loading={data.loading}
          error={data.error ?? null}
          actionLabel="Ver matriculas"
          onAction={() => goTo(withQuery(appPaths.matriculas, { status: 'ATIVA' }))}
        />

        <MetricCard
          title="Pagamentos pendentes"
          value={data.pagamentosPendentes ?? '-'}
          helper="Itens financeiros a acompanhar"
          loading={data.loading}
          error={data.error ?? null}
          actionLabel="Cobrar"
          onAction={() => goTo(withQuery(appPaths.pagamentos, { status: 'PENDENTE' }))}
        />

        <MetricCard
          title="Pagamentos vencidos"
          value={data.pagamentosVencidos ?? '-'}
          helper="Itens com vencimento atrasado"
          loading={data.loading}
          error={data.error ?? null}
          actionLabel="Regularizar"
          onAction={() => goTo(withQuery(appPaths.pagamentos, { status: 'ATRASADO' }))}
        />

        <MetricCard
          title="Check-ins hoje"
          value={data.checkinsHoje ?? '-'}
          helper="Movimento registrado no dia"
          loading={data.loading}
          error={data.error ?? null}
          actionLabel="Ver acessos"
          onAction={() => goTo(appPaths.checkins)}
        />

        <MetricCard
          title="Receita mensal"
          value={data.receitaMensal ?? '-'}
          helper="Resumo financeiro do mes"
          loading={data.loading}
          error={data.error ?? null}
          actionLabel="Ver pagos"
          onAction={() => goTo(withQuery(appPaths.pagamentos, { status: 'PAGO' }))}
        />
      </section>

      <section className="dashboard-actions">
        <div className="dashboard-actions-header">
          <div>
            <span className="overview-label">Resumo operacional</span>
            <h2>Atenção imediata</h2>
            <p>Os principais pontos abaixo ajudam a priorizar as decisoes de gestao do dia.</p>
          </div>
        </div>

        <div className="dashboard-action-list">
          {data.loading ? (
            <div className="dashboard-action-item">
              <LoadingSpinner size={18} />
              <div>
                <strong>Carregando recomendacoes do painel</strong>
                <p>Os dados estão sendo carregados diretamente da API.</p>
              </div>
            </div>
          ) : data.error ? (
            <div className="dashboard-action-item dashboard-action-item--error">
              <strong>Erro ao carregar as recomendacoes</strong>
              <p>{data.error}</p>
            </div>
          ) : dashboardActions.length > 0 ? (
            dashboardActions.map((action) => (
              <div key={action.title} className={`dashboard-action-item ${action.tone === 'error' ? 'dashboard-action-item--error' : ''}`}>
                <div className="dashboard-action-icon" aria-hidden />
                <div>
                  <strong>{action.title}</strong>
                  <p>{action.detail}</p>
                </div>
                <button className="ghost-button btn-sm" type="button" onClick={() => goTo(action.path)}>
                  {action.actionLabel}
                </button>
              </div>
            ))
          ) : (
            <div className="dashboard-action-item dashboard-action-item--success">
              <div className="dashboard-action-icon" aria-hidden />
              <div>
                <strong>Painel pronto para uso</strong>
                <p>Os dados estão atualizados e o fluxo operacional está visivel.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Fila operacional</h2>
        <p className="section-description">Itens prontos para acao, com foco em cobrança e vencimentos proximos.</p>
        <div className="operations-grid">
          <PaymentQueueCard
            title="Cobranças vencidas"
            emptyMessage="Nenhum pagamento vencido na fila."
            items={data.pagamentosVencidosLista ?? []}
            loading={data.loading}
            onViewAll={() => goTo(withQuery(appPaths.pagamentos, { status: 'ATRASADO' }))}
          />
          <PaymentQueueCard
            title="Pagamentos pendentes"
            emptyMessage="Nenhum pagamento pendente na fila."
            items={data.pagamentosPendentesLista ?? []}
            loading={data.loading}
            onViewAll={() => goTo(withQuery(appPaths.pagamentos, { status: 'PENDENTE' }))}
          />
          <PaymentQueueCard
            title="Vencimentos nos proximos 14 dias"
            emptyMessage="Nenhum vencimento previsto para os proximos 14 dias."
            items={data.proximosVencimentos ?? []}
            loading={data.loading}
            onViewAll={() => goTo(withQuery(appPaths.pagamentos, { status: 'PENDENTE' }))}
          />
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Visão gerencial</h2>
        <p className="section-description">Indicadores que mostram a situação financeira e o movimento de acesso.</p>
        <div className="charts-grid">
          <ChartCard title="Status dos pagamentos" description="Distribuição dos pagamentos por situação financeira." loading={data.loading} error={data.error ?? null}>
            {data.pagamentosPorStatus && data.pagamentosPorStatus.length > 0 ? (
              <Suspense fallback={<div className="chart-loading-fallback"><LoadingSpinner size={18} /><small>Carregando gráfico...</small></div>}>
                <PaymentsStatusChart data={data.pagamentosPorStatus} />
              </Suspense>
            ) : (
              <EmptyChartState message="Nenhum pagamento registrado ainda. Registre cobranças para visualizar a distribuição financeira." />
            )}
          </ChartCard>

          <ChartCard title="Check-ins últimos 7 dias" description="Movimento registrado na academia nos últimos 7 dias." loading={data.loading} error={data.error ?? null}>
            {data.checkinsPorDia && data.checkinsPorDia.length > 0 ? (
              <Suspense fallback={<div className="chart-loading-fallback"><LoadingSpinner size={18} /><small>Carregando gráfico...</small></div>}>
                <CheckinsLast7DaysChart data={data.checkinsPorDia} />
              </Suspense>
            ) : (
              <EmptyChartState message="Nenhum check-in encontrado nos últimos 7 dias. Os movimentos aparecerão aqui conforme os alunos acessarem a academia." />
            )}
          </ChartCard>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Financeiro e matrículas</h2>
        <p className="section-description">Dados financeiros e de matriculas para apoiar o controle operacional.</p>
        <div className="charts-grid">
          <ChartCard title="Receita (últimos 6 meses)" description="Receita confirmada a partir de pagamentos pagos." loading={data.loading} error={data.error ?? null}>
            {data.receitaPorMes && data.receitaPorMes.some((m) => m.value > 0) ? (
              <Suspense fallback={<div className="chart-loading-fallback"><LoadingSpinner size={18} /><small>Carregando gráfico...</small></div>}>
                <RevenueByMonthChart data={data.receitaPorMes} />
              </Suspense>
            ) : (
              <EmptyChartState message="Ainda não há receita confirmada nos últimos 6 meses. Pagamentos PAGO serão exibidos aqui." />
            )}
          </ChartCard>

          <ChartCard title="Matrículas por status" description="Situação atual das matrículas cadastradas." loading={data.loading} error={data.error ?? null}>
            {data.matriculasPorStatus && data.matriculasPorStatus.length > 0 ? (
              <Suspense fallback={<div className="chart-loading-fallback"><LoadingSpinner size={18} /><small>Carregando gráfico...</small></div>}>
                <MatriculasStatusChart data={data.matriculasPorStatus} />
              </Suspense>
            ) : (
              <EmptyChartState message="Nenhuma matrícula encontrada. Cadastre matriculas para acompanhar o desempenho." />
            )}
          </ChartCard>
        </div>
        <div className="content-panel upcoming-due-panel">
          <strong>Vencimentos proximos</strong>
          {data.loading ? (
            <small>Carregando...</small>
          ) : data.proximosVencimentos && data.proximosVencimentos.length > 0 ? (
            <div className="upcoming-due-list">
              {data.proximosVencimentos.map((p) => (
                <div key={p.id} className="upcoming-due-item">
                  <div>
                    <div>{p.alunoNome ?? '—'}</div>
                    <small>{p.dataVencimento}</small>
                  </div>
                  <div>{p.valor ? p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="upcoming-due-empty">
              <small>Nenhum vencimento proximo nos proximos 14 dias.</small>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function PaymentQueueCard({
  emptyMessage,
  items,
  loading,
  onViewAll,
  title,
}: {
  emptyMessage: string
  items: DashboardPaymentItem[]
  loading: boolean
  onViewAll: () => void
  title: string
}) {
  return (
    <article className="operation-card">
      <header className="operation-card-header">
        <strong>{title}</strong>
        <button className="ghost-button btn-sm" type="button" onClick={onViewAll}>
          Ver todos
        </button>
      </header>

      {loading ? (
        <div className="operation-card-loading">
          <LoadingSpinner size={18} />
          <span>Carregando fila...</span>
        </div>
      ) : items.length > 0 ? (
        <div className="operation-list">
          {items.map((item) => (
            <button
              key={`${title}-${item.id}`}
              className="operation-item"
              type="button"
              onClick={onViewAll}
            >
              <span>
                <strong>{item.alunoNome ?? `Pagamento #${item.id}`}</strong>
                <small>
                  {item.dataVencimento ? `Vence em ${formatDateOnly(item.dataVencimento)}` : 'Sem vencimento informado'}
                </small>
              </span>
              <span className="operation-item-side">
                <StatusBadge status={item.status} />
                <strong>{formatMoney(item.valor)}</strong>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="operation-empty">{emptyMessage}</p>
      )}
    </article>
  )
}

function withQuery(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params)
  return `${path}?${search.toString()}`
}

function formatDateOnly(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
