export type StatusMatricula = 'ATIVA' | 'PENDENTE' | 'CANCELADA' | 'EXPIRADA'

export type Matricula = {
  id: number
  alunoNome?: string
  aluno?: { id: number; nome: string }
  planoNome?: string
  plano?: { id: number; nome: string }
  status: StatusMatricula
  dataInicio?: string
  dataVencimento?: string
}
