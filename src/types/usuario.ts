export type RoleUsuario = 'ADMIN' | 'RECEPCAO' | 'PROFESSOR' | 'CATRACA'

export type Usuario = {
  id: number
  nome: string
  email: string
  username?: string
  role: RoleUsuario
  ativo: boolean
  criadoEm?: string
}

export type UsuarioCreateDTO = {
  nome: string
  email: string
  senha: string
  role: RoleUsuario
}
