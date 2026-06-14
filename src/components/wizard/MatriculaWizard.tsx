import { useEffect, useState, type FormEvent } from 'react'
import { FormField } from '../ui/FormField'
import { Modal } from '../ui/Modal'
import { useApiError } from '../../hooks/useApiError'
import { alunoService } from '../../services/alunoService'
import { matriculaService } from '../../services/matriculaService'
import { pagamentoService } from '../../services/pagamentoService'
import { planoService } from '../../services/planoService'
import type { Aluno } from '../../types/aluno'
import type { Matricula } from '../../types/matricula'
import type { FormaPagamento } from '../../types/pagamento'
import type { Plano } from '../../types/plano'

type Step = 1 | 2 | 3

const FORMAS: FormaPagamento[] = ['PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO']

const FORMA_LABELS: Record<FormaPagamento, string> = {
  PIX: 'PIX',
  DINHEIRO: 'Dinheiro',
  CARTAO_CREDITO: 'Cartao de credito',
  CARTAO_DEBITO: 'Cartao de debito',
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onComplete: (aluno: Aluno) => void
}

export function MatriculaWizard({ isOpen, onClose, onComplete }: Props) {
  const { getErrorMessage } = useApiError()

  // Step tracking
  const [step, setStep] = useState<Step>(1)
  const [doneSteps, setDoneSteps] = useState<Step[]>([])

  // Step 1 — Dados pessoais
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')

  // Step 2 — Plano e matrícula
  const [planos, setPlanos] = useState<Plano[]>([])
  const [planosLoading, setPlanosLoading] = useState(false)
  const [planoId, setPlanoId] = useState('')
  const [dataInicio, setDataInicio] = useState(todayISO)

  // Step 3 — Pagamento
  const [valor, setValor] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | ''>('')

  // Results from previous steps
  const [savedAluno, setSavedAluno] = useState<Aluno | null>(null)
  const [savedMatricula, setSavedMatricula] = useState<Matricula | null>(null)

  // UI
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

  // Reset wizard when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setDoneSteps([])
      setNome('')
      setEmail('')
      setTelefone('')
      setPlanoId('')
      setDataInicio(todayISO())
      setValor('')
      setFormaPagamento('')
      setSavedAluno(null)
      setSavedMatricula(null)
      setStepError(null)
    }
  }, [isOpen])

  // Load planos when reaching step 2
  useEffect(() => {
    if (step !== 2) return
    setPlanosLoading(true)
    planoService.listar()
      .then((all) => {
        const ativos = all.filter((p) => p.ativo)
        setPlanos(ativos)
        if (ativos.length > 0 && !planoId) {
          setPlanoId(String(ativos[0].id))
          setValor(String(ativos[0].valorMensal))
        }
      })
      .catch(() => setStepError('Nao foi possivel carregar os planos.'))
      .finally(() => setPlanosLoading(false))
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    if (savedAluno) {
      onComplete(savedAluno)
    } else {
      onClose()
    }
  }

  // ─── Step 1 ───────────────────────────────────────────────────────────────

  async function submitStep1(e: FormEvent) {
    e.preventDefault()
    setStepError(null)

    const n = nome.trim()
    const em = email.trim()
    const tel = telefone.trim()

    if (!n || !em || !tel) {
      setStepError('Preencha todos os campos obrigatorios.')
      return
    }

    try {
      setIsSubmitting(true)
      const aluno = await alunoService.cadastrar({ nome: n, email: em, telefone: tel })
      setSavedAluno(aluno)
      setDoneSteps((d) => [...d, 1])
      setStep(2)
    } catch (err) {
      setStepError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Step 2 ───────────────────────────────────────────────────────────────

  async function submitStep2(e: FormEvent) {
    e.preventDefault()
    setStepError(null)

    if (!savedAluno) return
    if (!planoId) { setStepError('Selecione um plano.'); return }
    if (!dataInicio) { setStepError('Informe a data de inicio.'); return }

    try {
      setIsSubmitting(true)
      const matricula = await matriculaService.criar({
        alunoId: savedAluno.id,
        planoId: Number(planoId),
        dataInicio,
      })
      setSavedMatricula(matricula)

      // Pre-fill payment value from selected plan
      const plano = planos.find((p) => p.id === Number(planoId))
      if (plano) setValor(String(plano.valorMensal))

      setDoneSteps((d) => [...d, 2])
      setStep(3)
    } catch (err) {
      setStepError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  function skipStep2() {
    if (savedAluno) onComplete(savedAluno)
  }

  // ─── Step 3 ───────────────────────────────────────────────────────────────

  async function submitStep3(e: FormEvent) {
    e.preventDefault()
    setStepError(null)

    if (!savedMatricula) return

    const v = parseFloat(valor.replace(',', '.'))
    if (isNaN(v) || v <= 0) { setStepError('Informe um valor valido.'); return }
    if (!formaPagamento) { setStepError('Selecione a forma de pagamento.'); return }

    try {
      setIsSubmitting(true)
      await pagamentoService.registrar({
        matriculaId: savedMatricula.id,
        valor: v,
        formaPagamento: formaPagamento as FormaPagamento,
      })
      setDoneSteps((d) => [...d, 3])
      if (savedAluno) onComplete(savedAluno)
    } catch (err) {
      setStepError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  function skipStep3() {
    if (savedAluno) onComplete(savedAluno)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const selectedPlano = planos.find((p) => p.id === Number(planoId))

  return (
    <Modal
      isOpen={isOpen}
      title="Matricular aluno"
      onClose={handleClose}
      className="modal-wizard"
    >
      <Stepper current={step} done={doneSteps} />

      {step === 1 && (
        <form onSubmit={(e) => void submitStep1(e)}>
          <FormField label="Nome completo">
            <input
              className="form-control"
              value={nome}
              autoComplete="off"
              placeholder="Ex: Maria da Silva"
              onChange={(e) => setNome(e.target.value)}
            />
          </FormField>
          <FormField label="Email">
            <input
              className="form-control"
              type="email"
              value={email}
              autoComplete="off"
              placeholder="maria@exemplo.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField label="Telefone">
            <input
              className="form-control"
              value={telefone}
              autoComplete="off"
              placeholder="(11) 99999-9999"
              onChange={(e) => setTelefone(e.target.value)}
            />
          </FormField>

          {stepError && <p className="form-error">{stepError}</p>}

          <div className="wizard-nav">
            <button type="button" className="ghost-button" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Proximo →'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && savedAluno && (
        <form onSubmit={(e) => void submitStep2(e)}>
          <div className="wizard-summary">
            <div className="wizard-summary-item">
              <span className="wizard-summary-check">✓</span>
              <span>Aluno: <strong>{savedAluno.nome}</strong></span>
            </div>
          </div>

          {planosLoading ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Carregando planos...</p>
          ) : (
            <>
              <FormField label="Plano">
                <select
                  className="form-control"
                  value={planoId}
                  onChange={(e) => {
                    setPlanoId(e.target.value)
                    const p = planos.find((pl) => pl.id === Number(e.target.value))
                    if (p) setValor(String(p.valorMensal))
                  }}
                >
                  {planos.length === 0 && <option value="">Nenhum plano ativo</option>}
                  {planos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — R$ {p.valorMensal.toFixed(2).replace('.', ',')}
                      {p.duracaoEmDias ? ` / ${p.duracaoEmDias} dias` : ''}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Data de inicio">
                <input
                  className="form-control"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </FormField>
            </>
          )}

          {stepError && <p className="form-error">{stepError}</p>}

          <div className="wizard-nav">
            <button
              type="button"
              className="wizard-skip"
              onClick={skipStep2}
              disabled={isSubmitting}
            >
              Apenas cadastrar aluno, sem matricula
            </button>
            <div className="wizard-nav-end">
              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting || planosLoading || planos.length === 0}
              >
                {isSubmitting ? 'Criando matricula...' : 'Proximo →'}
              </button>
            </div>
          </div>
        </form>
      )}

      {step === 3 && savedAluno && savedMatricula && (
        <form onSubmit={(e) => void submitStep3(e)}>
          <div className="wizard-summary">
            <div className="wizard-summary-item">
              <span className="wizard-summary-check">✓</span>
              <span>Aluno: <strong>{savedAluno.nome}</strong></span>
            </div>
            <div className="wizard-summary-item">
              <span className="wizard-summary-check">✓</span>
              <span>
                Matricula: <strong>
                  {selectedPlano?.nome ?? `Plano #${savedMatricula.planoId}`}
                </strong>
                {' — inicio '}
                <strong>{formatDateBR(dataInicio)}</strong>
              </span>
            </div>
          </div>

          <FormField label="Valor (R$)">
            <input
              className="form-control"
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </FormField>
          <FormField label="Forma de pagamento">
            <select
              className="form-control"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
            >
              <option value="">Selecione...</option>
              {FORMAS.map((f) => (
                <option key={f} value={f}>{FORMA_LABELS[f]}</option>
              ))}
            </select>
          </FormField>

          {stepError && <p className="form-error">{stepError}</p>}

          <div className="wizard-nav">
            <button
              type="button"
              className="wizard-skip"
              onClick={skipStep3}
              disabled={isSubmitting}
            >
              Registrar pagamento depois
            </button>
            <div className="wizard-nav-end">
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Concluir matricula'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ─── Stepper ──────────────────────────────────────────────────────────────

const STEPS: Array<{ n: Step; label: string }> = [
  { n: 1, label: 'Dados pessoais' },
  { n: 2, label: 'Plano' },
  { n: 3, label: 'Pagamento' },
]

function Stepper({ current, done }: { current: Step; done: Step[] }) {
  return (
    <div className="wizard-stepper" aria-label="Progresso do cadastro">
      {STEPS.map((s, i) => {
        const isDone = done.includes(s.n)
        const isCurrent = current === s.n
        return (
          <div key={s.n} style={{ display: 'contents' }}>
            <div className={`wizard-step${isCurrent ? ' is-current' : ''}${isDone ? ' is-done' : ''}`}>
              <div className="wizard-step-node" aria-label={isDone ? 'Concluido' : isCurrent ? 'Em andamento' : 'Pendente'}>
                {isDone ? '✓' : s.n}
              </div>
              <span className="wizard-step-label">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`wizard-connector${isDone ? ' is-done' : ''}`} aria-hidden />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateBR(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
