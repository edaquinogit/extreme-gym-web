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
import { planoService } from '../../services/planoService'
import type { Plano, PlanoRequestDTO } from '../../types/plano'
import { formatCurrency } from '../../utils/formatCurrency'

const PAGE_SIZE = 8
const STATUS_FILTERS: Array<'TODOS' | 'ATIVO' | 'INATIVO'> = ['TODOS', 'ATIVO', 'INATIVO']

type PlanoFormState = {
  nome: string
  descricao: string
  valorMensal: string
  duracaoEmDias: string
}

const EMPTY_FORM: PlanoFormState = {
  nome: '',
  descricao: '',
  valorMensal: '',
  duracaoEmDias: '',
}

export function PlanosPage() {
  const {
    data: planos,
    setData: setPlanos,
    errorMessage,
    isLoading,
    reload,
  } = useResourceList({ load: planoService.listar })
  const { getErrorMessage } = useApiError()
  const currentSearch = useCurrentSearch()
  const [query, setQuery] = useState(() => getInitialSearchParam('q'))
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>(() =>
    getInitialStatusFilter(),
  )
  const [page, setPage] = useState(1)
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null)
  const [removingPlano, setRemovingPlano] = useState<Plano | null>(null)
  const [formData, setFormData] = useState<PlanoFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const filteredPlanos = useMemo(() => {
    const normalizedQuery = normalizeText(query)
    return planos.filter((plano) => {
      const statusLabel = plano.ativo ? 'ATIVO' : 'INATIVO'
      const matchesStatus = statusFilter === 'TODOS' || statusLabel === statusFilter
      const matchesQuery = normalizedQuery
        ? normalizeText(
            [
              plano.id,
              plano.nome,
              plano.descricao ?? '',
              plano.valorMensal,
              plano.duracaoEmDias ?? '',
              statusLabel,
            ].join(' '),
          ).includes(normalizedQuery)
        : true
      return matchesStatus && matchesQuery
    })
  }, [planos, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredPlanos.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visiblePlanos = filteredPlanos.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setQuery(getSearchParam(currentSearch, 'q'))
      setStatusFilter(getStatusFilterFromSearch(currentSearch))
      setPage(1)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [currentSearch])

  function openCreateModal() {
    setEditingPlano(null)
    setFormData(EMPTY_FORM)
    setFormError(null)
    setActionMessage(null)
    setIsFormOpen(true)
  }

  function openEditModal(plano: Plano) {
    setEditingPlano(plano)
    setFormData({
      nome: plano.nome,
      descricao: plano.descricao ?? '',
      valorMensal: String(plano.valorMensal),
      duracaoEmDias: String(plano.duracaoEmDias ?? ''),
    })
    setFormError(null)
    setActionMessage(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingPlano(null)
    setFormError(null)
    setIsFormOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setActionMessage(null)

    const nome = formData.nome.trim()
    const valorMensal = parseFloat(formData.valorMensal.replace(',', '.'))
    const duracaoEmDias = parseInt(formData.duracaoEmDias, 10)

    if (!nome) {
      setFormError('Nome e obrigatorio.')
      return
    }
    if (isNaN(valorMensal) || valorMensal <= 0) {
      setFormError('Informe um valor mensal valido.')
      return
    }
    if (isNaN(duracaoEmDias) || duracaoEmDias <= 0) {
      setFormError('Informe uma duracao em dias valida.')
      return
    }

    const payload: PlanoRequestDTO = {
      nome,
      descricao: formData.descricao.trim() || undefined,
      valorMensal,
      duracaoEmDias,
    }

    try {
      setIsSaving(true)
      const saved = editingPlano
        ? await planoService.atualizar(editingPlano.id, payload)
        : await planoService.criar(payload)

      setPlanos((current) =>
        editingPlano
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current],
      )
      setActionMessage(editingPlano ? 'Plano atualizado com sucesso.' : 'Plano criado com sucesso.')
      closeForm()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemove() {
    if (!removingPlano) return
    try {
      setIsRemoving(true)
      setActionMessage(null)
      await planoService.remover(removingPlano.id)
      setPlanos((current) => current.filter((p) => p.id !== removingPlano.id))
      setActionMessage('Plano removido com sucesso.')
      setRemovingPlano(null)
      void reload()
    } catch (error) {
      setActionMessage(getErrorMessage(error))
      setRemovingPlano(null)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Planos"
        title="Planos da academia"
        description="Gerencie os planos disponiveis para matricula dos alunos."
        action={
          <button className="primary-button compact" type="button" onClick={openCreateModal}>
            Novo plano
          </button>
        }
      />

      <div className="toolbar">
        <input
          aria-label="Buscar plano"
          placeholder="Buscar por nome, valor, duracao ou ID"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
        />
        <select
          aria-label="Filtrar planos por status"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as 'TODOS' | 'ATIVO' | 'INATIVO')
            setPage(1)
          }}
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status === 'TODOS' ? 'Todos os status' : status}
            </option>
          ))}
        </select>
        <span>{filteredPlanos.length} plano(s)</span>
      </div>

      {actionMessage && (
        <div className="alert alert--success page-toast" role="status">
          {actionMessage}
        </div>
      )}

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando planos..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os planos" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && planos.length === 0 && (
          <StateMessage title="Nenhum plano encontrado" description="Cadastre um plano para comecar." />
        )}
        {!isLoading && !errorMessage && planos.length > 0 && filteredPlanos.length === 0 && (
          <StateMessage title="Nenhum plano corresponde aos filtros" description="Ajuste a busca ou o filtro de status." />
        )}
        {!isLoading && !errorMessage && filteredPlanos.length > 0 && (
          <>
            <DataTable headers={['ID', 'Nome', 'Valor', 'Duracao', 'Status', 'Acoes']}>
              {visiblePlanos.map((plano) => (
                <tr key={plano.id}>
                  <td>{plano.id}</td>
                  <td>{plano.nome}</td>
                  <td>{formatCurrency(plano.valorMensal)}</td>
                  <td>{plano.duracaoEmDias ? `${plano.duracaoEmDias} dias` : '-'}</td>
                  <td>
                    <StatusBadge status={plano.ativo ? 'ATIVO' : 'INATIVO'} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="ghost-button btn-sm"
                        type="button"
                        onClick={() => openEditModal(plano)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-danger btn-sm"
                        type="button"
                        onClick={() => setRemovingPlano(plano)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
            <TablePagination
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={filteredPlanos.length}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <Modal
        isOpen={isFormOpen}
        title={editingPlano ? 'Editar plano' : 'Novo plano'}
        onClose={closeForm}
      >
        <form onSubmit={(event) => void handleSubmit(event)}>
          <FormField label="Nome">
            <input
              className="form-control"
              value={formData.nome}
              onChange={(event) => setFormData((f) => ({ ...f, nome: event.target.value }))}
            />
          </FormField>
          <FormField label="Descricao (opcional)">
            <input
              className="form-control"
              value={formData.descricao}
              onChange={(event) => setFormData((f) => ({ ...f, descricao: event.target.value }))}
            />
          </FormField>
          <FormField label="Valor mensal (R$)">
            <input
              className="form-control"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.valorMensal}
              onChange={(event) => setFormData((f) => ({ ...f, valorMensal: event.target.value }))}
            />
          </FormField>
          <FormField label="Duracao em dias">
            <input
              className="form-control"
              type="number"
              min="1"
              step="1"
              value={formData.duracaoEmDias}
              onChange={(event) => setFormData((f) => ({ ...f, duracaoEmDias: event.target.value }))}
            />
          </FormField>

          {formError && <p className="form-error">{formError}</p>}

          <div className="form-actions">
            <button className="ghost-button" type="button" disabled={isSaving} onClick={closeForm}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(removingPlano)}
        title="Excluir plano"
        description={`Confirma a exclusao do plano "${removingPlano?.nome ?? ''}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        isLoading={isRemoving}
        onCancel={() => setRemovingPlano(null)}
        onConfirm={() => void handleRemove()}
      />
    </>
  )
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

function getInitialStatusFilter(): 'TODOS' | 'ATIVO' | 'INATIVO' {
  return getStatusFilterFromSearch(window.location.search)
}

function getSearchParam(search: string, key: string) {
  return new URLSearchParams(search).get(key) ?? ''
}

function getStatusFilterFromSearch(search: string): 'TODOS' | 'ATIVO' | 'INATIVO' {
  const status = new URLSearchParams(search).get('status')
  return STATUS_FILTERS.includes(status as 'TODOS' | 'ATIVO' | 'INATIVO')
    ? (status as 'TODOS' | 'ATIVO' | 'INATIVO')
    : 'TODOS'
}
