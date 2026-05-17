import { httpClient } from './httpClient'
import type { Pagamento } from '../types/pagamento'

export const pagamentoService = {
  listar: () => httpClient.get<Pagamento[]>('/pagamentos'),
}
