export type StatusPlano = 'ATIVO' | 'INATIVO'

export type PlanoApiDTO = {
  id: number
  nome: string
  descricao?: string | null
  valorMensal: number
  duracaoEmDias?: number | null
  ativo: boolean
}

export type Plano = {
  id: number
  nome: string
  descricao?: string
  valor: number
  duracaoDias?: number
  status: StatusPlano
}
