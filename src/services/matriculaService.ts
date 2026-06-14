import { httpClient } from './httpClient'
import type { Matricula, MatriculaRequestDTO } from '../types/matricula'

export const matriculaService = {
  listar: () => httpClient.get<Matricula[]>('/matriculas'),
  criar: (data: MatriculaRequestDTO) => httpClient.post<Matricula>('/matriculas', data),
  cancelar: (id: number) => httpClient.patch<Matricula>(`/matriculas/${id}/cancelar`, {}),
}
