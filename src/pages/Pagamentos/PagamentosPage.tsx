import { useMemo, useState } from 'react'
import { DataTable } from '../../components/tables/DataTable'
import { TablePagination } from '../../components/tables/TablePagination'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useResourceList } from '../../hooks/useResourceList'
import { pagamentoService } from '../../services/pagamentoService'
import type { StatusPagamento } from '../../types/pagamento'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

const PAGE_SIZE = 8
const STATUS_FILTERS: Array<StatusPagamento | 'TODOS'> = [
  'TODOS',
  'PENDENTE',
  'ATRASADO',
  'PAGO',
  'CANCELADO',
]

export function PagamentosPage() {
  const { data: pagamentos, errorMessage, isLoading } = useResourceList({
    load: pagamentoService.listar,
  })
  const [query, setQuery] = useState(() => getInitialSearchParam('q'))
  const [statusFilter, setStatusFilter] = useState<StatusPagamento | 'TODOS'>(() =>
    getInitialStatusFilter(),
  )
  const [page, setPage] = useState(1)

  const filteredPagamentos = useMemo(() => {
    const normalizedQuery = normalizeText(query)

    return pagamentos.filter((pagamento) => {
      const matchesStatus = statusFilter === 'TODOS' || pagamento.status === statusFilter
      const matchesQuery = normalizedQuery
        ? normalizeText(
            [
              pagamento.id,
              pagamento.alunoNome ?? '',
              pagamento.matriculaId ?? '',
              pagamento.valor,
              pagamento.formaPagamento ?? '',
              pagamento.status,
              pagamento.dataVencimento ?? '',
              pagamento.dataPagamento ?? '',
            ].join(' '),
          ).includes(normalizedQuery)
        : true

      return matchesStatus && matchesQuery
    })
  }, [pagamentos, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredPagamentos.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visiblePagamentos = filteredPagamentos.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  return (
    <>
      <PageHeader
        eyebrow="Pagamentos"
        title="Controle financeiro"
        description="Tabela preparada para status, valor, vencimento e relacionamento com aluno ou matricula."
      />

      <div className="toolbar">
        <input
          aria-label="Buscar pagamento"
          placeholder="Buscar por aluno, matricula, valor ou ID"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
        />
        <select
          aria-label="Filtrar pagamentos por status"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as StatusPagamento | 'TODOS')
            setPage(1)
          }}
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status === 'TODOS' ? 'Todos os status' : formatStatus(status)}
            </option>
          ))}
        </select>
        <span>{filteredPagamentos.length} pagamento(s)</span>
      </div>

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando pagamentos..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os pagamentos" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && pagamentos.length === 0 && (
          <StateMessage title="Nenhum pagamento encontrado" description="Os pagamentos da API aparecerao aqui." />
        )}
        {!isLoading && !errorMessage && pagamentos.length > 0 && filteredPagamentos.length === 0 && (
          <StateMessage title="Nenhum pagamento corresponde aos filtros" description="Ajuste a busca ou limpe o filtro de status." />
        )}
        {!isLoading && !errorMessage && filteredPagamentos.length > 0 && (
          <>
          <DataTable headers={['ID', 'Aluno', 'Matricula', 'Valor', 'Status', 'Vencimento', 'Pagamento']}>
            {visiblePagamentos.map((pagamento) => (
              <tr key={pagamento.id}>
                <td>{pagamento.id}</td>
                <td>{pagamento.alunoNome ?? '-'}</td>
                <td>{pagamento.matriculaId ?? '-'}</td>
                <td>{formatCurrency(pagamento.valor)}</td>
                <td><StatusBadge status={pagamento.status} /></td>
                <td>{formatDate(pagamento.dataVencimento)}</td>
                <td>{formatDate(pagamento.dataPagamento ?? undefined)}</td>
              </tr>
            ))}
          </DataTable>
          <TablePagination
            page={safePage}
            pageSize={PAGE_SIZE}
            totalItems={filteredPagamentos.length}
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

function formatStatus(status: string) {
  return status.replaceAll('_', ' ')
}

function getInitialSearchParam(key: string) {
  return new URLSearchParams(window.location.search).get(key) ?? ''
}

function getInitialStatusFilter(): StatusPagamento | 'TODOS' {
  const status = new URLSearchParams(window.location.search).get('status')

  return STATUS_FILTERS.includes(status as StatusPagamento | 'TODOS')
    ? (status as StatusPagamento | 'TODOS')
    : 'TODOS'
}
