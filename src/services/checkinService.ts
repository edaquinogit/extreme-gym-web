import { httpClient } from './httpClient'
import type { Checkin } from '../types/checkin'

export type CheckinResponse = {
  id: number
  alunoId: number
  alunoNome: string
  matriculaId: number | null
  permitido: boolean
  motivo: string
  dataHora: string
}

export const checkinService = {
  listar: () => httpClient.get<Checkin[]>('/checkins'),
  registrar: (alunoId: number) =>
    httpClient.post<CheckinResponse>('/checkins', { alunoId }),
}
