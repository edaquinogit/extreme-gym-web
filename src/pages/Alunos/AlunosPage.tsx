import { DataTable } from '../../components/tables/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { useResourceList } from '../../hooks/useResourceList'
import { alunoService } from '../../services/alunoService'
import { formatDate } from '../../utils/formatDate'

export function AlunosPage() {
  const { data: alunos, errorMessage, isLoading } = useResourceList({
    load: alunoService.listar,
  })

  return (
    <>
      <PageHeader
        eyebrow="Alunos"
        title="Alunos cadastrados"
        description="Lista preparada para busca, estados de carregamento e integracao direta com /alunos."
        action={<button className="primary-button compact" type="button">Novo aluno</button>}
      />

      <div className="toolbar">
        <input aria-label="Buscar aluno" placeholder="Buscar por nome, email ou telefone" />
      </div>

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
            {alunos.map((aluno) => (
              <tr key={aluno.id}>
                <td>{aluno.id}</td>
                <td>{aluno.nome}</td>
                <td>{aluno.email}</td>
                <td>{aluno.telefone}</td>
                <td><span className="status-badge">{aluno.status}</span></td>
                <td>{formatDate(aluno.dataCadastro)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>
    </>
  )
}
