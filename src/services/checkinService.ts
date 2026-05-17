import { httpClient } from './httpClient'
import type { Checkin } from '../types/checkin'

export const checkinService = {
  listar: () => httpClient.get<Checkin[]>('/checkins'),
}
