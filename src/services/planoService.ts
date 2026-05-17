import { httpClient } from './httpClient'
import type { Plano } from '../types/plano'

export const planoService = {
  listar: () => httpClient.get<Plano[]>('/planos'),
}
