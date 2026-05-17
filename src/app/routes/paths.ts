export const appPaths = {
  login: '/login',
  home: '/',
  dashboard: '/dashboard',
  alunos: '/alunos',
  planos: '/planos',
  matriculas: '/matriculas',
  pagamentos: '/pagamentos',
  checkins: '/checkins',
} as const

export type AppPath = (typeof appPaths)[keyof typeof appPaths]

export const privatePaths: AppPath[] = [
  appPaths.home,
  appPaths.dashboard,
  appPaths.alunos,
  appPaths.planos,
  appPaths.matriculas,
  appPaths.pagamentos,
  appPaths.checkins,
]
