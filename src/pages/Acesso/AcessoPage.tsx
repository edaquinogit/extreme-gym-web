import { useState } from 'react'
import { FormField } from '../../components/ui/FormField'
import { useApiError } from '../../hooks/useApiError'
import { acessoService } from '../../services/acessoService'
import { checkinService } from '../../services/checkinService'
import type { AcessoResponse } from '../../types/acesso'

export function AcessoPage() {
  const [alunoId, setAlunoId] = useState('')
  const [resultado, setResultado] = useState<AcessoResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [checkinMessage, setCheckinMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisteringCheckin, setIsRegisteringCheckin] = useState(false)
  const hasResult = Boolean(resultado || errorMessage || isLoading)
  const { getErrorMessage } = useApiError()

  async function validarAcesso() {
    try {
      setIsLoading(true)
      setResultado(null)
      setErrorMessage(null)
      setCheckinMessage(null)
      const response = await acessoService.validar(Number(alunoId))
      setResultado(response)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  async function registrarCheckin() {
    if (!resultado) {
      return
    }

    try {
      setIsRegisteringCheckin(true)
      setCheckinMessage(null)
      const response = await checkinService.registrar(resultado.alunoId)
      setCheckinMessage(
        response.permitido
          ? `Check-in registrado para ${response.alunoNome}.`
          : response.motivo,
      )
    } catch (error) {
      setCheckinMessage(getErrorMessage(error))
    } finally {
      setIsRegisteringCheckin(false)
    }
  }

  return (
    <div className="acesso-page">
      <section className="acesso-card">
        <header className="page-header">
          <p className="eyebrow">Recepcao</p>
          <h2>Validar acesso</h2>
        </header>

        <FormField label="ID do aluno">
          <input
            type="number"
            min="1"
            value={alunoId}
            autoFocus
            className="input-lg"
            onChange={(event) => setAlunoId(event.target.value)}
          />
        </FormField>

        <button
          type="button"
          className="btn btn--primary btn--full btn--lg"
          disabled={isLoading || !alunoId}
          onClick={() => void validarAcesso()}
        >
          {isLoading ? 'Carregando...' : 'Verificar acesso'}
        </button>

        {hasResult && (
          <div
            className={`acesso-result ${
              resultado?.acessoLiberado ? 'is-liberado' : 'is-bloqueado'
            }`}
          >
            {isLoading && <p className="acesso-result-title">Carregando...</p>}

            {!isLoading && errorMessage && (
              <>
                <p className="acesso-result-title">ACESSO BLOQUEADO</p>
                <p>{errorMessage}</p>
              </>
            )}

            {!isLoading && resultado && (
              <>
                <p className="acesso-result-title">
                  {resultado.acessoLiberado
                    ? 'ACESSO LIBERADO'
                    : 'ACESSO BLOQUEADO'}
                </p>
                <div className="result-details">
                  <strong>{resultado.alunoNome}</strong>
                  <span>{resultado.motivo}</span>
                  {resultado.acessoLiberado &&
                    resultado.dataValidadeMatricula && (
                      <span>
                        Valido ate{' '}
                        {formatDateOnly(resultado.dataValidadeMatricula)}
                      </span>
                    )}
                </div>

                {resultado.acessoLiberado && (
                  <button
                    type="button"
                    className="btn btn--primary btn--full"
                    disabled={isRegisteringCheckin}
                    onClick={() => void registrarCheckin()}
                  >
                    {isRegisteringCheckin ? 'Salvando...' : 'Registrar check-in'}
                  </button>
                )}

                {checkinMessage && (
                  <p className="field-hint acesso-checkin-message">
                    {checkinMessage}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function formatDateOnly(value: string) {
  const [year, month, day] = value.split('-')

  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
}
