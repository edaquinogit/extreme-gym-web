const AUTH_TOKEN_KEY = 'extreme_gym_auth_token'
const AUTH_USER_KEY = 'extreme_gym_auth_user'

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setStoredToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function removeStoredToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function getStoredUser<TUser>() {
  const rawUser = localStorage.getItem(AUTH_USER_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as TUser
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

export function setStoredUser(user: unknown) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function removeStoredUser() {
  localStorage.removeItem(AUTH_USER_KEY)
}

export function clearAuthStorage() {
  removeStoredToken()
  removeStoredUser()
}
