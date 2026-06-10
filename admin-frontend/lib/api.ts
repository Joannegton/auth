// Cliente HTTP para o microsserviço de autenticação NestJS.
// A URL base vem de NEXT_PUBLIC_AUTH_API_URL (ex: http://localhost:5000).

export const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000"

export interface ApiError {
  message: string
  statusCode: number
  code?: string
}

export class AuthApiError extends Error {
  statusCode: number
  code?: string
  constructor(error: ApiError) {
    super(error.message)
    this.name = "AuthApiError"
    this.statusCode = error.statusCode
    this.code = error.code
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  token?: string | null
}

// O backend responde { data: ... } em sucesso e { error: { message, statusCode, code } } em erro.
export async function apiRequest<T = unknown>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {},
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${AUTH_API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new AuthApiError({
      message: `Não foi possível conectar ao serviço de autenticação em ${AUTH_API_URL}. Verifique se o backend está em execução e se NEXT_PUBLIC_AUTH_API_URL está configurado.`,
      statusCode: 0,
      code: "NETWORK_ERROR",
    })
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T
  }

  let payload: unknown = null
  const text = await res.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!res.ok) {
    const errObj =
      (payload as { error?: ApiError; message?: string })?.error ??
      ({
        message:
          (payload as { message?: string })?.message ||
          `Erro ${res.status}`,
        statusCode: res.status,
      } as ApiError)
    throw new AuthApiError(errObj)
  }

  const data = (payload as { data?: T })?.data
  return (data !== undefined ? data : (payload as T)) as T
}

// ---- Tipos de payloads ----

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface CreateServiceResponse {
  id: string
  name: string
  apiKey: string
  createdAt: string
}

export interface LoginInput {
  email: string
  password: string
  serviceId: string
}

export interface CreateUserInput {
  email: string
  password: string
  name?: string
  phone?: string
  roleIdNum?: number
  serviceId: string
}

// ---- Endpoints ----

export const authApi = {
  login: (input: LoginInput) =>
    apiRequest<AuthTokens>("/auth/login", { method: "POST", body: input }),

  refresh: (refreshToken: string) =>
    apiRequest<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    }),

  logout: (token: string) =>
    apiRequest<unknown>("/auth/logout", { method: "POST", token }),

  forgotPassword: (email: string, serviceId: string) =>
    apiRequest<unknown>("/auth/forgot-password", {
      method: "POST",
      body: { email, serviceId },
    }),

  resetPassword: (input: {
    email: string
    serviceId: string
    code: string
    newPassword: string
  }) =>
    apiRequest<unknown>("/auth/reset-password", {
      method: "POST",
      body: input,
    }),

  // Cria usuário (registro). Quando autenticado, o backend usa o token para definir o criador.
  register: (input: CreateUserInput, token?: string | null) =>
    apiRequest<unknown>("/auth/register", {
      method: "POST",
      body: input,
      token,
    }),

  // Cria worker/usuário escopado a um serviço (OWNER/ADMIN/MODERATOR).
  createServiceUser: (
    input: { email: string; password: string; roleIdNum?: number; serviceId: string },
    token: string,
  ) =>
    apiRequest<unknown>("/services/users", {
      method: "POST",
      body: input,
      token,
    }),

  // Cria um novo serviço (tenant). Requer ADMIN.
  createService: (name: string, token: string) =>
    apiRequest<CreateServiceResponse>("/services", {
      method: "POST",
      body: { name },
      token,
    }),

  getPublicKey: () => apiRequest<{ publicKey: string }>("/auth/public-key"),
}
