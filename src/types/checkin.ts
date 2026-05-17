export type StatusCheckin = 'AUTORIZADO' | 'BLOQUEADO'

export type Checkin = {
  id: number
  alunoNome?: string
  aluno?: { id: number; nome: string }
  dataHora: string
  status: StatusCheckin
  motivoBloqueio?: string
}
