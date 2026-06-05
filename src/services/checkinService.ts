import { httpClient } from './httpClient'
import { mapCheckinFromApi } from '../mappers/checkinMapper'
import type { Checkin, CheckinApiDTO } from '../types/checkin'

export type CheckinResponse = CheckinApiDTO

export const checkinService = {
  listar: async (): Promise<Checkin[]> => {
    const checkins = await httpClient.get<CheckinApiDTO[]>('/checkins')
    return checkins.map(mapCheckinFromApi)
  },
  registrar: (alunoId: number) =>
    httpClient.post<CheckinResponse>('/checkins', { alunoId }),
}
