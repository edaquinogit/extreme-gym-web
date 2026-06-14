import { httpClient } from './httpClient'
import type { CredencialAcesso, CredencialCreateDTO } from '../types/credencial'

export const credencialService = {
  listarPorAluno: (alunoId: number) =>
    httpClient.get<CredencialAcesso[]>(`/alunos/${alunoId}/credenciais-acesso`),

  criar: (alunoId: number, data: CredencialCreateDTO) =>
    httpClient.post<CredencialAcesso>(`/alunos/${alunoId}/credenciais-acesso`, data),

  revogar: (id: number) =>
    httpClient.patch<CredencialAcesso>(`/credenciais-acesso/${id}/revogar`, {}),
}
