import { httpClient } from './httpClient'
import type { Usuario, UsuarioCreateDTO } from '../types/usuario'

const PATH = '/usuarios'

export const usuarioService = {
  listar: () => httpClient.get<Usuario[]>(PATH),
  criar: (data: UsuarioCreateDTO) => httpClient.post<Usuario>(PATH, data),
  alterarAtivo: (id: number, ativo: boolean) =>
    httpClient.patch<Usuario>(`${PATH}/${id}/ativo`, { ativo }),
}
