import { httpClient } from './httpClient'
import type { Pagamento, PagamentoRequestDTO } from '../types/pagamento'

export const pagamentoService = {
  listar: () => httpClient.get<Pagamento[]>('/pagamentos'),
  registrar: (data: PagamentoRequestDTO) => httpClient.post<Pagamento>('/pagamentos', data),
  cancelar: (id: number) => httpClient.patch<Pagamento>(`/pagamentos/${id}/cancelar`, {}),
}
