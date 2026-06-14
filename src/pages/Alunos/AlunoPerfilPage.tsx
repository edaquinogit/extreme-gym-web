import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApiError } from '../../hooks/useApiError'
import { navigateTo } from '../../app/routes/router'
import { appPaths } from '../../app/routes/paths'
import { alunoService } from '../../services/alunoService'
import { matriculaService } from '../../services/matriculaService'
import { pagamentoService } from '../../services/pagamentoService'
import { checkinService } from '../../services/checkinService'
import type { Aluno } from '../../types/aluno'
import type { Matricula } from '../../types/matricula'
import type { Pagamento } from '../../types/pagamento'
import type { Checkin } from '../../types/checkin'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'

type LoadState = 'idle' | 'loading' | 'error'

type PerfilData = {
  aluno: Aluno | null
  matriculas: Matricula[]
  pagamentos: Pagamento[]
  checkins: Checkin[]
}

const EMPTY: PerfilData = { aluno: null, matriculas: [], pagamentos: [], checkins: [] }

export function AlunoPerfilPage({ alunoId }: { alunoId: number }) {
  const [data, setData] = useState<PerfilData>(EMPTY)
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { getErrorMessage } = useApiError()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadState('loading')
      setErrorMessage(null)

      try {
        const [aluno, matriculas, checkins] = await Promise.all([
          alunoService.buscar(alunoId),
          matriculaService.listarPorAluno(alunoId),
          checkinService.listarPorAluno(alunoId),
        ])

        const ativa = matriculas.find((m) => m.status === 'ATIVA')
        const pagamentos = ativa
          ? await pagamentoService.listarPorMatricula(ativa.id)
          : []

        if (!cancelled) {
          setData({ aluno, matriculas, pagamentos, checkins })
          setLoadState('idle')
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error))
          setLoadState('error')
        }
      }
    }

    void load()
    return () => { cancelled = true }
  }, [alunoId]) // eslint-disable-line react-hooks/exhaustive-deps

  const { aluno, matriculas, pagamentos, checkins } = data
  const matriculaAtiva = matriculas.find((m) => m.status === 'ATIVA')

  if (loadState === 'loading') {
    return <StateMessage title="Carregando perfil do aluno..." />
  }

  if (loadState === 'error' || !aluno) {
    return (
      <StateMessage
        title="Nao foi possivel carregar o perfil"
        description={errorMessage ?? 'Aluno nao encontrado.'}
      />
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Alunos"
        title={aluno.nome}
        description={`Perfil completo — dados, matricula, pagamentos e check-ins.`}
        action={
          <button
            className="ghost-button compact"
            type="button"
            onClick={() => navigateTo(appPaths.alunos)}
          >
            Voltar para alunos
          </button>
        }
      />

      <div className="perfil-grid">
        <section className="content-panel perfil-section">
          <h3 className="perfil-section-title">Dados pessoais</h3>
          <dl className="perfil-dl">
            <div className="perfil-dl-row">
              <dt>ID</dt>
              <dd>{aluno.id}</dd>
            </div>
            <div className="perfil-dl-row">
              <dt>Nome</dt>
              <dd>{aluno.nome}</dd>
            </div>
            <div className="perfil-dl-row">
              <dt>Email</dt>
              <dd>{aluno.email}</dd>
            </div>
            <div className="perfil-dl-row">
              <dt>Telefone</dt>
              <dd>{aluno.telefone}</dd>
            </div>
            <div className="perfil-dl-row">
              <dt>Status</dt>
              <dd><StatusBadge status={aluno.status} /></dd>
            </div>
            <div className="perfil-dl-row">
              <dt>Cadastro</dt>
              <dd>{formatDate(aluno.dataCadastro)}</dd>
            </div>
          </dl>
        </section>

        <section className="content-panel perfil-section">
          <h3 className="perfil-section-title">Matricula ativa</h3>
          {matriculaAtiva ? (
            <dl className="perfil-dl">
              <div className="perfil-dl-row">
                <dt>Plano</dt>
                <dd>{matriculaAtiva.planoNome}</dd>
              </div>
              <div className="perfil-dl-row">
                <dt>Inicio</dt>
                <dd>{formatDate(matriculaAtiva.dataInicio)}</dd>
              </div>
              <div className="perfil-dl-row">
                <dt>Validade</dt>
                <dd>{formatDate(matriculaAtiva.dataFim)}</dd>
              </div>
              <div className="perfil-dl-row">
                <dt>Status</dt>
                <dd><StatusBadge status={matriculaAtiva.status} /></dd>
              </div>
            </dl>
          ) : (
            <p className="perfil-empty">Nenhuma matricula ativa no momento.</p>
          )}

          {matriculas.filter((m) => m.status !== 'ATIVA').length > 0 && (
            <details className="perfil-historico-toggle">
              <summary>Ver historico de matriculas ({matriculas.length - (matriculaAtiva ? 1 : 0)})</summary>
              <table className="perfil-table">
                <thead>
                  <tr><th>Plano</th><th>Inicio</th><th>Fim</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {matriculas
                    .filter((m) => m.status !== 'ATIVA')
                    .map((m) => (
                      <tr key={m.id}>
                        <td>{m.planoNome}</td>
                        <td>{formatDate(m.dataInicio)}</td>
                        <td>{formatDate(m.dataFim)}</td>
                        <td><StatusBadge status={m.status} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </details>
          )}
        </section>

        <section className="content-panel perfil-section">
          <h3 className="perfil-section-title">Pagamentos</h3>
          {pagamentos.length === 0 ? (
            <p className="perfil-empty">
              {matriculaAtiva
                ? 'Nenhum pagamento registrado para a matricula ativa.'
                : 'Sem matricula ativa — sem pagamentos para exibir.'}
            </p>
          ) : (
            <table className="perfil-table">
              <thead>
                <tr><th>Valor</th><th>Forma</th><th>Status</th><th>Data</th></tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td>{formatCurrency(p.valor)}</td>
                    <td>{p.formaPagamento ?? '—'}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>{formatDate(p.dataPagamento ?? p.dataCadastro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="content-panel perfil-section">
          <h3 className="perfil-section-title">Ultimos check-ins</h3>
          {checkins.length === 0 ? (
            <p className="perfil-empty">Nenhum check-in registrado.</p>
          ) : (
            <table className="perfil-table">
              <thead>
                <tr><th>Data / Hora</th><th>Status</th><th>Motivo</th></tr>
              </thead>
              <tbody>
                {checkins.slice(0, 10).map((c) => (
                  <tr key={c.id}>
                    <td>{formatDate(c.dataHora)}</td>
                    <td>
                      <StatusBadge status={c.permitido ? 'LIBERADO' : 'BLOQUEADO'} />
                    </td>
                    <td>{c.motivo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {checkins.length > 10 && (
            <p className="perfil-more">+{checkins.length - 10} check-ins anteriores</p>
          )}
        </section>
      </div>
    </>
  )
}
