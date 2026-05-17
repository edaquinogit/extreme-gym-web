export type StatusPagamento = 'PAGO' | 'PENDENTE' | 'ATRASADO' | 'CANCELADO'

export type Pagamento = {
  id: number
  alunoNome?: string
  matriculaId?: number
  valor: number
  status: StatusPagamento
  dataPagamento?: string
  dataVencimento?: string
}
