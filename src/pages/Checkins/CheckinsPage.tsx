import { useEffect, useMemo, useState } from 'react'
import { useCurrentSearch } from '../../app/routes/router'
import { DataTable } from '../../components/tables/DataTable'
import { TablePagination } from '../../components/tables/TablePagination'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useResourceList } from '../../hooks/useResourceList'
import { checkinService } from '../../services/checkinService'
import type { StatusCheckin } from '../../types/checkin'
import { formatDate } from '../../utils/formatDate'

const PAGE_SIZE = 8
const STATUS_FILTERS: Array<StatusCheckin | 'TODOS'> = [
  'TODOS',
  'AUTORIZADO',
  'BLOQUEADO',
]

export function CheckinsPage() {
  const { data: checkins, errorMessage, isLoading } = useResourceList({
    load: checkinService.listar,
  })
  const currentSearch = useCurrentSearch()
  const [query, setQuery] = useState(() => getInitialSearchParam('q'))
  const [statusFilter, setStatusFilter] = useState<StatusCheckin | 'TODOS'>(() =>
    getInitialStatusFilter(),
  )
  const [page, setPage] = useState(1)

  const filteredCheckins = useMemo(() => {
    const normalizedQuery = normalizeText(query)

    return checkins.filter((checkin) => {
      const alunoNome = checkin.alunoNome ?? checkin.aluno?.nome ?? '-'
      const matchesStatus = statusFilter === 'TODOS' || checkin.status === statusFilter
      const matchesQuery = normalizedQuery
        ? normalizeText(
            [
              checkin.id,
              alunoNome,
              checkin.status,
              checkin.motivoBloqueio ?? '',
              checkin.dataHora,
            ].join(' '),
          ).includes(normalizedQuery)
        : true

      return matchesStatus && matchesQuery
    })
  }, [checkins, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredCheckins.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleCheckins = filteredCheckins.slice(
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

  return (
    <>
      <PageHeader
        eyebrow="Check-ins"
        title="Acessos da academia"
        description="Historico inicial de entradas autorizadas ou bloqueadas pelo backend."
      />

      <div className="toolbar">
        <input
          aria-label="Buscar check-in"
          placeholder="Buscar por aluno, motivo, data ou ID"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
        />
        <select
          aria-label="Filtrar check-ins por status"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as StatusCheckin | 'TODOS')
            setPage(1)
          }}
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status === 'TODOS' ? 'Todos os status' : status}
            </option>
          ))}
        </select>
        <span>{filteredCheckins.length} check-in(s)</span>
      </div>

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando check-ins..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os check-ins" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && checkins.length === 0 && (
          <StateMessage title="Nenhum check-in encontrado" description="Quando houver acessos registrados, eles aparecerao aqui." />
        )}
        {!isLoading && !errorMessage && checkins.length > 0 && filteredCheckins.length === 0 && (
          <StateMessage title="Nenhum check-in corresponde aos filtros" description="Ajuste a busca ou limpe o filtro de status." />
        )}
        {!isLoading && !errorMessage && filteredCheckins.length > 0 && (
          <>
          <DataTable headers={['ID', 'Aluno', 'Data e hora', 'Status', 'Motivo']}>
            {visibleCheckins.map((checkin) => (
              <tr key={checkin.id}>
                <td>{checkin.id}</td>
                <td>{checkin.alunoNome ?? checkin.aluno?.nome ?? '-'}</td>
                <td>{formatDate(checkin.dataHora)}</td>
                <td><StatusBadge status={checkin.status} /></td>
                <td>{checkin.motivoBloqueio ?? '-'}</td>
              </tr>
            ))}
          </DataTable>
          <TablePagination
            page={safePage}
            pageSize={PAGE_SIZE}
            totalItems={filteredCheckins.length}
            onPageChange={setPage}
          />
          </>
        )}
      </section>
    </>
  )
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getInitialSearchParam(key: string) {
  return getSearchParam(window.location.search, key)
}

function getInitialStatusFilter(): StatusCheckin | 'TODOS' {
  return getStatusFilterFromSearch(window.location.search)
}

function getSearchParam(search: string, key: string) {
  return new URLSearchParams(search).get(key) ?? ''
}

function getStatusFilterFromSearch(search: string): StatusCheckin | 'TODOS' {
  const status = new URLSearchParams(search).get('status')

  return STATUS_FILTERS.includes(status as StatusCheckin | 'TODOS')
    ? (status as StatusCheckin | 'TODOS')
    : 'TODOS'
}
