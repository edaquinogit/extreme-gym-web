import { useEffect, useState } from 'react'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useApiError } from '../../hooks/useApiError'
import { navigateTo } from '../../app/routes/router'
import { appPaths } from '../../app/routes/paths'
import { alunoService } from '../../services/alunoService'
import { matriculaService } from '../../services/matriculaService'
import { pagamentoService } from '../../services/pagamentoService'
import { checkinService } from '../../services/checkinService'
import { credencialService } from '../../services/credencialService'
import type { Aluno } from '../../types/aluno'
import type { Matricula } from '../../types/matricula'
import type { Pagamento } from '../../types/pagamento'
import type { Checkin } from '../../types/checkin'
import type { CredencialAcesso } from '../../types/credencial'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'

type LoadState = 'loading' | 'ready' | 'error'

type PerfilData = {
  aluno: Aluno
  matriculas: Matricula[]
  pagamentos: Pagamento[]
  checkins: Checkin[]
  credenciais: CredencialAcesso[]
}

const TIPO_LABEL: Record<string, string> = {
  PIN: 'Senha / PIN',
  CARTAO: 'Cartao fisico',
  QR_CODE: 'QR Code',
  FACE_TEMPLATE: 'Biometria facial',
}

const TIPO_ICON: Record<string, string> = {
  PIN: '🔑',
  CARTAO: '💳',
  QR_CODE: '◼',
  FACE_TEMPLATE: '👤',
}

export function AlunoPerfilPage({ alunoId }: { alunoId: number }) {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [data, setData] = useState<PerfilData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { getErrorMessage } = useApiError()

  useEffect(() => {
    let cancelled = false
    loadPerfil()

    async function loadPerfil() {
      setLoadState('loading')

      try {
        const aluno = await alunoService.buscar(alunoId)

        const [matriculasResult, checkinsResult, credenciaisResult] = await Promise.allSettled([
          matriculaService.listarPorAluno(alunoId),
          checkinService.listarPorAluno(alunoId),
          credencialService.listarPorAluno(alunoId),
        ])

        const matriculas = matriculasResult.status === 'fulfilled' && Array.isArray(matriculasResult.value)
          ? matriculasResult.value
          : []

        const checkins = checkinsResult.status === 'fulfilled' && Array.isArray(checkinsResult.value)
          ? checkinsResult.value
          : []

        const credenciais = credenciaisResult.status === 'fulfilled' && Array.isArray(credenciaisResult.value)
          ? credenciaisResult.value
          : []

        const ativa = matriculas.find((m) => m.status === 'ATIVA')
        let pagamentos: Pagamento[] = []
        if (ativa) {
          try {
            const p = await pagamentoService.listarPorMatricula(ativa.id)
            pagamentos = Array.isArray(p) ? p : []
          } catch {
            pagamentos = []
          }
        }

        if (!cancelled) {
          setData({ aluno, matriculas, pagamentos, checkins, credenciais })
          setLoadState('ready')
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error))
          setLoadState('error')
        }
      }
    }

    return () => { cancelled = true }
  }, [alunoId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loadState === 'loading') {
    return (
      <div className="perfil-loading-state">
        <LoadingSpinner size={28} />
        <p>Carregando perfil...</p>
      </div>
    )
  }

  if (loadState === 'error' || !data) {
    return (
      <StateMessage
        title="Nao foi possivel carregar o perfil"
        description={errorMessage ?? 'Aluno nao encontrado.'}
      />
    )
  }

  return (
    <PerfilContent
      data={data}
      alunoId={alunoId}
      onCredenciaisChange={(credenciais) => setData((d) => d ? { ...d, credenciais } : d)}
    />
  )
}

/* ── Conteúdo principal ─────────────────────────────────────────────────────── */

function PerfilContent({
  data,
  alunoId,
  onCredenciaisChange,
}: {
  data: PerfilData
  alunoId: number
  onCredenciaisChange: (credenciais: CredencialAcesso[]) => void
}) {
  const { aluno, matriculas, pagamentos, checkins, credenciais } = data
  const matriculaAtiva = matriculas.find((m) => m.status === 'ATIVA')
  const historico = matriculas.filter((m) => m.status !== 'ATIVA')

  const initials = aluno.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const checkinsLiberados = checkins.filter((c) => c.permitido).length

  return (
    <div className="perfil-page">

      {/* ── Breadcrumb ────────────────────────────────────────────── */}
      <nav className="perfil-breadcrumb">
        <button
          type="button"
          className="ghost-button compact"
          onClick={() => navigateTo(appPaths.alunos)}
        >
          ← Alunos
        </button>
        <span className="perfil-breadcrumb-sep">/</span>
        <span className="perfil-breadcrumb-current">{aluno.nome}</span>
      </nav>

      {/* ── Hero card ─────────────────────────────────────────────── */}
      <section className="perfil-hero">
        <div className="perfil-hero-avatar" aria-hidden="true">
          {initials}
        </div>

        <div className="perfil-hero-info">
          <h1 className="perfil-hero-name">{aluno.nome}</h1>
          <p className="perfil-hero-meta">
            {aluno.email}
            {aluno.telefone ? <> &nbsp;·&nbsp; {aluno.telefone}</> : null}
          </p>
          <p className="perfil-hero-since">
            Cadastrado em {formatDate(aluno.dataCadastro)}
          </p>
        </div>

        <div className="perfil-hero-badges">
          <StatusBadge status={aluno.status} />
          {matriculaAtiva
            ? <span className="badge badge-primary">Matricula ativa</span>
            : <span className="badge badge-muted">Sem matricula ativa</span>
          }
          {checkins.length > 0 && (
            <span className="badge badge-muted">
              {checkinsLiberados} acesso{checkinsLiberados !== 1 ? 's' : ''} registrado{checkinsLiberados !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </section>

      {/* ── Grade de conteúdo ─────────────────────────────────────── */}
      <div className="perfil-content-grid">

        {/* Coluna esquerda */}
        <div className="perfil-col-left">

          {/* Dados pessoais */}
          <section className="content-panel perfil-section">
            <h3 className="perfil-section-title">Dados pessoais</h3>
            <dl className="perfil-dl">
              <div className="perfil-dl-row">
                <dt>ID</dt>
                <dd>#{aluno.id}</dd>
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
                <dd>{aluno.telefone || '—'}</dd>
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

          {/* Credenciais de acesso (catraca) */}
          <CredenciaisSection
            alunoId={alunoId}
            credenciais={credenciais}
            onChange={onCredenciaisChange}
          />

        </div>

        {/* Coluna direita */}
        <div className="perfil-col-right">

          {/* Matrícula ativa */}
          <section className="content-panel perfil-section">
            <h3 className="perfil-section-title">Matricula ativa</h3>
            {matriculaAtiva ? (
              <dl className="perfil-dl">
                <div className="perfil-dl-row">
                  <dt>Plano</dt>
                  <dd>{matriculaAtiva.planoNome ?? '—'}</dd>
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

            {historico.length > 0 && (
              <details className="perfil-historico-toggle">
                <summary>Historico de matriculas ({historico.length})</summary>
                <table className="perfil-table">
                  <thead>
                    <tr><th>Plano</th><th>Inicio</th><th>Fim</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {historico.map((m) => (
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

          {/* Pagamentos */}
          <section className="content-panel perfil-section">
            <h3 className="perfil-section-title">Pagamentos</h3>
            {pagamentos.length === 0 ? (
              <p className="perfil-empty">
                {matriculaAtiva
                  ? 'Nenhum pagamento registrado para a matricula ativa.'
                  : 'Sem matricula ativa — sem pagamentos.'}
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

          {/* Check-ins */}
          <section className="content-panel perfil-section">
            <h3 className="perfil-section-title">
              Ultimos acessos
              {checkins.length > 0 && (
                <span className="perfil-section-count">{checkins.length} total</span>
              )}
            </h3>
            {checkins.length === 0 ? (
              <p className="perfil-empty">Nenhum acesso registrado.</p>
            ) : (
              <table className="perfil-table">
                <thead>
                  <tr><th>Data / Hora</th><th>Resultado</th><th>Motivo</th></tr>
                </thead>
                <tbody>
                  {checkins.slice(0, 12).map((c) => (
                    <tr key={c.id}>
                      <td>{formatDate(c.dataHora)}</td>
                      <td><StatusBadge status={c.permitido ? 'LIBERADO' : 'BLOQUEADO'} /></td>
                      <td>{c.motivo ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {checkins.length > 12 && (
              <p className="perfil-more">+{checkins.length - 12} acessos anteriores</p>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}

/* ── Credenciais de acesso ───────────────────────────────────────────────────── */

type CredenciaisState =
  | { kind: 'idle' }
  | { kind: 'adding' }
  | { kind: 'saving' }
  | { kind: 'revoking'; id: number }

function CredenciaisSection({
  alunoId,
  credenciais,
  onChange,
}: {
  alunoId: number
  credenciais: CredencialAcesso[]
  onChange: (credenciais: CredencialAcesso[]) => void
}) {
  const [state, setState] = useState<CredenciaisState>({ kind: 'idle' })
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinSuccess, setPinSuccess] = useState(false)
  const { getErrorMessage } = useApiError()

  const ativas = credenciais.filter((c) => c.status === 'ATIVA')

  async function handleAddPin(e: React.FormEvent) {
    e.preventDefault()
    setPinError(null)
    setPinSuccess(false)

    if (pin.trim().length < 4) {
      setPinError('A senha deve ter no minimo 4 caracteres.')
      return
    }

    setState({ kind: 'saving' })

    try {
      const nova = await credencialService.criar(alunoId, {
        tipo: 'PIN',
        identificadorExterno: pin.trim(),
      })
      onChange([nova, ...credenciais])
      setPin('')
      setPinSuccess(true)
      setState({ kind: 'idle' })
      setTimeout(() => setPinSuccess(false), 3000)
    } catch (err) {
      setPinError(getErrorMessage(err))
      setState({ kind: 'adding' })
    }
  }

  async function handleRevogar(id: number) {
    setState({ kind: 'revoking', id })

    try {
      const atualizada = await credencialService.revogar(id)
      onChange(credenciais.map((c) => (c.id === id ? atualizada : c)))
    } catch {
      // silent — credential stays in list
    } finally {
      setState({ kind: 'idle' })
    }
  }

  const isSaving = state.kind === 'saving'

  return (
    <section className="content-panel perfil-section">
      <div className="credencial-header">
        <h3 className="perfil-section-title">Identificacao Catraca</h3>
        {state.kind === 'idle' && (
          <button
            type="button"
            className="ghost-button compact"
            onClick={() => { setState({ kind: 'adding' }); setPinError(null); setPinSuccess(false) }}
          >
            + Adicionar
          </button>
        )}
      </div>

      {/* Lista de credenciais ativas */}
      {ativas.length === 0 && state.kind === 'idle' ? (
        <div className="credencial-empty">
          <p>Nenhuma credencial de acesso cadastrada.</p>
          <p className="credencial-empty-hint">
            Adicione uma senha/PIN para que o aluno possa usar a catraca sem cartao.
          </p>
        </div>
      ) : (
        <ul className="credencial-list">
          {ativas.map((c) => (
            <li key={c.id} className="credencial-item">
              <span className="credencial-item-icon" aria-hidden="true">
                {TIPO_ICON[c.tipo] ?? '🔒'}
              </span>
              <div className="credencial-item-info">
                <span className="credencial-item-tipo">{TIPO_LABEL[c.tipo] ?? c.tipo}</span>
                <span className="credencial-item-data">
                  Cadastrada em {formatDate(c.cadastradoEm)}
                </span>
              </div>
              <StatusBadge status={c.status} />
              <button
                type="button"
                className="btn-danger btn-xs"
                disabled={state.kind === 'revoking' && (state as { id: number }).id === c.id}
                onClick={() => void handleRevogar(c.id)}
              >
                {state.kind === 'revoking' && (state as { id: number }).id === c.id
                  ? <LoadingSpinner size={12} />
                  : 'Revogar'
                }
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Credenciais revogadas */}
      {credenciais.filter((c) => c.status !== 'ATIVA').length > 0 && (
        <details className="credencial-historico">
          <summary>Historico de credenciais</summary>
          <ul className="credencial-list credencial-list--muted">
            {credenciais
              .filter((c) => c.status !== 'ATIVA')
              .map((c) => (
                <li key={c.id} className="credencial-item credencial-item--muted">
                  <span className="credencial-item-icon" aria-hidden="true">
                    {TIPO_ICON[c.tipo] ?? '🔒'}
                  </span>
                  <div className="credencial-item-info">
                    <span className="credencial-item-tipo">{TIPO_LABEL[c.tipo] ?? c.tipo}</span>
                    <span className="credencial-item-data">
                      {c.revogadoEm ? `Revogada em ${formatDate(c.revogadoEm)}` : formatDate(c.cadastradoEm)}
                    </span>
                  </div>
                  <StatusBadge status={c.status} />
                </li>
              ))}
          </ul>
        </details>
      )}

      {/* Formulário de PIN */}
      {(state.kind === 'adding' || state.kind === 'saving') && (
        <form className="credencial-pin-form" onSubmit={(e) => void handleAddPin(e)}>
          <div className="credencial-pin-form-header">
            <span className="credencial-pin-form-title">Nova senha / PIN</span>
            <button
              type="button"
              className="ghost-button compact"
              disabled={isSaving}
              onClick={() => { setState({ kind: 'idle' }); setPin(''); setPinError(null) }}
            >
              Cancelar
            </button>
          </div>
          <p className="credencial-pin-hint">
            Defina uma senha numerica ou alfanumerica de 4 a 12 caracteres.
            O aluno usara esta senha para se identificar na catraca.
          </p>
          <div className="credencial-pin-input-row">
            <input
              type="password"
              className="input-field"
              placeholder="Minimo 4 caracteres"
              minLength={4}
              maxLength={12}
              autoFocus
              value={pin}
              disabled={isSaving}
              onChange={(e) => { setPin(e.target.value); setPinError(null) }}
            />
            <button
              type="submit"
              className="primary-button"
              disabled={isSaving || pin.trim().length < 4}
            >
              {isSaving ? <><LoadingSpinner size={14} /> Salvando...</> : 'Salvar senha'}
            </button>
          </div>
          {pinError && <p className="credencial-pin-error">{pinError}</p>}
        </form>
      )}

      {pinSuccess && (
        <p className="credencial-pin-success">Senha cadastrada com sucesso!</p>
      )}
    </section>
  )
}
