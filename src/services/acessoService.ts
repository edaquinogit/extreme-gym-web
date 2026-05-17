import { httpClient } from './httpClient'
import type { AcessoResponse } from '../types/acesso'

export const acessoService = {
  validar: (alunoId: number) =>
    httpClient.post<AcessoResponse>('/acessos/validar', { alunoId }),
}
