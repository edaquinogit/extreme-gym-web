import { API_URL } from '../config/api'
import type { HttpRequestOptions } from '../types/http'

export class HttpError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(
    message: string,
    status: number,
    body: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.body = body
  }
}

async function request<TResponse>(
  path: string,
  options: HttpRequestOptions = {},
): Promise<TResponse> {
  const { body, headers, method = 'GET', ...fetchOptions } = options
  const requestHeaders = new Headers(headers)

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${normalizePath(path)}`, {
    ...fetchOptions,
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const responseBody = await parseResponseBody(response)

  if (!response.ok) {
    throw new HttpError(
      'Erro ao comunicar com a API.',
      response.status,
      responseBody,
    )
  }

  return responseBody as TResponse
}

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

async function parseResponseBody(response: Response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

export const httpClient = {
  get: <TResponse>(
    path: string,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>,
  ) => request<TResponse>(path, { ...options, method: 'GET' }),
  post: <TResponse>(
    path: string,
    body?: unknown,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>,
  ) => request<TResponse>(path, { ...options, method: 'POST', body }),
  put: <TResponse>(
    path: string,
    body?: unknown,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>,
  ) => request<TResponse>(path, { ...options, method: 'PUT', body }),
  delete: <TResponse>(
    path: string,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>,
  ) => request<TResponse>(path, { ...options, method: 'DELETE' }),
}
