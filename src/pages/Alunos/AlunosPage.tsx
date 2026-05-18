import { useState } from 'react'
import { DataTable } from '../../components/tables/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { StatusDropdown } from '../../components/ui/StatusDropdown'
import { useApiError } from '../../hooks/useApiError'
import { useResourceList } from '../../hooks/useResourceList'
import { alunoService } from '../../services/alunoService'
import type { Aluno, StatusAluno } from '../../types/aluno'
import { formatDate } from '../../utils/formatDate'

export function AlunosPage() {
  const { data: alunos, errorMessage, isLoading } = useResourceList({
    load: alunoService.listar,
  })
  const { getErrorMessage } = useApiError()
  const [statusOverrides, setStatusOverrides] = useState<Record<number, StatusAluno>>({})
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  async function alterarStatusAluno(aluno: Aluno, status: StatusAluno) {
    try {
      setStatusUpdatingId(aluno.id)
      setStatusError(null)
      const alunoAtualizado = await alunoService.alterarStatus(aluno.id, status)

      setStatusOverrides((current) => ({
        ...current,
        [alunoAtualizado.id]: alunoAtualizado.status,
      }))
    } catch (error) {
      setStatusError(getErrorMessage(error))
    } finally {
      setStatusUpdatingId(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Alunos"
        title="Alunos cadastrados"
        description="Gerencie dados de contato e status operacional dos alunos."
        action={<button className="primary-button compact" type="button">Novo aluno</button>}
      />

      <div className="toolbar">
        <input aria-label="Buscar aluno" placeholder="Buscar por nome, email ou telefone" />
      </div>

      {statusError && (
        <div className="alert alert--error page-toast" role="alert">
          {statusError}
        </div>
      )}

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando alunos..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar os alunos" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && alunos.length === 0 && (
          <StateMessage
            title="Nenhum aluno encontrado"
            description="Quando houver alunos cadastrados na API, eles aparecerao aqui."
          />
        )}
        {!isLoading && !errorMessage && alunos.length > 0 && (
          <DataTable headers={['ID', 'Nome', 'Email', 'Telefone', 'Status', 'Cadastro']}>
            {alunos.map((aluno) => {
              const currentStatus = statusOverrides[aluno.id] ?? aluno.status

              return (
                <tr key={aluno.id}>
                  <td>{aluno.id}</td>
                  <td>{aluno.nome}</td>
                  <td>{aluno.email}</td>
                  <td>{aluno.telefone}</td>
                  <td>
                    <StatusDropdown
                      status={currentStatus}
                      isLoading={statusUpdatingId === aluno.id}
                      onChange={(status) => void alterarStatusAluno(aluno, status)}
                    />
                  </td>
                  <td>{formatDate(aluno.dataCadastro)}</td>
                </tr>
              )
            })}
          </DataTable>
        )}
      </section>
    </>
  )
}
