import { httpClient } from './httpClient'
import type { Checkin } from '../types/checkin'

export const checkinService = {
  listar: () => httpClient.get<Checkin[]>('/checkins'),
  listarPorAluno: (alunoId: number) => httpClient.get<Checkin[]>(`/checkins/aluno/${alunoId}`),
  registrar: (alunoId: number) =>
    httpClient.post<Checkin>('/checkins', { alunoId }),
}
