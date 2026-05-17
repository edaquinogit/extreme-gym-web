import { httpClient } from './httpClient'
import type { Aluno } from '../types/aluno'

const ALUNOS_PATH = '/alunos'

export const alunoService = {
  listar: () => httpClient.get<Aluno[]>(ALUNOS_PATH),
}
