import { httpClient } from './httpClient'
import { mapPlanoFromApi } from '../mappers/planoMapper'
import type { Plano, PlanoApiDTO } from '../types/plano'

export const planoService = {
  listar: async (): Promise<Plano[]> => {
    const planos = await httpClient.get<PlanoApiDTO[]>('/planos')
    return planos.map(mapPlanoFromApi)
  },
}
