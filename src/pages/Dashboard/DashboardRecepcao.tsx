import { useEffect, useRef, useState } from 'react'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useApiError } from '../../hooks/useApiError'
import { useAuth } from '../../hooks/useAuth'
import { acessoService } from '../../services/acessoService'
import { checkinService } from '../../services/checkinService'
import { pagamentoService } from '../../services/pagamentoService'
import type { AcessoResponse } from '../../types/acesso'
import type { Checkin } from '../../types/checkin'
import type { Pagamento } from '../../types/pagamento'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

const AUTO_CLEAR_MS = 5000

export function DashboardRecepcao() {
  const { user } = useAuth()
  const { getErrorMessage } = useApiError()
  const inputRef = useRef<HTMLInputElement>(null)

  const firstName = (() => {
    const raw = user?.nome ?? user?.name ?? user?.username ?? user?.email ?? 'Recepcao'
    return raw.split(/[\s@]/)[0]
  })()

  const [alunoId, setAlunoId] = useState('')
  const [resultado, setResultado] = useState<AcessoResponse | null>(null)
  const [checkinFeito, setCheckinFeito] = useState(false)
  const [isValidando, setIsValidando] = useState(false)
  const [isRegistrando, setIsRegistrando] = useState(false)
  const [checkinError, setCheckinError] = useState<string | null>(null)
  const [clearTimer, setClearTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const [recentCheckins, setRecentCheckins] = useState<Checkin[]>([])
  const [pendingPayments, setPendingPayments] = useState<Pagamento[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [checkins, pagamentos] = await Promise.all([
          checkinService.listar(),
          pagamentoService.listar(),
        ])
        if (!mounted) return
        setRecentCheckins(Array.isArray(checkins) ? checkins.slice(0, 6) : [])
        setPendingPayments(
          Array.isArray(pagamentos)
            ? pagamentos.filter((p) => p.status === 'PENDENTE').slice(0, 5)
            : [],
        )
      } finally {
        if (mounted) setIsLoadingData(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [])

  function scheduleClear() {
    if (clearTimer) clearTimeout(clearTimer)
    const t = setTimeout(() => {
      setResultado(null)
      setCheckinFeito(false)
      setCheckinError(null)
      setAlunoId('')
      inputRef.current?.focus()
    }, AUTO_CLEAR_MS)
    setClearTimer(t)
  }

  async function validar() {
    const id = Number(alunoId.trim())
    if (!id || id <= 0) return

    try {
      setIsValidando(true)
      setResultado(null)
      setCheckinFeito(false)
      setCheckinError(null)
      const res = await acessoService.validar(id)
      setResultado(res)

      if (res.acessoLiberado) {
        await registrarCheckin(res.alunoId)
      } else {
        scheduleClear()
      }
    } catch (error) {
      setResultado({
        alunoId: id,
        alunoNome: '',
        acessoLiberado: false,
        motivo: getErrorMessage(error),
        matriculaId: null,
        dataValidadeMatricula: null,
      })
      scheduleClear()
    } finally {
      setIsValidando(false)
    }
  }

  async function registrarCheckin(id: number) {
    try {
      setIsRegistrando(true)
      const checkin = await checkinService.registrar(id)
      setCheckinFeito(true)
      if (checkin) {
        setRecentCheckins((prev) => [checkin, ...prev].slice(0, 6))
      }
    } catch (error) {
      setCheckinError(getErrorMessage(error))
    } finally {
      setIsRegistrando(false)
      scheduleClear()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') void validar()
  }

  const hasResult = resultado !== null

  return (
    <div className="recepcao-dashboard">
      <section className="recepcao-welcome">
        <p className="page-kicker">RECEPCAO</p>
        <h1>Ola, {firstName}.</h1>
        <p className="page-description">Digite o ID do aluno ou passe o cartao/QR para liberar o acesso.</p>
      </section>

      <div className="recepcao-layout">
        <section className={`recepcao-checkin-panel ${hasResult ? (resultado.acessoLiberado ? 'is-liberado' : 'is-bloqueado') : ''}`}>
          <div className="recepcao-input-row">
            <input
              ref={inputRef}
              type="number"
              min="1"
              value={alunoId}
              autoFocus
              placeholder="ID do aluno..."
              className="input-lg recepcao-id-input"
              disabled={isValidando}
              onChange={(e) => setAlunoId(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className="primary-button is-large recepcao-btn"
              disabled={isValidando || !alunoId}
              onClick={() => void validar()}
            >
              {isValidando ? <LoadingSpinner size={20} /> : 'Verificar'}
            </button>
          </div>

          {hasResult && (
            <div className="recepcao-result-body">
              {resultado.acessoLiberado ? (
                <>
                  <p className="recepcao-result-icon">✓</p>
                  <p className="recepcao-result-status">ACESSO LIBERADO</p>
                  <p className="recepcao-result-nome">{resultado.alunoNome}</p>
                  {resultado.dataValidadeMatricula && (
                    <p className="recepcao-result-detalhe">
                      Valido ate {formatDateOnly(resultado.dataValidadeMatricula)}
                    </p>
                  )}
                  {isRegistrando && <p className="recepcao-result-detalhe">Registrando check-in...</p>}
                  {checkinFeito && <p className="recepcao-result-detalhe">Check-in registrado.</p>}
                  {checkinError && <p className="recepcao-result-detalhe is-error">{checkinError}</p>}
                </>
              ) : (
                <>
                  <p className="recepcao-result-icon">✗</p>
                  <p className="recepcao-result-status">ACESSO BLOQUEADO</p>
                  {resultado.alunoNome && <p className="recepcao-result-nome">{resultado.alunoNome}</p>}
                  <p className="recepcao-result-detalhe">{resultado.motivo}</p>
                </>
              )}
              <p className="recepcao-autoclear-hint">Limpando em {AUTO_CLEAR_MS / 1000}s...</p>
            </div>
          )}
        </section>

        <aside className="recepcao-sidebar">
          <section className="content-panel recepcao-sidebar-panel">
            <h3 className="recepcao-sidebar-title">Ultimos acessos</h3>
            {isLoadingData ? (
              <div className="recepcao-loading"><LoadingSpinner size={16} /><span>Carregando...</span></div>
            ) : recentCheckins.length === 0 ? (
              <p className="recepcao-empty">Nenhum acesso hoje.</p>
            ) : (
              <ul className="recepcao-checkin-list">
                {recentCheckins.map((c) => (
                  <li key={c.id} className={`recepcao-checkin-item ${c.permitido ? 'is-ok' : 'is-denied'}`}>
                    <span className="recepcao-checkin-nome">{c.alunoNome ?? `Aluno #${c.alunoId}`}</span>
                    <span className="recepcao-checkin-hora">{formatTime(c.dataHora)}</span>
                    <StatusBadge status={c.permitido ? 'LIBERADO' : 'BLOQUEADO'} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="content-panel recepcao-sidebar-panel">
            <h3 className="recepcao-sidebar-title">Pagamentos pendentes</h3>
            {isLoadingData ? (
              <div className="recepcao-loading"><LoadingSpinner size={16} /><span>Carregando...</span></div>
            ) : pendingPayments.length === 0 ? (
              <p className="recepcao-empty">Nenhum pagamento pendente.</p>
            ) : (
              <ul className="recepcao-payment-list">
                {pendingPayments.map((p) => (
                  <li key={p.id} className="recepcao-payment-item">
                    <span className="recepcao-payment-nome">{p.alunoNome ?? `Pagamento #${p.id}`}</span>
                    <strong className="recepcao-payment-valor">{formatCurrency(p.valor)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <p className="recepcao-hint">Pressione Enter ou passe o cartao/QR para validar instantaneamente.</p>
    </div>
  )
}

function formatDateOnly(value: string) {
  const [y, m, d] = value.split('T')[0]?.split('-') ?? []
  return y && m && d ? `${d}/${m}/${y}` : value
}

function formatTime(value?: string) {
  if (!value) return ''
  return formatDate(value)
}
