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
import { matriculaService } from '../../services/matriculaService'
import { pagamentoService } from '../../services/pagamentoService'
import { planoService } from '../../services/planoService'
import type { Matricula } from '../../types/matricula'
import type { Plano } from '../../types/plano'
import type { FormaPagamento, Pagamento, PagamentoRequestDTO, StatusPagamento } from '../../types/pagamento'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

const PAGE_SIZE = 8
const STATUS_FILTERS: Array<StatusPagamento | 'TODOS'> = ['TODOS', 'PENDENTE', 'PAGO', 'CANCELADO']
const FORMAS_PAGAMENTO: FormaPagamento[] = ['PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO']

const FORMA_LABELS: Record<FormaPagamento, string> = {
  PIX: 'Pix',
  DINHEIRO: 'Dinheiro',
  CARTAO_CREDITO: 'Cartao de credito',
  CARTAO_DEBITO: 'Cartao de debito',
}

type PagamentoFormState = {
  matriculaId: string
  valor: string
  formaPagamento: FormaPagamento | ''
}

const EMPTY_FORM: PagamentoFormState = { matriculaId: '', valor: '', formaPagamento: '' }

export function PagamentosPage() {
  const {
    data: pagamentos,
    setData: setPagamentos,
    errorMessage,
    isLoading,
    reload,
  } = useResourceList({ load: pagamentoService.listar })
  const { getErrorMessage } = useApiError()
  const currentSearch = useCurrentSearch()

  const [query, setQuery] = useState(() => getInitialSearchParam('q'))
  const [statusFilter, setStatusFilter] = useState<StatusPagamento | 'TODOS'>(() =>
    getInitialStatusFilter(),
  )
  const [page, setPage] = useState(1)
  const [cancelingPagamento, setCancelingPagamento] = useState<Pagamento | null>(null)
  const [formData, setFormData] = useState<PagamentoFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoadingModal, setIsLoadingModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [matriculasAtivas, setMatriculasAtivas] = useState<Matricula[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])

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
              pagamento.dataPagamento ?? '',
            ].join(' '),
          ).includes(normalizedQuery)
        : true
      return matchesStatus && matchesQuery
    })
  }, [pagamentos, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredPagamentos.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visiblePagamentos = filteredPagamentos.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setQuery(getSearchParam(currentSearch, 'q'))
      setStatusFilter(getStatusFilterFromSearch(currentSearch))
      setPage(1)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [currentSearch])

  // Auto-fill valor when matriculaId changes
  useEffect(() => {
    if (!formData.matriculaId) return
    const matricula = matriculasAtivas.find((m) => String(m.id) === formData.matriculaId)
    if (!matricula?.planoId) return
    const plano = planos.find((p) => p.id === matricula.planoId)
    if (plano) {
      setFormData((f) => ({ ...f, valor: String(plano.valorMensal) }))
    }
  }, [formData.matriculaId, matriculasAtivas, planos])

  async function openCreateModal() {
    setFormData(EMPTY_FORM)
    setFormError(null)
    setActionMessage(null)
    setIsLoadingModal(true)
    setIsFormOpen(true)
    try {
      const [all, allPlanos] = await Promise.all([
        matriculaService.listar(),
        planoService.listar(),
      ])
      setMatriculasAtivas(all.filter((m) => m.status === 'ATIVA'))
      setPlanos(allPlanos)
    } finally {
      setIsLoadingModal(false)
    }
  }

  function closeForm() {
    setFormError(null)
    setIsFormOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setActionMessage(null)

    const valor = parseFloat(formData.valor.replace(',', '.'))

    if (!formData.matriculaId) {
      setFormError('Selecione uma matricula.')
      return
    }
    if (isNaN(valor) || valor <= 0) {
      setFormError('Informe um valor valido.')
      return
    }
    if (!formData.formaPagamento) {
      setFormError('Selecione a forma de pagamento.')
      return
    }

    const payload: PagamentoRequestDTO = {
      matriculaId: Number(formData.matriculaId),
      valor,
      formaPagamento: formData.formaPagamento as FormaPagamento,
    }

    try {
      setIsSaving(true)
      const saved = await pagamentoService.registrar(payload)
      setPagamentos((current) => [saved, ...current])
      setActionMessage(`Pagamento de ${formatCurrency(saved.valor)} registrado para ${saved.alunoNome ?? 'aluno'}.`)
      closeForm()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCancelar() {
    if (!cancelingPagamento) return
    try {
      setIsCanceling(true)
      setActionMessage(null)
      const updated = await pagamentoService.cancelar(cancelingPagamento.id)
      setPagamentos((current) =>
        current.map((p) => (p.id === updated.id ? updated : p)),
      )
      setActionMessage('Pagamento cancelado.')
      setCancelingPagamento(null)
      void reload()
    } catch (error) {
      setActionMessage(getErrorMessage(error))
      setCancelingPagamento(null)
    } finally {
      setIsCanceling(false)
    }
  }

  const selectedMatricula = matriculasAtivas.find(
    (m) => String(m.id) === formData.matriculaId,
  )
  const valorSugerido = selectedMatricula?.planoId
    ? planos.find((p) => p.id === selectedMatricula.planoId)?.valorMensal
    : undefined

  return (
    <>
      <PageHeader
        eyebrow="Pagamentos"
        title="Controle financeiro"
        description="Registre pagamentos e gerencie o status financeiro dos alunos."
        action={
          <button
            className="primary-button compact"
            type="button"
            onClick={() => void openCreateModal()}
          >
            Registrar pagamento
          </button>
        }
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
              {status === 'TODOS' ? 'Todos os status' : status}
            </option>
          ))}
        </select>
        <span>{filteredPagamentos.length} pagamento(s)</span>
      </div>

      {actionMessage && (
        <div className="alert alert--success page-toast" role="status">
          {actionMessage}
        </div>
      )}

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando pagamentos..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os pagamentos" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && pagamentos.length === 0 && (
          <StateMessage title="Nenhum pagamento encontrado" description="Registre o primeiro pagamento." />
        )}
        {!isLoading && !errorMessage && pagamentos.length > 0 && filteredPagamentos.length === 0 && (
          <StateMessage title="Nenhum pagamento corresponde aos filtros" description="Ajuste a busca ou o filtro de status." />
        )}
        {!isLoading && !errorMessage && filteredPagamentos.length > 0 && (
          <>
            <DataTable headers={['ID', 'Aluno', 'Matricula', 'Valor', 'Forma', 'Status', 'Data pag.', 'Acoes']}>
              {visiblePagamentos.map((pagamento) => (
                <tr key={pagamento.id}>
                  <td>{pagamento.id}</td>
                  <td>{pagamento.alunoNome ?? '-'}</td>
                  <td>{pagamento.matriculaId ?? '-'}</td>
                  <td><strong>{formatCurrency(pagamento.valor)}</strong></td>
                  <td>{pagamento.formaPagamento ? FORMA_LABELS[pagamento.formaPagamento] ?? pagamento.formaPagamento : '-'}</td>
                  <td><StatusBadge status={pagamento.status} /></td>
                  <td>{formatDate(pagamento.dataPagamento ?? undefined)}</td>
                  <td>
                    {pagamento.status !== 'CANCELADO' && (
                      <button
                        className="btn-danger btn-sm"
                        type="button"
                        onClick={() => setCancelingPagamento(pagamento)}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
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

      <Modal isOpen={isFormOpen} title="Registrar pagamento" onClose={closeForm}>
        {isLoadingModal ? (
          <StateMessage title="Carregando matriculas..." />
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)}>
            <FormField label="Matricula ativa">
              <select
                className="form-control"
                value={formData.matriculaId}
                autoFocus
                onChange={(event) =>
                  setFormData((f) => ({ ...f, matriculaId: event.target.value }))
                }
              >
                <option value="">Selecione uma matricula...</option>
                {matriculasAtivas.map((m) => {
                  const plano = planos.find((p) => p.id === m.planoId)
                  const preco = plano ? ` — ${formatCurrency(plano.valorMensal)}` : ''
                  return (
                    <option key={m.id} value={m.id}>
                      #{m.id} {m.alunoNome ?? 'Aluno'} / {m.planoNome ?? 'Plano'}{preco}
                    </option>
                  )
                })}
              </select>
              {selectedMatricula && (
                <p className="field-hint">
                  Validade: {formatDate(selectedMatricula.dataFim)}
                  {valorSugerido !== undefined && (
                    <> &middot; Valor do plano: <strong>{formatCurrency(valorSugerido)}</strong></>
                  )}
                </p>
              )}
            </FormField>

            <FormField label="Valor (R$)">
              <input
                className="form-control"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.valor}
                placeholder={valorSugerido !== undefined ? String(valorSugerido) : '0,00'}
                onChange={(event) => setFormData((f) => ({ ...f, valor: event.target.value }))}
              />
              {valorSugerido !== undefined && formData.valor !== String(valorSugerido) && (
                <button
                  type="button"
                  className="field-hint-link"
                  onClick={() => setFormData((f) => ({ ...f, valor: String(valorSugerido) }))}
                >
                  Usar valor do plano ({formatCurrency(valorSugerido)})
                </button>
              )}
            </FormField>

            <FormField label="Forma de pagamento">
              <select
                className="form-control"
                value={formData.formaPagamento}
                onChange={(event) =>
                  setFormData((f) => ({ ...f, formaPagamento: event.target.value as FormaPagamento }))
                }
              >
                <option value="">Selecione...</option>
                {FORMAS_PAGAMENTO.map((forma) => (
                  <option key={forma} value={forma}>
                    {FORMA_LABELS[forma]}
                  </option>
                ))}
              </select>
            </FormField>

            {formError && <p className="form-error">{formError}</p>}

            <div className="form-actions">
              <button className="ghost-button" type="button" disabled={isSaving} onClick={closeForm}>
                Cancelar
              </button>
              <button className="primary-button" type="submit" disabled={isSaving || !formData.matriculaId}>
                {isSaving ? 'Registrando...' : 'Registrar pagamento'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(cancelingPagamento)}
        title="Cancelar pagamento"
        description={`Confirma o cancelamento do pagamento #${cancelingPagamento?.id ?? ''}${cancelingPagamento?.alunoNome ? ` de ${cancelingPagamento.alunoNome}` : ''}?`}
        confirmLabel="Cancelar pagamento"
        isLoading={isCanceling}
        onCancel={() => setCancelingPagamento(null)}
        onConfirm={() => void handleCancelar()}
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

function getInitialStatusFilter(): StatusPagamento | 'TODOS' {
  return getStatusFilterFromSearch(window.location.search)
}

function getSearchParam(search: string, key: string) {
  return new URLSearchParams(search).get(key) ?? ''
}

function getStatusFilterFromSearch(search: string): StatusPagamento | 'TODOS' {
  const status = new URLSearchParams(search).get('status')
  return STATUS_FILTERS.includes(status as StatusPagamento | 'TODOS')
    ? (status as StatusPagamento | 'TODOS')
    : 'TODOS'
}
