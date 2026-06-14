export type StatusPagamento = 'PAGO' | 'PENDENTE' | 'CANCELADO'

export type FormaPagamento =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'

export type Pagamento = {
  id: number
  matriculaId?: number
  alunoId?: number
  alunoNome?: string
  planoId?: number
  planoNome?: string
  valor: number
  formaPagamento?: FormaPagamento
  status: StatusPagamento
  dataPagamento?: string | null
  dataCadastro?: string
}

export type PagamentoRequestDTO = {
  matriculaId: number
  valor: number
  formaPagamento: FormaPagamento
}
