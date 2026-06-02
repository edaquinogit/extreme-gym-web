import { useCallback, useState } from 'react'
import { useForm, type FieldPath } from 'react-hook-form'
import { z } from 'zod'
import { DataTable } from '../../components/tables/DataTable'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApiError } from '../../hooks/useApiError'
import { useAuth } from '../../hooks/useAuth'
import { useResourceList } from '../../hooks/useResourceList'
import { matriculaService } from '../../services/matriculaService'
import { pagamentoService } from '../../services/pagamentoService'
import type { Matricula } from '../../types/matricula'
import type { FormaPagamento, Pagamento } from '../../types/pagamento'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { hasRole } from '../../utils/permissions'

const FORMAS_PAGAMENTO: FormaPagamento[] = [
  'PIX',
  'DINHEIRO',
  'CARTAO_CREDITO',
  'CARTAO_DEBITO',
]

const pagamentoSchema = z.object({
  matriculaId: z.coerce.number().positive('Selecione uma matricula.'),
  valor: z.coerce.number().positive('Valor deve ser maior que zero.'),
  formaPagamento: z.enum(FORMAS_PAGAMENTO, 'Selecione uma forma de pagamento.'),
})

type PagamentoFormValues = z.input<typeof pagamentoSchema>

const pagamentoDefaultValues: PagamentoFormValues = {
  matriculaId: 0,
  valor: 0,
  formaPagamento: 'PIX',
}

export function PagamentosPage() {
  const [selectedMatriculaId, setSelectedMatriculaId] = useState(0)
  const loadPagamentos = useCallback(() => {
    if (selectedMatriculaId > 0) {
      return pagamentoService.listarPorMatricula(selectedMatriculaId)
    }

    return pagamentoService.listar()
  }, [selectedMatriculaId])
  const {
    data: pagamentos,
    setData: setPagamentos,
    errorMessage,
    isLoading,
    reload,
  } = useResourceList({
    load: loadPagamentos,
  })
  const { data: matriculas, errorMessage: matriculasError, isLoading: isLoadingMatriculas } = useResourceList({
    load: matriculaService.listar,
  })
  const { user } = useAuth()
  const { getErrorMessage } = useApiError()
  const canManagePagamentos = hasRole(user, ['ADMIN', 'RECEPCAO'])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pagamentoToCancel, setPagamentoToCancel] = useState<Pagamento | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [cancelLoadingId, setCancelLoadingId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<PagamentoFormValues>({
    defaultValues: pagamentoDefaultValues,
  })
  const activeMatriculas = matriculas.filter((matricula) => matricula.status === 'ATIVA')

  function openPagamentoForm() {
    setFormError(null)
    clearActionFeedback()
    clearErrors()
    reset({
      ...pagamentoDefaultValues,
      matriculaId: selectedMatriculaId > 0 ? selectedMatriculaId : 0,
    })
    setIsFormOpen(true)
  }

  function closePagamentoForm() {
    setIsFormOpen(false)
    setFormError(null)
    clearErrors()
  }

  async function submitPagamento(values: PagamentoFormValues) {
    const parsed = pagamentoSchema.safeParse(values)

    setFormError(null)
    clearActionFeedback()
    clearErrors()

    if (!parsed.success) {
      applyValidationErrors(parsed.error.issues)
      return
    }

    try {
      setIsSaving(true)
      const savedPagamento = await pagamentoService.registrar(parsed.data)

      setPagamentos((current) => [savedPagamento, ...current])
      setActionMessage('Pagamento registrado com sucesso.')
      closePagamentoForm()
      void reload()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  function requestPagamentoCancel(pagamento: Pagamento) {
    setPagamentoToCancel(pagamento)
    clearActionFeedback()
  }

  function closeCancelDialog() {
    setPagamentoToCancel(null)
  }

  async function cancelarPagamento() {
    if (!pagamentoToCancel) {
      return
    }

    try {
      setCancelLoadingId(pagamentoToCancel.id)
      clearActionFeedback()
      await pagamentoService.cancelar(pagamentoToCancel.id)
      setPagamentos((current) =>
        current.map((item) =>
          item.id === pagamentoToCancel.id ? { ...item, status: 'CANCELADO' } : item,
        ),
      )
      setActionMessage('Pagamento cancelado com sucesso.')
      setPagamentoToCancel(null)
      void reload()
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setCancelLoadingId(null)
    }
  }

  function applyValidationErrors(issues: z.ZodIssue[]) {
    const firstIssue = issues[0]

    for (const issue of issues) {
      const field = issue.path[0]

      if (typeof field === 'string' && field in pagamentoDefaultValues) {
        setError(field as FieldPath<PagamentoFormValues>, { message: issue.message })
      }
    }

    setFormError(firstIssue?.message ?? 'Revise os campos do formulario.')
  }

  function clearActionFeedback() {
    setActionError(null)
    setActionMessage(null)
  }

  return (
    <>
      <PageHeader
        eyebrow="Pagamentos"
        title="Controle financeiro"
        description="Registre pagamentos reais e acompanhe status, valor e relacionamento com matricula."
        action={
          <button
            className="primary-button compact"
            type="button"
            onClick={openPagamentoForm}
            disabled={!canManagePagamentos || isLoadingMatriculas || Boolean(matriculasError)}
            title={!canManagePagamentos ? 'Acao restrita aos perfis ADMIN e RECEPCAO.' : undefined}
          >
            Registrar pagamento
          </button>
        }
      />

      <div className="toolbar">
        <select
          aria-label="Filtrar pagamentos por matricula"
          value={selectedMatriculaId}
          onChange={(event) => setSelectedMatriculaId(Number(event.target.value))}
        >
          <option value={0}>Todas as matriculas</option>
          {matriculas.map((matricula) => (
            <option key={matricula.id} value={matricula.id}>
              #{matricula.id} - {getMatriculaLabel(matricula)}
            </option>
          ))}
        </select>
      </div>

      {matriculasError && (
        <StateMessage
          title="Nao foi possivel carregar matriculas para pagamento"
          description={matriculasError}
        />
      )}
      {actionError && <StateMessage title="Nao foi possivel concluir a acao" description={actionError} />}
      {actionMessage && <StateMessage title="Dados atualizados" description={actionMessage} />}

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando pagamentos..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os pagamentos" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && pagamentos.length === 0 && (
          <StateMessage
            title="Nenhum pagamento encontrado"
            description="Use o botao Registrar pagamento para criar o primeiro registro financeiro."
          />
        )}
        {!isLoading && !errorMessage && pagamentos.length > 0 && (
          <DataTable headers={['ID', 'Aluno', 'Matricula', 'Valor', 'Status', 'Pagamento', 'Acoes']}>
            {pagamentos.map((pagamento) => {
              const isCanceled = pagamento.status === 'CANCELADO'

              return (
                <tr key={pagamento.id}>
                  <td>{pagamento.id}</td>
                  <td>{pagamento.alunoNome ?? '-'}</td>
                  <td>{pagamento.matriculaId ?? '-'}</td>
                  <td>{formatCurrency(pagamento.valor)}</td>
                  <td><StatusBadge status={pagamento.status} /></td>
                  <td>{formatDate(pagamento.dataPagamento ?? undefined)}</td>
                  <td>
                    {!isCanceled ? (
                      <button
                        type="button"
                        className="btn-danger compact"
                        disabled={!canManagePagamentos || cancelLoadingId === pagamento.id}
                        onClick={() => requestPagamentoCancel(pagamento)}
                      >
                        {cancelLoadingId === pagamento.id ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              )
            })}
          </DataTable>
        )}
      </section>

      <Modal isOpen={isFormOpen} onClose={closePagamentoForm} title="Registrar pagamento">
        <form onSubmit={(event) => void handleSubmit(submitPagamento)(event)}>
          <FormField label="Matricula" error={errors.matriculaId?.message}>
            <select {...register('matriculaId')}>
              <option value={0}>Selecione uma matricula</option>
              {activeMatriculas.map((matricula) => (
                <option key={matricula.id} value={matricula.id}>
                  #{matricula.id} - {getMatriculaLabel(matricula)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Valor" error={errors.valor?.message}>
            <input min="0" step="0.01" type="number" {...register('valor')} />
          </FormField>

          <FormField label="Forma de pagamento" error={errors.formaPagamento?.message}>
            <select {...register('formaPagamento')}>
              {FORMAS_PAGAMENTO.map((forma) => (
                <option key={forma} value={forma}>
                  {formatFormaPagamento(forma)}
                </option>
              ))}
            </select>
          </FormField>

          {formError && <div className="field-error">{formError}</div>}

          <div className="form-actions">
            <button type="button" className="ghost-button" onClick={closePagamentoForm}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Registrando...' : 'Registrar pagamento'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(pagamentoToCancel)}
        title="Cancelar pagamento"
        description={`Confirma o cancelamento do pagamento #${pagamentoToCancel?.id ?? ''}?`}
        confirmLabel="Cancelar pagamento"
        isLoading={Boolean(pagamentoToCancel && cancelLoadingId === pagamentoToCancel.id)}
        onCancel={closeCancelDialog}
        onConfirm={() => void cancelarPagamento()}
      />
    </>
  )
}

function getMatriculaLabel(matricula: Matricula) {
  const aluno = matricula.alunoNome ?? matricula.aluno?.nome ?? 'Aluno sem nome'
  const plano = matricula.planoNome ?? matricula.plano?.nome ?? 'Plano sem nome'

  return `${aluno} / ${plano}`
}

function formatFormaPagamento(forma: FormaPagamento) {
  return forma
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
