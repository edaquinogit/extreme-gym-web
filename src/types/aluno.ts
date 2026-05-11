export type StatusAluno = 'ATIVO' | 'INADIMPLENTE' | 'BLOQUEADO' | 'CANCELADO'

export type Aluno = {
  id: number
  nome: string
  email: string
  telefone: string
  status: StatusAluno
  dataCadastro: string
}
