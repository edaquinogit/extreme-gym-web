import { useMemo, useState } from 'react'
import { DataTable } from '../../components/tables/DataTable'
import { TablePagination } from '../../components/tables/TablePagination'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useResourceList } from '../../hooks/useResourceList'
import { planoService } from '../../services/planoService'
import type { StatusPlano } from '../../types/plano'
import { formatCurrency } from '../../utils/formatCurrency'

const PAGE_SIZE = 8
const STATUS_FILTERS: Array<StatusPlano | 'TODOS'> = ['TODOS', 'ATIVO', 'INATIVO']

export function PlanosPage() {
  const { data: planos, errorMessage, isLoading } = useResourceList({
    load: planoService.listar,
  })
  const [query, setQuery] = useState(() => getInitialSearchParam('q'))
  const [statusFilter, setStatusFilter] = useState<StatusPlano | 'TODOS'>(() =>
    getInitialStatusFilter(),
  )
  const [page, setPage] = useState(1)

  const filteredPlanos = useMemo(() => {
    const normalizedQuery = normalizeText(query)

    return planos.filter((plano) => {
      const matchesStatus = statusFilter === 'TODOS' || plano.status === statusFilter
      const matchesQuery = normalizedQuery
        ? normalizeText(
            [
              plano.id,
              plano.nome,
              plano.descricao ?? '',
              plano.valor,
              plano.duracaoDias ?? '',
              plano.status,
            ].join(' '),
          ).includes(normalizedQuery)
        : true

      return matchesStatus && matchesQuery
    })
  }, [planos, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredPlanos.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visiblePlanos = filteredPlanos.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  return (
    <>
      <PageHeader
        eyebrow="Planos"
        title="Planos da academia"
        description="Tabela inicial para acompanhar planos ativos e inativos vindos de /planos."
        action={<button className="primary-button compact" type="button">Novo plano</button>}
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
            setStatusFilter(event.target.value as StatusPlano | 'TODOS')
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

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando planos..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os planos" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && planos.length === 0 && (
          <StateMessage title="Nenhum plano encontrado" description="Cadastre planos na API para visualiza-los aqui." />
        )}
        {!isLoading && !errorMessage && planos.length > 0 && filteredPlanos.length === 0 && (
          <StateMessage title="Nenhum plano corresponde aos filtros" description="Ajuste a busca ou limpe o filtro de status." />
        )}
        {!isLoading && !errorMessage && filteredPlanos.length > 0 && (
          <>
          <DataTable headers={['ID', 'Nome', 'Valor', 'Duracao', 'Status']}>
            {visiblePlanos.map((plano) => (
              <tr key={plano.id}>
                <td>{plano.id}</td>
                <td>{plano.nome}</td>
                <td>{formatCurrency(plano.valor)}</td>
                <td>{plano.duracaoDias ? `${plano.duracaoDias} dias` : '-'}</td>
                <td><StatusBadge status={plano.status} /></td>
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
  return new URLSearchParams(window.location.search).get(key) ?? ''
}

function getInitialStatusFilter(): StatusPlano | 'TODOS' {
  const status = new URLSearchParams(window.location.search).get('status')

  return STATUS_FILTERS.includes(status as StatusPlano | 'TODOS')
    ? (status as StatusPlano | 'TODOS')
    : 'TODOS'
}
