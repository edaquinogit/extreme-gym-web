export type TipoCredencial = 'FACE_TEMPLATE' | 'QR_CODE' | 'CARTAO' | 'PIN'
export type StatusCredencial = 'ATIVA' | 'INATIVA' | 'REVOGADA' | 'PENDENTE'

export type CredencialAcesso = {
  id: number
  alunoId: number
  tipo: TipoCredencial
  identificadorExterno: string
  fornecedor?: string
  status: StatusCredencial
  cadastradoEm?: string
  revogadoEm?: string
  termoAceitoEm?: string
  versaoTermo?: string
}

export type CredencialCreateDTO = {
  tipo: TipoCredencial
  identificadorExterno: string
  fornecedor?: string
}
