import { httpClient } from './httpClient'
import type {
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
} from '../types/auth'

const LOGIN_PATH = '/auth/login'
const REGISTER_PATH = '/auth/register'

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

  async register(credentials: RegisterCredentials) {
    const response = await httpClient.post<LoginResponse>(
      REGISTER_PATH,
      {
        nome: credentials.nome.trim(),
        email: credentials.email.trim(),
        senha: credentials.senha,
        role: credentials.role ?? 'ADMIN',
      },
      {
        skipAuth: true,
      },
    )
    const token = response.token ?? response.accessToken ?? response.jwt

    if (!token) {
      throw new Error('Resposta de cadastro sem token JWT.')
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
