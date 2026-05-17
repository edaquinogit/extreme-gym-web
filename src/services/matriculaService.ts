import { httpClient } from './httpClient'
import type { Matricula } from '../types/matricula'

export const matriculaService = {
  listar: () => httpClient.get<Matricula[]>('/matriculas'),
}
