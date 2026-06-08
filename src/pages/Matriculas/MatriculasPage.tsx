import { useMemo, useState } from 'react'
import { DataTable } from '../../components/tables/DataTable'
import { TablePagination } from '../../components/tables/TablePagination'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useResourceList } from '../../hooks/useResourceList'
import { matriculaService } from '../../services/matriculaService'
import type { Matricula, StatusMatricula } from '../../types/matricula'
import { formatDate } from '../../utils/formatDate'

const PAGE_SIZE = 8
const STATUS_FILTERS: Array<StatusMatricula | 'TODOS'> = [
  'TODOS',
  'ATIVA',
  'PENDENTE',
  'VENCIDA',
  'EXPIRADA',
  'CANCELADA',
]

export function MatriculasPage() {
  const { data: matriculas, errorMessage, isLoading } = useResourceList({
    load: matriculaService.listar,
  })
  const [query, setQuery] = useState(() => getInitialSearchParam('q'))
  const [statusFilter, setStatusFilter] = useState<StatusMatricula | 'TODOS'>(() =>
    getInitialStatusFilter(),
  )
  const [page, setPage] = useState(1)

  const filteredMatriculas = useMemo(() => {
    const normalizedQuery = normalizeText(query)

    return matriculas.filter((matricula) => {
      const alunoNome = getAlunoNome(matricula)
      const planoNome = matricula.planoNome ?? matricula.plano?.nome ?? '-'
      const matchesStatus = statusFilter === 'TODOS' || matricula.status === statusFilter
      const matchesQuery = normalizedQuery
        ? normalizeText(
            [
              matricula.id,
              alunoNome,
              planoNome,
              matricula.status,
              matricula.dataInicio ?? '',
              matricula.dataVencimento ?? '',
            ].join(' '),
          ).includes(normalizedQuery)
        : true

      return matchesStatus && matchesQuery
    })
  }, [matriculas, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMatriculas.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleMatriculas = filteredMatriculas.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  return (
    <>
      <PageHeader
        eyebrow="Matriculas"
        title="Matriculas ativas e historico"
        description="Visao inicial para relacionar aluno, plano, vencimento e status da matricula."
        action={<button className="primary-button compact" type="button">Nova matricula</button>}
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
              {status === 'TODOS' ? 'Todos os status' : formatStatus(status)}
            </option>
          ))}
        </select>
        <span>{filteredMatriculas.length} matricula(s)</span>
      </div>

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando matriculas..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar as matriculas" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && matriculas.length === 0 && (
          <StateMessage title="Nenhuma matricula encontrada" description="As matriculas retornadas pela API aparecerao nesta tabela." />
        )}
        {!isLoading && !errorMessage && matriculas.length > 0 && filteredMatriculas.length === 0 && (
          <StateMessage title="Nenhuma matricula corresponde aos filtros" description="Ajuste a busca ou limpe o filtro de status." />
        )}
        {!isLoading && !errorMessage && filteredMatriculas.length > 0 && (
          <>
          <DataTable headers={['ID', 'Aluno', 'Plano', 'Status', 'Inicio', 'Vencimento']}>
            {visibleMatriculas.map((matricula) => (
              <tr key={matricula.id}>
                <td>{matricula.id}</td>
                <td>{getAlunoNome(matricula)}</td>
                <td>{matricula.planoNome ?? matricula.plano?.nome ?? '-'}</td>
                <td><StatusBadge status={matricula.status} /></td>
                <td>{formatDate(matricula.dataInicio)}</td>
                <td>{formatDate(matricula.dataVencimento)}</td>
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
    </>
  )
}

function getAlunoNome(matricula: Matricula) {
  return matricula.alunoNome ?? matricula.aluno?.nome ?? '-'
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

function getInitialStatusFilter(): StatusMatricula | 'TODOS' {
  const status = new URLSearchParams(window.location.search).get('status')

  return STATUS_FILTERS.includes(status as StatusMatricula | 'TODOS')
    ? (status as StatusMatricula | 'TODOS')
    : 'TODOS'
}
