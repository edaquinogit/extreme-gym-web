export const appPaths = {
  login: '/login',
  home: '/',
  dashboard: '/dashboard',
  alunos: '/alunos',
  alunoPerfil: '/alunos/:id',
  planos: '/planos',
  matriculas: '/matriculas',
  pagamentos: '/pagamentos',
  checkins: '/checkins',
  acessos: '/acessos',
  catraca: '/catraca',
  usuarios: '/usuarios',
} as const

export type AppPath = (typeof appPaths)[keyof typeof appPaths]

export const privatePaths: AppPath[] = [
  appPaths.home,
  appPaths.dashboard,
  appPaths.alunos,
  appPaths.alunoPerfil,
  appPaths.planos,
  appPaths.matriculas,
  appPaths.pagamentos,
  appPaths.checkins,
  appPaths.acessos,
  appPaths.catraca,
  appPaths.usuarios,
]

export function buildAlunoPerfil(id: number) {
  return `/alunos/${id}`
}
