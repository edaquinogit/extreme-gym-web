import { DataTable } from '../../components/tables/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { StateMessage } from '../../components/ui/StateMessage'
import { useResourceList } from '../../hooks/useResourceList'
import { matriculaService } from '../../services/matriculaService'
import type { Matricula } from '../../types/matricula'
import { formatDate } from '../../utils/formatDate'

export function MatriculasPage() {
  const { data: matriculas, errorMessage, isLoading } = useResourceList({
    load: matriculaService.listar,
  })

  return (
    <>
      <PageHeader
        eyebrow="Matriculas"
        title="Matriculas ativas e historico"
        description="Visao inicial para relacionar aluno, plano, vencimento e status da matricula."
        action={<button className="primary-button compact" type="button">Nova matricula</button>}
      />

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando matriculas..." />}
        {!isLoading && errorMessage && (
          <StateMessage title="Nao foi possivel carregar as matriculas" description={errorMessage} />
        )}
        {!isLoading && !errorMessage && matriculas.length === 0 && (
          <StateMessage title="Nenhuma matricula encontrada" description="As matriculas retornadas pela API aparecerao nesta tabela." />
        )}
        {!isLoading && !errorMessage && matriculas.length > 0 && (
          <DataTable headers={['ID', 'Aluno', 'Plano', 'Status', 'Inicio', 'Vencimento']}>
            {matriculas.map((matricula) => (
              <tr key={matricula.id}>
                <td>{matricula.id}</td>
                <td>{getAlunoNome(matricula)}</td>
                <td>{matricula.planoNome ?? matricula.plano?.nome ?? '-'}</td>
                <td><span className="status-badge">{matricula.status}</span></td>
                <td>{formatDate(matricula.dataInicio)}</td>
                <td>{formatDate(matricula.dataVencimento)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>
    </>
  )
}

function getAlunoNome(matricula: Matricula) {
  return matricula.alunoNome ?? matricula.aluno?.nome ?? '-'
}
