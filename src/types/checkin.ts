export type StatusCheckin = 'AUTORIZADO' | 'BLOQUEADO'

export type CheckinApiDTO = {
  id: number
  alunoId: number
  alunoNome?: string | null
  aluno?: { id: number; nome: string } | null
  matriculaId?: number | null
  permitido: boolean
  motivo: string
  dataHora: string
}

export type Checkin = {
  id: number
  alunoNome?: string
  aluno?: { id: number; nome: string }
  dataHora: string
  status: StatusCheckin
  motivoBloqueio?: string
}
