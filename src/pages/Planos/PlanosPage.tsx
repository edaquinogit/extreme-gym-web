import { useState } from 'react'
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
import { planoService } from '../../services/planoService'
import type { Plano } from '../../types/plano'
import { formatCurrency } from '../../utils/formatCurrency'
import { hasRole } from '../../utils/permissions'

const planoSchema = z.object({
  nome: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres.'),
  descricao: z.string().trim().optional(),
  valor: z.coerce.number().positive('Valor deve ser maior que zero.'),
  duracaoDias: z.coerce
    .number()
    .int('Duracao deve ser um numero inteiro.')
    .positive('Duracao deve ser maior que zero.'),
})

type PlanoFormValues = z.input<typeof planoSchema>

const planoDefaultValues: PlanoFormValues = {
  nome: '',
  descricao: '',
  valor: 0,
  duracaoDias: 30,
}

export function PlanosPage() {
  const {
    data: planos,
    setData: setPlanos,
    errorMessage,
    isLoading,
    reload,
  } = useResourceList({
    load: planoService.listar,
  })
  const { user } = useAuth()
  const { getErrorMessage } = useApiError()
  const canManagePlans = hasRole(user, ['ADMIN'])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null)
  const [planoToInactivate, setPlanoToInactivate] = useState<Plano | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [inactivateLoadingId, setInactivateLoadingId] = useState<number | null>(null)
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
  } = useForm<PlanoFormValues>({
    defaultValues: planoDefaultValues,
  })
  const isEditMode = Boolean(selectedPlano)

  function openPlanoForm(plano?: Plano) {
    setSelectedPlano(plano ?? null)
    setFormError(null)
    clearActionFeedback()
    clearErrors()
    reset(
      plano
        ? {
            nome: plano.nome,
            descricao: plano.descricao ?? '',
            valor: plano.valor,
            duracaoDias: plano.duracaoDias ?? 30,
          }
        : planoDefaultValues,
    )
    setIsFormOpen(true)
  }

  function closePlanoForm() {
    setIsFormOpen(false)
    setSelectedPlano(null)
    setFormError(null)
    clearErrors()
  }

  async function submitPlano(values: PlanoFormValues) {
    const parsed = planoSchema.safeParse(values)

    setFormError(null)
    clearActionFeedback()
    clearErrors()

    if (!parsed.success) {
      applyValidationErrors(parsed.error.issues)
      return
    }

    try {
      setIsSaving(true)
      const payload = parsed.data
      const savedPlano = selectedPlano
        ? await planoService.atualizar(selectedPlano.id, payload)
        : await planoService.criar(payload)

      setPlanos((current) =>
        selectedPlano
          ? current.map((item) => (item.id === savedPlano.id ? savedPlano : item))
          : [savedPlano, ...current],
      )
      setActionMessage(
        selectedPlano ? 'Plano atualizado com sucesso.' : 'Plano criado com sucesso.',
      )
      closePlanoForm()
      void reload()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  function requestPlanoInactivation(plano: Plano) {
    setPlanoToInactivate(plano)
    clearActionFeedback()
  }

  function cancelPlanoInactivation() {
    setPlanoToInactivate(null)
  }

  async function inativarPlano() {
    if (!planoToInactivate) {
      return
    }

    try {
      setInactivateLoadingId(planoToInactivate.id)
      clearActionFeedback()
      await planoService.inativar(planoToInactivate.id)
      setPlanos((current) =>
        current.map((item) =>
          item.id === planoToInactivate.id
            ? { ...item, ativo: false, status: 'INATIVO' }
            : item,
        ),
      )
      setActionMessage('Plano inativado com sucesso.')
      setPlanoToInactivate(null)
      void reload()
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setInactivateLoadingId(null)
    }
  }

  function applyValidationErrors(issues: z.ZodIssue[]) {
    const firstIssue = issues[0]

    for (const issue of issues) {
      const field = issue.path[0]

      if (typeof field === 'string' && field in planoDefaultValues) {
        setError(field as FieldPath<PlanoFormValues>, { message: issue.message })
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
        eyebrow="Planos"
        title="Planos da academia"
        description="Gerencie planos ativos e inativos vindos de /planos."
        action={
          <button
            className="primary-button compact"
            type="button"
            onClick={() => openPlanoForm()}
            disabled={!canManagePlans}
            title={!canManagePlans ? 'Acao restrita ao perfil ADMIN.' : undefined}
          >
            Novo plano
          </button>
        }
      />

      {actionError && <StateMessage title="Nao foi possivel concluir a acao" description={actionError} />}
      {actionMessage && <StateMessage title="Dados atualizados" description={actionMessage} />}

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando planos..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os planos" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && planos.length === 0 && (
          <StateMessage
            title="Nenhum plano encontrado"
            description="Use o botao Novo plano para registrar o primeiro plano."
          />
        )}
        {!isLoading && !errorMessage && planos.length > 0 && (
          <DataTable headers={['ID', 'Nome', 'Valor', 'Duracao', 'Status', 'Acoes']}>
            {planos.map((plano) => {
              const isInactive = plano.status === 'INATIVO'

              return (
                <tr key={plano.id}>
                  <td>{plano.id}</td>
                  <td>
                    <div>{plano.nome}</div>
                    {plano.descricao && (
                      <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                        {plano.descricao}
                      </div>
                    )}
                  </td>
                  <td>{formatCurrency(plano.valor)}</td>
                  <td>{plano.duracaoDias ? `${plano.duracaoDias} dias` : '-'}</td>
                  <td><StatusBadge status={plano.status} /></td>
                  <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="ghost-button compact"
                      onClick={() => openPlanoForm(plano)}
                      disabled={!canManagePlans || isInactive}
                    >
                      Editar
                    </button>
                    {!isInactive && (
                      <button
                        type="button"
                        className="btn-danger compact"
                        disabled={!canManagePlans || inactivateLoadingId === plano.id}
                        onClick={() => requestPlanoInactivation(plano)}
                      >
                        {inactivateLoadingId === plano.id ? 'Inativando...' : 'Inativar'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </DataTable>
        )}
      </section>

      <Modal
        isOpen={isFormOpen}
        onClose={closePlanoForm}
        title={isEditMode ? 'Editar plano' : 'Cadastrar novo plano'}
      >
        <form onSubmit={(event) => void handleSubmit(submitPlano)(event)}>
          <FormField label="Nome" error={errors.nome?.message}>
            <input {...register('nome')} />
          </FormField>

          <FormField label="Descricao" error={errors.descricao?.message}>
            <textarea rows={3} {...register('descricao')} />
          </FormField>

          <FormField label="Valor mensal" error={errors.valor?.message}>
            <input min="0" step="0.01" type="number" {...register('valor')} />
          </FormField>

          <FormField label="Duracao em dias" error={errors.duracaoDias?.message}>
            <input min="1" step="1" type="number" {...register('duracaoDias')} />
          </FormField>

          {formError && <div className="field-error">{formError}</div>}

          <div className="form-actions">
            <button type="button" className="ghost-button" onClick={closePlanoForm}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Salvando...' : isEditMode ? 'Salvar alteracoes' : 'Cadastrar plano'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(planoToInactivate)}
        title="Inativar plano"
        description={`Confirma a inativacao de ${planoToInactivate?.nome ?? 'este plano'}?`}
        confirmLabel="Inativar"
        isLoading={Boolean(planoToInactivate && inactivateLoadingId === planoToInactivate.id)}
        onCancel={cancelPlanoInactivation}
        onConfirm={() => void inativarPlano()}
      />
    </>
  )
}
