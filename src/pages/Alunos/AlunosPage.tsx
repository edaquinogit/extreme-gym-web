import { type FormEvent, useState } from 'react'
import { DataTable } from '../../components/tables/DataTable'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { StatusDropdown } from '../../components/ui/StatusDropdown'
import { useApiError } from '../../hooks/useApiError'
import { useResourceList } from '../../hooks/useResourceList'
import { alunoService } from '../../services/alunoService'
import type { Aluno, StatusAluno } from '../../types/aluno'
import { formatDate } from '../../utils/formatDate'

const initialFormState = {
  nome: '',
  email: '',
  telefone: '',
}

type AlunoFormState = typeof initialFormState
type AlunoFormField = keyof AlunoFormState

export function AlunosPage() {
  const {
    data: alunos,
    setData: setAlunos,
    errorMessage,
    isLoading,
    reload,
  } = useResourceList({
    load: alunoService.listar,
  })
  const { getErrorMessage } = useApiError()
  const [statusOverrides, setStatusOverrides] = useState<Record<number, StatusAluno>>({})
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)
  const [formState, setFormState] = useState<AlunoFormState>(initialFormState)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [alunoToInactivate, setAlunoToInactivate] = useState<Aluno | null>(null)
  const [inactivateLoadingId, setInactivateLoadingId] = useState<number | null>(null)

  const trimmedSearch = searchTerm.trim().toLowerCase()
  const filteredAlunos = trimmedSearch
    ? alunos.filter((aluno) =>
        [aluno.nome, aluno.email, aluno.telefone].some((value) =>
          value.toLowerCase().includes(trimmedSearch),
        ),
      )
    : alunos

  const hasSearchResults = filteredAlunos.length > 0
  const hasEmptyResults = !isLoading && !errorMessage && alunos.length > 0 && !hasSearchResults
  const hasNoStudents = !isLoading && !errorMessage && alunos.length === 0
  const isEditMode = Boolean(selectedAluno)

  async function alterarStatusAluno(aluno: Aluno, status: StatusAluno) {
    try {
      setStatusUpdatingId(aluno.id)
      setStatusError(null)
      const alunoAtualizado = await alunoService.alterarStatus(aluno.id, status)

      setStatusOverrides((current) => ({
        ...current,
        [alunoAtualizado.id]: alunoAtualizado.status,
      }))
      setAlunos((current) =>
        current.map((item) =>
          item.id === alunoAtualizado.id ? { ...item, status: alunoAtualizado.status } : item,
        ),
      )
    } catch (error) {
      setStatusError(getErrorMessage(error))
    } finally {
      setStatusUpdatingId(null)
    }
  }

  function openAlunoForm(aluno?: Aluno) {
    setSelectedAluno(aluno ?? null)
    setFormState(
      aluno
        ? {
            nome: aluno.nome,
            email: aluno.email,
            telefone: aluno.telefone,
          }
        : initialFormState,
    )
    setFormError(null)
    clearActionFeedback()
    setIsFormOpen(true)
  }

  function closeAlunoForm() {
    setSelectedAluno(null)
    setFormError(null)
    setIsFormOpen(false)
  }

  async function handleAlunoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    clearActionFeedback()

    const { nome, email, telefone } = formState
    if (!nome.trim() || !email.trim() || !telefone.trim()) {
      setFormError('Nome, email e telefone sao obrigatorios.')
      return
    }

    try {
      setIsSaving(true)
      const payload = {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
      }

      const savedAluno = selectedAluno
        ? await alunoService.atualizar(selectedAluno.id, payload)
        : await alunoService.cadastrar(payload)

      setAlunos((current) =>
        selectedAluno
          ? current.map((item) => (item.id === savedAluno.id ? savedAluno : item))
          : [savedAluno, ...current],
      )
      setActionMessage(
        selectedAluno ? 'Aluno atualizado com sucesso.' : 'Aluno cadastrado com sucesso.',
      )
      closeAlunoForm()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  function updateFormField(field: AlunoFormField, value: string) {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  function requestAlunoInactivation(aluno: Aluno) {
    setAlunoToInactivate(aluno)
    clearActionFeedback()
  }

  function cancelAlunoInactivation() {
    setAlunoToInactivate(null)
  }

  async function inativarAluno() {
    if (!alunoToInactivate) {
      return
    }

    try {
      setInactivateLoadingId(alunoToInactivate.id)
      clearActionFeedback()
      await alunoService.inativar(alunoToInactivate.id)
      setStatusOverrides((current) => ({
        ...current,
        [alunoToInactivate.id]: 'INATIVO',
      }))
      setAlunos((current) =>
        current.map((item) =>
          item.id === alunoToInactivate.id ? { ...item, status: 'INATIVO' } : item,
        ),
      )
      setActionMessage('Aluno inativado com sucesso.')
      setAlunoToInactivate(null)
      void reload()
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setInactivateLoadingId(null)
    }
  }

  function clearActionFeedback() {
    setActionError(null)
    setActionMessage(null)
  }

  return (
    <>
      <PageHeader
        eyebrow="Alunos"
        title="Alunos cadastrados"
        description="Gerencie dados de contato e status operacional dos alunos."
        action={
          <button className="primary-button compact" type="button" onClick={() => openAlunoForm()}>
            Novo aluno
          </button>
        }
      />

      <div className="toolbar">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            aria-label="Buscar aluno"
            placeholder="Buscar por nome, email ou telefone"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="ghost-button compact"
              onClick={() => setSearchTerm('')}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {statusError && (
        <StateMessage title="Nao foi possivel alterar o status" description={statusError} />
      )}
      {actionError && <StateMessage title="Nao foi possivel concluir a acao" description={actionError} />}
      {actionMessage && <StateMessage title="Dados atualizados" description={actionMessage} />}

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando alunos..." />}

        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os alunos" description={errorMessage} />
        )}

        {!isLoading && !errorMessage && hasNoStudents && (
          <StateMessage
            title="Nenhum aluno cadastrado"
            description="Quando houver alunos cadastrados na API, eles aparecerao aqui. Use o botao Novo aluno para registrar o primeiro aluno."
          />
        )}

        {!isLoading && !errorMessage && hasEmptyResults && (
          <StateMessage
            title="Nenhum aluno encontrado"
            description="Ajuste o filtro ou limpe a busca para ver todos os alunos cadastrados."
          />
        )}

        {!isLoading && !errorMessage && hasSearchResults && (
          <>
            <p style={{ marginBottom: 14, color: 'var(--color-text-muted)' }}>
              {filteredAlunos.length} de {alunos.length} alunos
            </p>
            <div className="table-wrapper">
              <DataTable headers={['Nome', 'Contato', 'Status', 'Cadastro', 'Acoes']}>
                {filteredAlunos.map((aluno) => {
                  const currentStatus = statusOverrides[aluno.id] ?? aluno.status
                  const isInactive = currentStatus === 'INATIVO'

                  return (
                    <tr key={aluno.id}>
                      <td>{aluno.nome}</td>
                      <td>
                        <div>{aluno.email}</div>
                        <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                          {aluno.telefone}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={currentStatus} />
                      </td>
                      <td>{formatDate(aluno.dataCadastro)}</td>
                      <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="ghost-button compact"
                          onClick={() => openAlunoForm(aluno)}
                          disabled={isInactive}
                        >
                          Editar
                        </button>
                        <StatusDropdown
                          status={currentStatus}
                          isLoading={statusUpdatingId === aluno.id}
                          onChange={(status) => void alterarStatusAluno(aluno, status)}
                        />
                        {!isInactive && (
                          <button
                            type="button"
                            className="btn-danger compact"
                            disabled={inactivateLoadingId === aluno.id}
                            onClick={() => requestAlunoInactivation(aluno)}
                          >
                            {inactivateLoadingId === aluno.id ? 'Inativando...' : 'Inativar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </DataTable>
            </div>
          </>
        )}
      </section>

      <Modal
        isOpen={isFormOpen}
        onClose={closeAlunoForm}
        title={isEditMode ? 'Editar aluno' : 'Cadastrar novo aluno'}
      >
        <p style={{ marginTop: 0, color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
          {isEditMode
            ? 'Atualize os dados de contato do aluno.'
            : 'Preencha os dados para criar um novo aluno.'}
        </p>

        <form onSubmit={handleAlunoSubmit}>
          <FormField label="Nome">
            <input
              id="aluno-nome"
              value={formState.nome}
              onChange={(event) => updateFormField('nome', event.target.value)}
            />
          </FormField>
          <FormField label="Email">
            <input
              id="aluno-email"
              type="email"
              value={formState.email}
              onChange={(event) => updateFormField('email', event.target.value)}
            />
          </FormField>
          <FormField label="Telefone">
            <input
              id="aluno-telefone"
              value={formState.telefone}
              onChange={(event) => updateFormField('telefone', event.target.value)}
            />
          </FormField>

          {formError && <div className="field-error">{formError}</div>}

          <div className="form-actions">
            <button type="button" className="ghost-button" onClick={closeAlunoForm}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isLoading || isSaving}>
              {isSaving ? 'Salvando...' : isEditMode ? 'Salvar alteracoes' : 'Cadastrar aluno'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(alunoToInactivate)}
        title="Inativar aluno"
        description={`Confirma a inativacao de ${alunoToInactivate?.nome ?? 'este aluno'}?`}
        confirmLabel="Inativar"
        isLoading={Boolean(alunoToInactivate && inactivateLoadingId === alunoToInactivate.id)}
        onCancel={cancelAlunoInactivation}
        onConfirm={() => void inativarAluno()}
      />
    </>
  )
}
