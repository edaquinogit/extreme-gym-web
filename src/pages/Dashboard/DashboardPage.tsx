import { useAuth } from '../../hooks/useAuth'
import { API_URL } from '../../config/api'
import { MetricCard } from '../../components/ui/MetricCard'
import { useDashboardData } from './useDashboardData'
import ChartCard from '../../shared/components/charts/ChartCard'
import EmptyChartState from '../../shared/components/charts/EmptyChartState'
import PaymentsStatusChart from '../../shared/components/charts/PaymentsStatusChart'
import CheckinsLast7DaysChart from '../../shared/components/charts/CheckinsLast7DaysChart'
import RevenueByMonthChart from '../../shared/components/charts/RevenueByMonthChart'
import MatriculasStatusChart from '../../shared/components/charts/MatriculasStatusChart'

export function DashboardPage() {
  const { user } = useAuth()

  const firstName = (() => {
    const raw = user?.nome ?? user?.name ?? user?.username ?? user?.email ?? 'Admin'
    return raw.split(/[\s@]/)[0]
  })()

  const data = useDashboardData()

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
        <MetricCard title="Alunos ativos" value={data.alunosAtivos ?? '-'} helper="Base de alunos em acompanhamento" loading={data.loading} error={data.error ?? null} />

        <MetricCard title="Matriculas ativas" value={data.matriculasAtivas ?? '-'} helper="Contratos vigentes no periodo" loading={data.loading} error={data.error ?? null} />

        <MetricCard title="Pagamentos pendentes" value={data.pagamentosPendentes ?? '-'} helper="Itens financeiros a acompanhar" loading={data.loading} error={data.error ?? null} />

        <MetricCard title="Pagamentos vencidos" value={data.pagamentosVencidos ?? '-'} helper="Itens com vencimento atrasado" loading={data.loading} error={data.error ?? null} />

        <MetricCard title="Check-ins hoje" value={data.checkinsHoje ?? '-'} helper="Movimento registrado no dia" loading={data.loading} error={data.error ?? null} />

        <MetricCard title="Receita mensal" value={data.receitaMensal ?? '-'} helper="Resumo financeiro do mes" loading={data.loading} error={data.error ?? null} />
      </section>

      <section style={{ marginTop: 14 }}>
        <h2 style={{ margin: '8px 0 12px', fontSize: '1rem', fontWeight: 800 }}>Visão gerencial</h2>
        <div className="charts-grid">
          <ChartCard title="Status dos pagamentos" description="Distribuição dos pagamentos por situação financeira." loading={data.loading} error={data.error ?? null}>
            {data.pagamentosPorStatus && data.pagamentosPorStatus.length > 0 ? (
              <PaymentsStatusChart data={data.pagamentosPorStatus} />
            ) : (
              <EmptyChartState message="Nenhum pagamento registrado." />
            )}
          </ChartCard>

          <ChartCard title="Check-ins últimos 7 dias" description="Movimento registrado na academia nos últimos 7 dias." loading={data.loading} error={data.error ?? null}>
            {data.checkinsPorDia && data.checkinsPorDia.length > 0 ? (
              <CheckinsLast7DaysChart data={data.checkinsPorDia} />
            ) : (
              <EmptyChartState message="Sem registros recentes de check-in." />
            )}
          </ChartCard>
        </div>
      </section>

      <section style={{ marginTop: 14 }}>
        <h2 style={{ margin: '8px 0 12px', fontSize: '1rem', fontWeight: 800 }}>Financeiro e matrículas</h2>
        <div className="charts-grid">
          <ChartCard title="Receita (últimos 6 meses)" description="Receita confirmada a partir de pagamentos pagos." loading={data.loading} error={data.error ?? null}>
            {data.receitaPorMes && data.receitaPorMes.some((m) => m.value > 0) ? (
              <RevenueByMonthChart data={data.receitaPorMes} />
            ) : (
              <EmptyChartState message="Ainda nao ha receita suficiente nos ultimos meses." />
            )}
          </ChartCard>

          <ChartCard title="Matrículas por status" description="Situação atual das matrículas cadastradas." loading={data.loading} error={data.error ?? null}>
            {data.matriculasPorStatus && data.matriculasPorStatus.length > 0 ? (
              <MatriculasStatusChart data={data.matriculasPorStatus} />
            ) : (
              <EmptyChartState message="Nenhuma matrícula encontrada." />
            )}
          </ChartCard>
        </div>
        <div className="content-panel" style={{ padding: 14 }}>
          <strong style={{ display: 'block', marginBottom: 8 }}>Vencimentos proximos</strong>
          {data.loading ? (
            <small style={{ color: 'var(--color-text-muted)' }}>Carregando...</small>
          ) : data.proximosVencimentos && data.proximosVencimentos.length > 0 ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {data.proximosVencimentos.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.alunoNome ?? '—'}</div>
                    <small style={{ color: 'var(--color-text-muted)' }}>{p.dataVencimento}</small>
                  </div>
                  <div style={{ fontWeight: 700 }}>{p.valor ? p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 12 }}>
              <small style={{ color: 'var(--color-text-muted)' }}>Nenhum vencimento proximo nos proximos 14 dias.</small>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
