import { httpClient } from './httpClient'
import type { Aluno, AlunoRequestDTO, StatusAluno } from '../types/aluno'

const ALUNOS_PATH = '/alunos'

export const alunoService = {
  listar: () => httpClient.get<Aluno[]>(ALUNOS_PATH),
  buscar: (id: number) => httpClient.get<Aluno>(`${ALUNOS_PATH}/${id}`),
  cadastrar: (data: AlunoRequestDTO) => httpClient.post<Aluno>(ALUNOS_PATH, data),
  atualizar: (id: number, data: AlunoRequestDTO) =>
    httpClient.put<Aluno>(`${ALUNOS_PATH}/${id}`, data),
  alterarStatus: (id: number, status: StatusAluno) =>
    httpClient.patch<Aluno>(`${ALUNOS_PATH}/${id}/status`, { status }),
  remover: (id: number) => httpClient.delete<void>(`${ALUNOS_PATH}/${id}`),
  inativar: (id: number) => httpClient.delete<void>(`${ALUNOS_PATH}/${id}`),
}
