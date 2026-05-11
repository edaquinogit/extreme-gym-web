import { useEffect, useState } from 'react'
import { alunosService } from '../services/alunosService'
import type { Aluno } from '../types/aluno'

type AlunosPageProps = {
  onBack: () => void
}

export function AlunosPage({ onBack }: AlunosPageProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function carregarAlunos() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const alunosResponse = await alunosService.listar()

        if (isMounted) {
          setAlunos(alunosResponse)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void carregarAlunos()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Alunos</p>
          <h1>Listagem de alunos</h1>
          <p className="page-description">
            Dados carregados diretamente da Extreme Gym API.
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={onBack}>
          Voltar
        </button>
      </section>

      <section className="content-panel">
        {isLoading && <StateMessage title="Carregando alunos..." />}

        {!isLoading && errorMessage && (
          <StateMessage
            title="Nao foi possivel carregar os alunos"
            description={errorMessage}
          />
        )}

        {!isLoading && !errorMessage && alunos.length === 0 && (
          <StateMessage
            title="Nenhum aluno encontrado"
            description="Quando houver alunos cadastrados na API, eles aparecerao aqui."
          />
        )}

        {!isLoading && !errorMessage && alunos.length > 0 && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((aluno) => (
                  <tr key={aluno.id}>
                    <td>{aluno.id}</td>
                    <td>{aluno.nome}</td>
                    <td>{aluno.email}</td>
                    <td>{aluno.telefone}</td>
                    <td>
                      <span className="status-badge">{aluno.status}</span>
                    </td>
                    <td>{formatDate(aluno.dataCadastro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

type StateMessageProps = {
  title: string
  description?: string
}

function StateMessage({ title, description }: StateMessageProps) {
  return (
    <div className="state-message">
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Ocorreu um erro inesperado ao buscar os alunos.'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
