export type Plano = {
  id: number
  nome: string
  descricao?: string
  valorMensal: number
  duracaoEmDias?: number
  ativo: boolean
  dataCadastro?: string
}

export type PlanoRequestDTO = {
  nome: string
  descricao?: string
  valorMensal: number
  duracaoEmDias: number
}
