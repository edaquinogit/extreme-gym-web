import { httpClient } from './httpClient'
import type { AuthUser, LoginCredentials, LoginResponse } from '../types/auth'

const LOGIN_PATH = '/auth/login'

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await httpClient.post<LoginResponse>(
      LOGIN_PATH,
      {
        username: credentials.username.trim(),
        password: credentials.password,
      },
      {
        skipAuth: true,
      },
    )
    const token = response.token ?? response.accessToken ?? response.jwt

    if (!token) {
      throw new Error('Resposta de login sem token JWT.')
    }

    return {
      token,
      user: normalizeUser(response),
    }
  },
}

function normalizeUser(response: LoginResponse): AuthUser {
  return response.user ?? response.usuario ?? {
    id: response.usuarioId,
    usuarioId: response.usuarioId,
    nome: response.nome,
    username: response.username,
    email: response.email,
    role: response.role,
    roles: response.role ? [response.role] : undefined,
  }
}
