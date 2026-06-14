import { useEffect, useRef, useState } from 'react'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApiError } from '../../hooks/useApiError'
import { acessoService } from '../../services/acessoService'
import { checkinService } from '../../services/checkinService'
import type { AcessoResponse } from '../../types/acesso'
import type { Checkin } from '../../types/checkin'
import { formatDate } from '../../utils/formatDate'

const AUTO_CLEAR_MS = 5000

type ResultState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'liberado'; data: AcessoResponse; checkinFeito: boolean; checkinError?: string }
  | { kind: 'bloqueado'; data: AcessoResponse }
  | { kind: 'error'; message: string }

export function AcessoPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { getErrorMessage } = useApiError()

  const [alunoId, setAlunoId] = useState('')
  const [result, setResult] = useState<ResultState>({ kind: 'idle' })
  const [recentCheckins, setRecentCheckins] = useState<Checkin[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  useEffect(() => {
    let mounted = true
    checkinService.listar().then((data) => {
      if (mounted) {
        setRecentCheckins(Array.isArray(data) ? data.slice(0, 8) : [])
        setIsLoadingHistory(false)
      }
    }).catch(() => {
      if (mounted) setIsLoadingHistory(false)
    })
    return () => { mounted = false }
  }, [])

  function scheduleClear() {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    clearTimerRef.current = setTimeout(() => {
      setResult({ kind: 'idle' })
      setAlunoId('')
      inputRef.current?.focus()
    }, AUTO_CLEAR_MS)
  }

  async function validarERegistrar() {
    const id = Number(alunoId.trim())
    if (!id || id <= 0) return

    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    setResult({ kind: 'loading' })

    try {
      const res = await acessoService.validar(id)

      if (!res.acessoLiberado) {
        setResult({ kind: 'bloqueado', data: res })
        scheduleClear()
        return
      }

      setResult({ kind: 'liberado', data: res, checkinFeito: false })

      try {
        const checkin = await checkinService.registrar(res.alunoId)
        setResult({ kind: 'liberado', data: res, checkinFeito: true })
        if (checkin) {
          setRecentCheckins((prev) => [checkin, ...prev].slice(0, 8))
        }
      } catch (err) {
        setResult({
          kind: 'liberado',
          data: res,
          checkinFeito: false,
          checkinError: getErrorMessage(err),
        })
      }

      scheduleClear()
    } catch (error) {
      setResult({ kind: 'error', message: getErrorMessage(error) })
      scheduleClear()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') void validarERegistrar()
  }

  const isActive = result.kind !== 'idle'
  const isLiberado = result.kind === 'liberado'
  const isBloqueado = result.kind === 'bloqueado' || result.kind === 'error'

  return (
    <div className="acesso-page-v2">
      <div className={`acesso-main ${isLiberado ? 'is-liberado' : isBloqueado ? 'is-bloqueado' : ''}`}>
        <header className="acesso-header">
          <p className="eyebrow">Controle de acesso</p>
          <h2>Validar entrada</h2>
        </header>

        <div className="acesso-input-group">
          <input
            ref={inputRef}
            type="number"
            min="1"
            value={alunoId}
            autoFocus
            placeholder="ID do aluno ou passe o cartao / QR"
            className="input-lg acesso-id-input"
            disabled={result.kind === 'loading'}
            onChange={(e) => setAlunoId(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="primary-button is-large"
            disabled={result.kind === 'loading' || !alunoId}
            onClick={() => void validarERegistrar()}
          >
            {result.kind === 'loading'
              ? <><LoadingSpinner size={18} /> Verificando...</>
              : 'Verificar acesso'}
          </button>
        </div>

        {isActive && result.kind !== 'loading' && (
          <div className="acesso-result-panel">
            {isLiberado && result.kind === 'liberado' && (
              <>
                <span className="acesso-result-icon acesso-ok">✓</span>
                <p className="acesso-result-label">ACESSO LIBERADO</p>
                <p className="acesso-result-nome">{result.data.alunoNome}</p>
                {result.data.dataValidadeMatricula && (
                  <p className="acesso-result-detalhe">
                    Valido ate {formatDateOnly(result.data.dataValidadeMatricula)}
                  </p>
                )}
                {!result.checkinFeito && !result.checkinError && (
                  <p className="acesso-result-detalhe">Registrando check-in...</p>
                )}
                {result.checkinFeito && (
                  <p className="acesso-result-detalhe acesso-ok">Check-in registrado.</p>
                )}
                {result.checkinError && (
                  <p className="acesso-result-detalhe acesso-error">{result.checkinError}</p>
                )}
              </>
            )}

            {result.kind === 'bloqueado' && (
              <>
                <span className="acesso-result-icon acesso-blocked">✗</span>
                <p className="acesso-result-label">ACESSO BLOQUEADO</p>
                {result.data.alunoNome && (
                  <p className="acesso-result-nome">{result.data.alunoNome}</p>
                )}
                <p className="acesso-result-detalhe">{result.data.motivo}</p>
              </>
            )}

            {result.kind === 'error' && (
              <>
                <span className="acesso-result-icon acesso-blocked">✗</span>
                <p className="acesso-result-label">ACESSO BLOQUEADO</p>
                <p className="acesso-result-detalhe">{result.message}</p>
              </>
            )}

            <p className="acesso-autoclear">Limpando em {AUTO_CLEAR_MS / 1000}s...</p>
          </div>
        )}

        <p className="acesso-hint">
          Pressione <kbd>Enter</kbd> ou passe o cartao / QR para validar instantaneamente.
          O check-in e registrado automaticamente quando o acesso e liberado.
        </p>
      </div>

      <aside className="acesso-historico">
        <h3 className="acesso-historico-title">Ultimos acessos</h3>
        {isLoadingHistory ? (
          <div className="acesso-historico-loading">
            <LoadingSpinner size={16} />
            <span>Carregando historico...</span>
          </div>
        ) : recentCheckins.length === 0 ? (
          <p className="acesso-historico-empty">Nenhum acesso registrado ainda.</p>
        ) : (
          <ul className="acesso-historico-list">
            {recentCheckins.map((c) => (
              <li
                key={c.id}
                className={`acesso-historico-item ${c.permitido ? 'is-ok' : 'is-denied'}`}
              >
                <div className="acesso-historico-info">
                  <span className="acesso-historico-nome">
                    {c.alunoNome ?? `Aluno #${c.alunoId}`}
                  </span>
                  <span className="acesso-historico-hora">{formatDate(c.dataHora)}</span>
                </div>
                <StatusBadge status={c.permitido ? 'LIBERADO' : 'BLOQUEADO'} />
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}

function formatDateOnly(value: string) {
  const date = value.split('T')[0] ?? value
  const [y, m, d] = date.split('-')
  return y && m && d ? `${d}/${m}/${y}` : value
}
