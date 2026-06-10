"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { authApi, AuthApiError } from "./api"
import { decodeJwt, isExpired, type JwtPayload } from "./jwt"

const STORAGE_KEY = "auth_admin_session"

interface Session {
  accessToken: string
  refreshToken: string
}

interface AuthContextValue {
  user: JwtPayload | null
  accessToken: string | null
  loading: boolean
  login: (accessToken: string, refreshToken: string) => void
  logout: () => Promise<void>
  getValidToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadSession(): Session | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function saveSession(session: Session | null) {
  if (typeof window === "undefined") return
  if (session) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<JwtPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshing = useRef<Promise<string | null> | null>(null)

  useEffect(() => {
    const s = loadSession()
    if (s) {
      setSession(s)
      setUser(decodeJwt(s.accessToken))
    }
    setLoading(false)
  }, [])

  const applySession = useCallback((s: Session | null) => {
    setSession(s)
    setUser(s ? decodeJwt(s.accessToken) : null)
    saveSession(s)
  }, [])

  const login = useCallback(
    (accessToken: string, refreshToken: string) => {
      applySession({ accessToken, refreshToken })
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    if (session?.accessToken) {
      try {
        await authApi.logout(session.accessToken)
      } catch {
        // ignora erros de logout no servidor
      }
    }
    applySession(null)
    router.push("/login")
  }, [session, applySession, router])

  // Retorna um access token válido, renovando via refresh token se necessário.
  const getValidToken = useCallback(async (): Promise<string | null> => {
    const current = loadSession()
    if (!current) return null

    const payload = decodeJwt(current.accessToken)
    if (payload && !isExpired(payload)) {
      return current.accessToken
    }

    // evita múltiplos refreshes simultâneos
    if (refreshing.current) return refreshing.current

    refreshing.current = (async () => {
      try {
        const tokens = await authApi.refresh(current.refreshToken)
        applySession({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
        return tokens.accessToken
      } catch (err) {
        if (err instanceof AuthApiError && err.statusCode !== 0) {
          applySession(null)
        }
        return null
      } finally {
        refreshing.current = null
      }
    })()

    return refreshing.current
  }, [applySession])

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: session?.accessToken ?? null,
        loading,
        login,
        logout,
        getValidToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}
