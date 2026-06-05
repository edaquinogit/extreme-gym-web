import type { Plano, PlanoApiDTO } from '../types/plano'

export function mapPlanoFromApi(dto: PlanoApiDTO): Plano {
  return {
    id: dto.id,
    nome: dto.nome,
    descricao: dto.descricao ?? undefined,
    valor: dto.valorMensal,
    duracaoDias: dto.duracaoEmDias ?? undefined,
    status: dto.ativo ? 'ATIVO' : 'INATIVO',
  }
}
