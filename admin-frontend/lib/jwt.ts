// Decodifica o payload de um JWT sem verificar assinatura (apenas leitura no cliente).

export interface JwtPayload {
  sub: string
  email: string
  name?: string
  phone?: string
  serviceId: string
  roles: number[]
  iat: number
  exp: number
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1]
    if (!part) return null
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function isExpired(payload: JwtPayload | null): boolean {
  if (!payload) return true
  return payload.exp * 1000 < Date.now()
}
