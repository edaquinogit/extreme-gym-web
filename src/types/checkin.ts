export type Checkin = {
  id: number
  alunoId?: number
  alunoNome?: string
  matriculaId?: number | null
  permitido: boolean
  motivo?: string
  dataHora: string
}
