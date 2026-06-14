import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../hooks/useAuth'
import { AcessoPage } from '../../pages/Acesso/AcessoPage'
import { AlunosPage } from '../../pages/Alunos/AlunosPage'
import { AlunoPerfilPage } from '../../pages/Alunos/AlunoPerfilPage'
import { CatracaPage } from '../../pages/Catraca/CatracaPage'
import { CheckinsPage } from '../../pages/Checkins/CheckinsPage'
import { DashboardPage } from '../../pages/Dashboard/DashboardPage'
import { LoginPage } from '../../pages/Login/LoginPage'
import { MatriculasPage } from '../../pages/Matriculas/MatriculasPage'
import { PagamentosPage } from '../../pages/Pagamentos/PagamentosPage'
import { PlanosPage } from '../../pages/Planos/PlanosPage'
import { UsuariosPage } from '../../pages/Usuarios/UsuariosPage'
import { appPaths, privatePaths, type AppPath } from './paths'
import { useCurrentPath, useRedirect, matchPath } from './router'

export function AppRoutes() {
  const path = useCurrentPath()
  const { isAuthenticated, user } = useAuth()

  const alunoPerfilMatch = matchPath(appPaths.alunoPerfil, path)
  const isPrivatePath =
    privatePaths.includes(path as AppPath) || alunoPerfilMatch !== null

  useRedirect(!isAuthenticated && isPrivatePath, appPaths.login)
  useRedirect(isAuthenticated && path === appPaths.login, appPaths.dashboard)
  // Non-admins who land on /usuarios are redirected to dashboard
  useRedirect(isAuthenticated && path === appPaths.usuarios && user?.role !== 'ADMIN', appPaths.dashboard)

  if (!isAuthenticated && isPrivatePath) {
    return null
  }

  if (path === appPaths.login) {
    return <LoginPage />
  }

  if (path === appPaths.catraca) {
    return <CatracaPage />
  }

  return <AdminLayout>{renderPrivatePage(path, alunoPerfilMatch)}</AdminLayout>
}

function renderPrivatePage(
  path: string,
  alunoPerfilMatch: Record<string, string> | null,
) {
  if (alunoPerfilMatch) {
    const id = Number(alunoPerfilMatch['id'])
    return Number.isFinite(id) && id > 0
      ? <AlunoPerfilPage alunoId={id} />
      : <DashboardPage />
  }

  switch (path) {
    case appPaths.home:
    case appPaths.dashboard:
      return <DashboardPage />
    case appPaths.alunos:
      return <AlunosPage />
    case appPaths.planos:
      return <PlanosPage />
    case appPaths.matriculas:
      return <MatriculasPage />
    case appPaths.pagamentos:
      return <PagamentosPage />
    case appPaths.checkins:
      return <CheckinsPage />
    case appPaths.acessos:
      return <AcessoPage />
    case appPaths.usuarios:
      return <UsuariosPage />
    default:
      return <DashboardPage />
  }
}
