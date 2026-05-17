import { useState, type FormEvent } from 'react'
import { appPaths } from '../../app/routes/paths'
import { navigateTo } from '../../app/routes/router'
import { ApiStatus } from '../../components/ApiStatus'
import { useAuth } from '../../hooks/useAuth'
import { HttpError } from '../../services/httpClient'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { isLoading, login } = useAuth()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    const normalizedUsername = username.trim()

    if (!normalizedUsername) {
      setErrorMessage('Informe seu email ou usuario.')
      return
    }

    try {
      await login({ username: normalizedUsername, password })
      navigateTo(appPaths.dashboard)
    } catch (error) {
      setErrorMessage(getLoginError(error))
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-copy">
          <p className="eyebrow">Extreme Gym Web</p>
          <h1>Gestao da academia em um painel administrativo.</h1>
          <p className="page-description">
            Acesse com uma conta da Extreme Gym API para gerenciar alunos,
            planos, matriculas, pagamentos e check-ins.
          </p>
          <ApiStatus />
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">Email ou usuario</label>
            <input
              autoComplete="username"
              id="username"
              name="username"
              required
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password">Senha</label>
            <input
              autoComplete="current-password"
              id="password"
              name="password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button className="primary-button" disabled={isLoading} type="submit">
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

function getLoginError(error: unknown) {
  if (error instanceof HttpError && error.status === 401) {
    return 'Email/usuario ou senha invalidos.'
  }

  if (error instanceof HttpError && error.status >= 500) {
    return 'A API esta indisponivel no momento. Tente novamente em instantes.'
  }

  if (error instanceof Error) {
    return error.message || 'Nao foi possivel autenticar.'
  }

  return 'Nao foi possivel autenticar.'
}
