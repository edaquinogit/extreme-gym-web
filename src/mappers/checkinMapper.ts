import type { Checkin, CheckinApiDTO } from '../types/checkin'

export function mapCheckinFromApi(dto: CheckinApiDTO): Checkin {
  return {
    id: dto.id,
    alunoNome: dto.alunoNome ?? undefined,
    aluno: dto.aluno ?? undefined,
    dataHora: dto.dataHora,
    status: dto.permitido ? 'AUTORIZADO' : 'BLOQUEADO',
    motivoBloqueio: dto.permitido ? undefined : dto.motivo ?? undefined,
  }
}
