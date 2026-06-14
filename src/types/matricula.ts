export type StatusMatricula = 'ATIVA' | 'VENCIDA' | 'CANCELADA'

export type Matricula = {
  id: number
  alunoId?: number
  alunoNome?: string
  planoId?: number
  planoNome?: string
  status: StatusMatricula
  dataInicio?: string
  dataFim?: string
  dataCadastro?: string
}

export type MatriculaRequestDTO = {
  alunoId: number
  planoId: number
  dataInicio: string
}
