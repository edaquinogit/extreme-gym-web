import { useMemo, useState, type FormEvent } from 'react'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DataTable } from '../../components/tables/DataTable'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { TablePagination } from '../../components/tables/TablePagination'
import { useApiError } from '../../hooks/useApiError'
import { useAuth } from '../../hooks/useAuth'
import { useResourceList } from '../../hooks/useResourceList'
import { usuarioService } from '../../services/usuarioService'
import type { RoleUsuario, Usuario, UsuarioCreateDTO } from '../../types/usuario'
import { formatDate } from '../../utils/formatDate'

const PAGE_SIZE = 10

const ROLE_FILTERS: Array<RoleUsuario | 'TODOS'> = [
  'TODOS',
  'ADMIN',
  'RECEPCAO',
  'PROFESSOR',
  'CATRACA',
]

const ROLES_CRIACAO: RoleUsuario[] = ['ADMIN', 'RECEPCAO', 'PROFESSOR', 'CATRACA']

const ROLE_LABELS: Record<RoleUsuario, string> = {
  ADMIN: 'Administrador',
  RECEPCAO: 'Recepcao',
  PROFESSOR: 'Professor',
  CATRACA: 'Catraca',
}

type FormState = {
  nome: string
  email: string
  senha: string
  role: RoleUsuario | ''
}

const EMPTY_FORM: FormState = { nome: '', email: '', senha: '', role: '' }

export function UsuariosPage() {
  const { user: currentUser } = useAuth()
  const {
    data: usuarios,
    setData: setUsuarios,
    errorMessage,
    isLoading,
  } = useResourceList({ load: usuarioService.listar })
  const { getErrorMessage } = useApiError()

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleUsuario | 'TODOS'>('TODOS')
  const [page, setPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [togglingUsuario, setTogglingUsuario] = useState<Usuario | null>(null)
  const [isToggling, setIsToggling] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const currentUserId = currentUser?.id ?? currentUser?.usuarioId

  const filtered = useMemo(() => {
    const q = normalizeText(query)
    return usuarios.filter((u) => {
      const matchesRole = roleFilter === 'TODOS' || u.role === roleFilter
      const matchesQuery = q
        ? normalizeText([u.id, u.nome, u.email, u.username ?? '', u.role].join(' ')).includes(q)
        : true
      return matchesRole && matchesQuery
    })
  }, [usuarios, query, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function openCreateModal() {
    setFormData(EMPTY_FORM)
    setFormError(null)
    setActionMessage(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setFormError(null)
    setIsFormOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const nome = formData.nome.trim()
    const email = formData.email.trim()
    const senha = formData.senha

    if (!nome) { setFormError('Nome e obrigatorio.'); return }
    if (!email) { setFormError('Email e obrigatorio.'); return }
    if (!senha || senha.length < 12) { setFormError('Senha deve ter no minimo 12 caracteres.'); return }
    if (!formData.role) { setFormError('Selecione um perfil.'); return }

    const payload: UsuarioCreateDTO = { nome, email, senha, role: formData.role as RoleUsuario }

    try {
      setIsSaving(true)
      const criado = await usuarioService.criar(payload)
      setUsuarios((current) => [criado, ...current])
      setActionMessage(`Usuario "${criado.nome}" criado com sucesso.`)
      closeForm()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleAtivo() {
    if (!togglingUsuario) return
    const novoAtivo = !togglingUsuario.ativo

    try {
      setIsToggling(true)
      setActionMessage(null)
      const updated = await usuarioService.alterarAtivo(togglingUsuario.id, novoAtivo)
      setUsuarios((current) => current.map((u) => (u.id === updated.id ? updated : u)))
      setActionMessage(novoAtivo ? `${updated.nome} ativado.` : `${updated.nome} desativado.`)
      setTogglingUsuario(null)
    } catch (error) {
      setActionMessage(getErrorMessage(error))
      setTogglingUsuario(null)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Usuarios"
        title="Usuarios do sistema"
        description="Gerencie quem tem acesso ao painel administrativo."
        action={
          <button className="primary-button compact" type="button" onClick={openCreateModal}>
            Novo usuario
          </button>
        }
      />

      <div className="toolbar">
        <input
          aria-label="Buscar usuario"
          placeholder="Buscar por nome, email ou ID"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
        />
        <select
          aria-label="Filtrar por perfil"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as RoleUsuario | 'TODOS'); setPage(1) }}
        >
          {ROLE_FILTERS.map((r) => (
            <option key={r} value={r}>
              {r === 'TODOS' ? 'Todos os perfis' : ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <span>{filtered.length} usuario(s)</span>
      </div>

      {actionMessage && (
        <div className="alert alert--success page-toast" role="status">
          {actionMessage}
        </div>
      )}

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando usuarios..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os usuarios" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && usuarios.length === 0 && (
          <StateMessage title="Nenhum usuario encontrado" description="Crie o primeiro usuario do sistema." />
        )}
        {!isLoading && !errorMessage && usuarios.length > 0 && filtered.length === 0 && (
          <StateMessage title="Nenhum usuario corresponde aos filtros" description="Ajuste a busca ou o filtro de perfil." />
        )}
        {!isLoading && !errorMessage && filtered.length > 0 && (
          <>
            <DataTable headers={['ID', 'Nome', 'Email', 'Perfil', 'Status', 'Criado em', 'Acoes']}>
              {visible.map((u) => {
                const isSelf = currentUserId !== undefined && Number(currentUserId) === u.id
                return (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>
                      {u.nome}
                      {isSelf && <span className="badge-self"> (voce)</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <StatusBadge status={u.role} />
                    </td>
                    <td>
                      <StatusBadge status={u.ativo ? 'ATIVO' : 'INATIVO'} />
                    </td>
                    <td>{formatDate(u.criadoEm)}</td>
                    <td>
                      {!isSelf && (
                        <button
                          className={u.ativo ? 'btn-danger btn-sm' : 'ghost-button btn-sm'}
                          type="button"
                          onClick={() => setTogglingUsuario(u)}
                        >
                          {u.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </DataTable>
            <TablePagination
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={filtered.length}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <Modal isOpen={isFormOpen} title="Novo usuario" onClose={closeForm}>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <FormField label="Nome completo">
            <input
              className="form-control"
              value={formData.nome}
              autoComplete="off"
              onChange={(e) => setFormData((f) => ({ ...f, nome: e.target.value }))}
            />
          </FormField>
          <FormField label="Email">
            <input
              className="form-control"
              type="email"
              value={formData.email}
              autoComplete="off"
              onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
            />
          </FormField>
          <FormField label="Senha (min. 12 caracteres)">
            <input
              className="form-control"
              type="password"
              value={formData.senha}
              autoComplete="new-password"
              onChange={(e) => setFormData((f) => ({ ...f, senha: e.target.value }))}
            />
          </FormField>
          <FormField label="Perfil de acesso">
            <select
              className="form-control"
              value={formData.role}
              onChange={(e) => setFormData((f) => ({ ...f, role: e.target.value as RoleUsuario }))}
            >
              <option value="">Selecione um perfil...</option>
              {ROLES_CRIACAO.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </FormField>

          {formError && <p className="form-error">{formError}</p>}

          <div className="form-actions">
            <button className="ghost-button" type="button" disabled={isSaving} onClick={closeForm}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Criando...' : 'Criar usuario'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(togglingUsuario)}
        title={togglingUsuario?.ativo ? 'Desativar usuario' : 'Ativar usuario'}
        description={
          togglingUsuario?.ativo
            ? `Desativar "${togglingUsuario?.nome}"? O usuario nao conseguira mais acessar o sistema.`
            : `Reativar "${togglingUsuario?.nome}"? O usuario voltara a ter acesso ao sistema.`
        }
        confirmLabel={togglingUsuario?.ativo ? 'Desativar' : 'Ativar'}
        isLoading={isToggling}
        onCancel={() => setTogglingUsuario(null)}
        onConfirm={() => void handleToggleAtivo()}
      />
    </>
  )
}

function normalizeText(value: string | number) {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}
