import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useCurrentSearch } from '../../app/routes/router'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DataTable } from '../../components/tables/DataTable'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { TablePagination } from '../../components/tables/TablePagination'
import { useApiError } from '../../hooks/useApiError'
import { useResourceList } from '../../hooks/useResourceList'
import { alunoService } from '../../services/alunoService'
import { matriculaService } from '../../services/matriculaService'
import { planoService } from '../../services/planoService'
import type { Matricula, StatusMatricula } from '../../types/matricula'
import { formatDate } from '../../utils/formatDate'

const PAGE_SIZE = 8
const STATUS_FILTERS: Array<StatusMatricula | 'TODOS'> = ['TODOS', 'ATIVA', 'VENCIDA', 'CANCELADA']

type MatriculaFormState = {
  alunoId: string
  planoId: string
  dataInicio: string
}

const EMPTY_FORM: MatriculaFormState = { alunoId: '', planoId: '', dataInicio: '' }

export function MatriculasPage() {
  const {
    data: matriculas,
    setData: setMatriculas,
    errorMessage,
    isLoading,
    reload,
  } = useResourceList({ load: matriculaService.listar })
  const { getErrorMessage } = useApiError()
  const currentSearch = useCurrentSearch()
  const [query, setQuery] = useState(() => getInitialSearchParam('q'))
  const [statusFilter, setStatusFilter] = useState<StatusMatricula | 'TODOS'>(() =>
    getInitialStatusFilter(),
  )
  const [page, setPage] = useState(1)
  const [cancelingMatricula, setCancelingMatricula] = useState<Matricula | null>(null)
  const [formData, setFormData] = useState<MatriculaFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [reactivatingId, setReactivatingId] = useState<number | null>(null)
  const [alunos, setAlunos] = useState<Array<{ id: number; nome: string }>>([])
  const [planos, setPlanos] = useState<Array<{ id: number; nome: string }>>([])

  const filteredMatriculas = useMemo(() => {
    const normalizedQuery = normalizeText(query)
    return matriculas.filter((matricula) => {
      const alunoNome = getAlunoNome(matricula)
      const planoNome = matricula.planoNome ?? '-'
      const matchesStatus = statusFilter === 'TODOS' || matricula.status === statusFilter
      const matchesQuery = normalizedQuery
        ? normalizeText(
            [matricula.id, alunoNome, planoNome, matricula.status, matricula.dataInicio ?? '', matricula.dataFim ?? ''].join(' '),
          ).includes(normalizedQuery)
        : true
      return matchesStatus && matchesQuery
    })
  }, [matriculas, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMatriculas.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleMatriculas = filteredMatriculas.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setQuery(getSearchParam(currentSearch, 'q'))
      setStatusFilter(getStatusFilterFromSearch(currentSearch))
      setPage(1)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [currentSearch])

  async function openCreateModal() {
    setFormData(EMPTY_FORM)
    setFormError(null)
    setActionMessage(null)
    const [alunosRes, planosRes] = await Promise.all([
      alunoService.listar(),
      planoService.listar(),
    ])
    setAlunos(
      alunosRes
        .filter((a) => a.status === 'ATIVO')
        .map((a) => ({ id: a.id, nome: a.nome })),
    )
    setPlanos(
      planosRes
        .filter((p) => p.ativo)
        .map((p) => ({ id: p.id, nome: p.nome })),
    )
    setIsFormOpen(true)
  }

  function closeForm() {
    setFormError(null)
    setIsFormOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setActionMessage(null)

    if (!formData.alunoId || !formData.planoId || !formData.dataInicio) {
      setFormError('Preencha todos os campos.')
      return
    }

    try {
      setIsSaving(true)
      const saved = await matriculaService.criar({
        alunoId: Number(formData.alunoId),
        planoId: Number(formData.planoId),
        dataInicio: formData.dataInicio,
      })
      setMatriculas((current) => [saved, ...current])
      setActionMessage('Matricula criada com sucesso.')
      closeForm()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCancelar() {
    if (!cancelingMatricula) return
    try {
      setIsCanceling(true)
      setActionMessage(null)
      const updated = await matriculaService.cancelar(cancelingMatricula.id)
      setMatriculas((current) =>
        current.map((m) => (m.id === updated.id ? updated : m)),
      )
      setActionMessage('Matricula cancelada.')
      setCancelingMatricula(null)
      void reload()
    } catch (error) {
      setActionMessage(getErrorMessage(error))
      setCancelingMatricula(null)
    } finally {
      setIsCanceling(false)
    }
  }

  async function handleReativar(matricula: Matricula) {
    try {
      setReactivatingId(matricula.id)
      setActionMessage(null)
      const updated = await matriculaService.reativar(matricula.id)
      setMatriculas((current) =>
        current.map((m) => (m.id === updated.id ? updated : m)),
      )
      setActionMessage('Matricula reativada.')
    } catch (error) {
      setActionMessage(getErrorMessage(error))
    } finally {
      setReactivatingId(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Matriculas"
        title="Matriculas ativas e historico"
        description="Vincule alunos a planos e gerencie vencimentos e cancelamentos."
        action={
          <button
            className="primary-button compact"
            type="button"
            onClick={() => void openCreateModal()}
          >
            Nova matricula
          </button>
        }
      />

      <div className="toolbar">
        <input
          aria-label="Buscar matricula"
          placeholder="Buscar por aluno, plano, status ou ID"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
        />
        <select
          aria-label="Filtrar matriculas por status"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as StatusMatricula | 'TODOS')
            setPage(1)
          }}
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status === 'TODOS' ? 'Todos os status' : status}
            </option>
          ))}
        </select>
        <span>{filteredMatriculas.length} matricula(s)</span>
      </div>

      {actionMessage && (
        <div className="alert alert--success page-toast" role="status">
          {actionMessage}
        </div>
      )}

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando matriculas..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar as matriculas" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && matriculas.length === 0 && (
          <StateMessage title="Nenhuma matricula encontrada" description="Crie uma matricula para vincular um aluno a um plano." />
        )}
        {!isLoading && !errorMessage && matriculas.length > 0 && filteredMatriculas.length === 0 && (
          <StateMessage title="Nenhuma matricula corresponde aos filtros" description="Ajuste a busca ou o filtro de status." />
        )}
        {!isLoading && !errorMessage && filteredMatriculas.length > 0 && (
          <>
            <DataTable headers={['ID', 'Aluno', 'Plano', 'Status', 'Inicio', 'Vencimento', 'Acoes']}>
              {visibleMatriculas.map((matricula) => (
                <tr key={matricula.id}>
                  <td>{matricula.id}</td>
                  <td>{getAlunoNome(matricula)}</td>
                  <td>{matricula.planoNome ?? '-'}</td>
                  <td><StatusBadge status={matricula.status} /></td>
                  <td>{formatDate(matricula.dataInicio)}</td>
                  <td>{formatDate(matricula.dataFim)}</td>
                  <td>
                    {matricula.status === 'ATIVA' && (
                      <button
                        className="btn-danger btn-sm"
                        type="button"
                        onClick={() => setCancelingMatricula(matricula)}
                      >
                        Cancelar
                      </button>
                    )}
                    {matricula.status !== 'ATIVA' && (
                      <button
                        className="primary-button btn-sm"
                        type="button"
                        disabled={reactivatingId === matricula.id}
                        onClick={() => void handleReativar(matricula)}
                      >
                        {reactivatingId === matricula.id ? 'Reativando...' : 'Reativar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </DataTable>
            <TablePagination
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={filteredMatriculas.length}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <Modal isOpen={isFormOpen} title="Nova matricula" onClose={closeForm}>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <FormField label="Aluno">
            <select
              className="form-control"
              value={formData.alunoId}
              onChange={(event) => setFormData((f) => ({ ...f, alunoId: event.target.value }))}
            >
              <option value="">Selecione um aluno...</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Plano">
            <select
              className="form-control"
              value={formData.planoId}
              onChange={(event) => setFormData((f) => ({ ...f, planoId: event.target.value }))}
            >
              <option value="">Selecione um plano...</option>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Data de inicio">
            <input
              className="form-control"
              type="date"
              value={formData.dataInicio}
              onChange={(event) => setFormData((f) => ({ ...f, dataInicio: event.target.value }))}
            />
          </FormField>

          {formError && <p className="form-error">{formError}</p>}

          <div className="form-actions">
            <button className="ghost-button" type="button" disabled={isSaving} onClick={closeForm}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Criar matricula'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(cancelingMatricula)}
        title="Cancelar matricula"
        description={`Confirma o cancelamento da matricula de ${getAlunoNome(cancelingMatricula)}?`}
        confirmLabel="Cancelar matricula"
        isLoading={isCanceling}
        onCancel={() => setCancelingMatricula(null)}
        onConfirm={() => void handleCancelar()}
      />
    </>
  )
}

function getAlunoNome(matricula: Matricula | null) {
  if (!matricula) return ''
  return matricula.alunoNome ?? '-'
}

function normalizeText(value: string | number) {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function getInitialSearchParam(key: string) {
  return getSearchParam(window.location.search, key)
}

function getInitialStatusFilter(): StatusMatricula | 'TODOS' {
  return getStatusFilterFromSearch(window.location.search)
}

function getSearchParam(search: string, key: string) {
  return new URLSearchParams(search).get(key) ?? ''
}

function getStatusFilterFromSearch(search: string): StatusMatricula | 'TODOS' {
  const status = new URLSearchParams(search).get('status')
  return STATUS_FILTERS.includes(status as StatusMatricula | 'TODOS')
    ? (status as StatusMatricula | 'TODOS')
    : 'TODOS'
}
