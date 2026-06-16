import { httpClient } from './httpClient'
import type { Matricula, MatriculaRequestDTO } from '../types/matricula'

export const matriculaService = {
  listar: () => httpClient.get<Matricula[]>('/matriculas'),
  listarPorAluno: (alunoId: number) => httpClient.get<Matricula[]>(`/matriculas/aluno/${alunoId}`),
  criar: (data: MatriculaRequestDTO) => httpClient.post<Matricula>('/matriculas', data),
  cancelar: (id: number) => httpClient.patch<Matricula>(`/matriculas/${id}/cancelar`, {}),
  reativar: (id: number) => httpClient.patch<Matricula>(`/matriculas/${id}/reativar`, {}),
}
