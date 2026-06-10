import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable } from '../../components/tables/DataTable'
import { TablePagination } from '../../components/tables/TablePagination'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusDropdown } from '../../components/ui/StatusDropdown'
import { useApiError } from '../../hooks/useApiError'
import { useResourceList } from '../../hooks/useResourceList'
import { useCurrentSearch } from '../../app/routes/router'
import { alunoService } from '../../services/alunoService'
import type { Aluno, StatusAluno } from '../../types/aluno'
import { formatDate } from '../../utils/formatDate'

const PAGE_SIZE = 8
const STATUS_FILTERS: Array<StatusAluno | 'TODOS'> = [
  'TODOS',
  'ATIVO',
  'INADIMPLENTE',
  'BLOQUEADO',
  'CANCELADO',
  'INATIVO',
]

type AlunoFormState = {
  nome: string
  email: string
  telefone: string
}

type AlunoFormField = keyof AlunoFormState

const EMPTY_FORM: AlunoFormState = {
  nome: '',
  email: '',
  telefone: '',
}

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
  const currentSearch = useCurrentSearch()
  const [statusOverrides, setStatusOverrides] = useState<Record<number, StatusAluno>>({})
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [query, setQuery] = useState(() => getInitialSearchParam('q'))
  const [statusFilter, setStatusFilter] = useState<StatusAluno | 'TODOS'>(() =>
    getInitialStatusFilter(),
  )
  const [page, setPage] = useState(1)
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null)
  const [removingAluno, setRemovingAluno] = useState<Aluno | null>(null)
  const [formData, setFormData] = useState<AlunoFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const filteredAlunos = useMemo(() => {
    const normalizedQuery = normalizeText(query)

    return alunos.filter((aluno) => {
      const currentStatus = statusOverrides[aluno.id] ?? aluno.status
      const matchesStatus = statusFilter === 'TODOS' || currentStatus === statusFilter
      const matchesQuery = normalizedQuery
        ? normalizeText(
            [
              aluno.id,
              aluno.nome,
              aluno.email,
              aluno.telefone,
              currentStatus,
            ].join(' '),
          ).includes(normalizedQuery)
        : true

      return matchesStatus && matchesQuery
    })
  }, [alunos, query, statusFilter, statusOverrides])

  const totalPages = Math.max(1, Math.ceil(filteredAlunos.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleAlunos = filteredAlunos.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setQuery(getSearchParam(currentSearch, 'q'))
      setStatusFilter(getStatusFilterFromSearch(currentSearch))
      setPage(1)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [currentSearch])

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

  function handleSearch(value: string) {
    setQuery(value)
    setPage(1)
  }

  function handleStatusFilter(value: StatusAluno | 'TODOS') {
    setStatusFilter(value)
    setPage(1)
  }

  function openCreateModal() {
    setEditingAluno(null)
    setFormData(EMPTY_FORM)
    setFormError(null)
    setActionMessage(null)
    setStatusError(null)
    setIsFormOpen(true)
  }

  function openEditModal(aluno: Aluno) {
    setEditingAluno(aluno)
    setFormData({
      nome: aluno.nome,
      email: aluno.email,
      telefone: aluno.telefone,
    })
    setFormError(null)
    setActionMessage(null)
    setStatusError(null)
    setIsFormOpen(true)
  }

  function closeAlunoForm() {
    setEditingAluno(null)
    setFormError(null)
    setIsFormOpen(false)
  }

  function updateFormField(field: AlunoFormField, value: string) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmitAluno(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setActionMessage(null)

    const payload = {
      nome: formData.nome.trim(),
      email: formData.email.trim(),
      telefone: formData.telefone.trim(),
    }

    if (!payload.nome || !payload.email || !payload.telefone) {
      setFormError('Preencha nome, email e telefone.')
      return
    }

    try {
      setIsSaving(true)
      const savedAluno = editingAluno
        ? await alunoService.atualizar(editingAluno.id, payload)
        : await alunoService.cadastrar(payload)

      setAlunos((current) =>
        editingAluno
          ? current.map((item) => (item.id === savedAluno.id ? savedAluno : item))
          : [savedAluno, ...current],
      )
      setActionMessage(
        editingAluno ? 'Aluno atualizado com sucesso.' : 'Aluno cadastrado com sucesso.',
      )
      setStatusOverrides((current) => {
        const next = { ...current }
        delete next[savedAluno.id]
        return next
      })
      closeAlunoForm()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemoveAluno() {
    if (!removingAluno) {
      return
    }

    try {
      setIsRemoving(true)
      setStatusError(null)
      setActionMessage(null)
      await alunoService.inativar(removingAluno.id)
      setStatusOverrides((current) => ({
        ...current,
        [removingAluno.id]: 'INATIVO',
      }))
      setAlunos((current) =>
        current.map((item) =>
          item.id === removingAluno.id ? { ...item, status: 'INATIVO' } : item,
        ),
      )
      setActionMessage('Aluno inativado com sucesso.')
      setRemovingAluno(null)
      void reload()
    } catch (error) {
      setStatusError(getErrorMessage(error))
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Alunos"
        title="Alunos cadastrados"
        description="Gerencie dados de contato e status operacional dos alunos."
        action={<button className="primary-button compact" type="button" onClick={openCreateModal}>Novo aluno</button>}
      />

      <div className="toolbar">
        <input
          aria-label="Buscar aluno"
          placeholder="Buscar por nome, email, telefone ou ID"
          value={query}
          onChange={(event) => handleSearch(event.target.value)}
        />
        <select
          aria-label="Filtrar alunos por status"
          value={statusFilter}
          onChange={(event) => handleStatusFilter(event.target.value as StatusAluno | 'TODOS')}
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status === 'TODOS' ? 'Todos os status' : formatStatus(status)}
            </option>
          ))}
        </select>
        <span>{filteredAlunos.length} aluno(s)</span>
      </div>

      {actionMessage && (
        <div className="alert alert--success page-toast" role="status">
          {actionMessage}
        </div>
      )}

      {statusError && (
        <div className="alert alert--error page-toast" role="alert">
          {statusError}
        </div>
      )}

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando alunos..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os alunos" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && alunos.length === 0 && (
          <StateMessage
            title="Nenhum aluno encontrado"
            description="Quando houver alunos cadastrados na API, eles aparecerao aqui."
          />
        )}
        {!isLoading && !errorMessage && alunos.length > 0 && filteredAlunos.length === 0 && (
          <StateMessage
            title="Nenhum aluno corresponde aos filtros"
            description="Ajuste a busca ou limpe o filtro de status para ampliar os resultados."
          />
        )}
        {!isLoading && !errorMessage && filteredAlunos.length > 0 && (
          <>
            <DataTable headers={['ID', 'Nome', 'Email', 'Telefone', 'Status', 'Cadastro', 'Acoes']}>
              {visibleAlunos.map((aluno) => {
                const currentStatus = statusOverrides[aluno.id] ?? aluno.status

                return (
                  <tr key={aluno.id}>
                    <td>{aluno.id}</td>
                    <td>{aluno.nome}</td>
                    <td>{aluno.email}</td>
                    <td>{aluno.telefone}</td>
                    <td>
                      <StatusDropdown
                        status={currentStatus}
                        isLoading={statusUpdatingId === aluno.id}
                        onChange={(status) => void alterarStatusAluno(aluno, status)}
                      />
                    </td>
                    <td>{formatDate(aluno.dataCadastro)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="ghost-button btn-sm" type="button" onClick={() => openEditModal(aluno)}>
                          Editar
                        </button>
                        <button className="btn-danger btn-sm" type="button" onClick={() => setRemovingAluno(aluno)}>
                          Inativar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </DataTable>
            <TablePagination
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={filteredAlunos.length}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <Modal
        isOpen={isFormOpen}
        title={editingAluno ? 'Editar aluno' : 'Novo aluno'}
        onClose={closeAlunoForm}
      >
        <form onSubmit={(event) => void handleSubmitAluno(event)}>
          <FormField label="Nome">
            <input
              className="form-control"
              value={formData.nome}
              onChange={(event) => updateFormField('nome', event.target.value)}
            />
          </FormField>
          <FormField label="Email">
            <input
              className="form-control"
              type="email"
              value={formData.email}
              onChange={(event) => updateFormField('email', event.target.value)}
            />
          </FormField>
          <FormField label="Telefone">
            <input
              className="form-control"
              value={formData.telefone}
              onChange={(event) => updateFormField('telefone', event.target.value)}
            />
          </FormField>

          {formError && <p className="form-error">{formError}</p>}

          <div className="form-actions">
            <button className="ghost-button" type="button" disabled={isSaving} onClick={closeAlunoForm}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(removingAluno)}
        title="Inativar aluno"
        description={`Confirma a inativacao de ${removingAluno?.nome ?? 'este aluno'}? O aluno deixara de aparecer como ativo.`}
        confirmLabel="Inativar"
        isLoading={isRemoving}
        onCancel={() => setRemovingAluno(null)}
        onConfirm={() => void handleRemoveAluno()}
      />
    </>
  )
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ')
}

function getInitialSearchParam(key: string) {
  return getSearchParam(window.location.search, key)
}

function getInitialStatusFilter(): StatusAluno | 'TODOS' {
  return getStatusFilterFromSearch(window.location.search)
}

function getSearchParam(search: string, key: string) {
  return new URLSearchParams(search).get(key) ?? ''
}

function getStatusFilterFromSearch(search: string): StatusAluno | 'TODOS' {
  const status = new URLSearchParams(search).get('status')

  return STATUS_FILTERS.includes(status as StatusAluno | 'TODOS')
    ? (status as StatusAluno | 'TODOS')
    : 'TODOS'
}
