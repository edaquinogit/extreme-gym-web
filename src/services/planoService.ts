import { httpClient } from './httpClient'
import type { Plano, PlanoRequestDTO } from '../types/plano'

export const planoService = {
  listar: () => httpClient.get<Plano[]>('/planos'),
  criar: (data: PlanoRequestDTO) => httpClient.post<Plano>('/planos', data),
  atualizar: (id: number, data: PlanoRequestDTO) =>
    httpClient.put<Plano>(`/planos/${id}`, data),
  remover: (id: number) => httpClient.delete<void>(`/planos/${id}`),
}
