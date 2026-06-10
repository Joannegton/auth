"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authApi, AuthApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { decodeJwt } from "@/lib/jwt"
import { MANAGEMENT_ROLES, ROLE_NAMES } from "@/lib/roles"
import { getKnownServices, type KnownService } from "@/lib/services-store"
import { useToast } from "@/components/ui/toast"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { ShieldCheck, KeyRound, Users, Layers, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, user, loading } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [knownServices, setKnownServices] = useState<KnownService[]>([])

  useEffect(() => {
    setKnownServices(getKnownServices())
  }, [])

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard")
    }
  }, [loading, user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const tokens = await authApi.login({ email, password, serviceId })
      const payload = decodeJwt(tokens.accessToken)

      const hasManagementRole = payload?.roles?.some((r) =>
        MANAGEMENT_ROLES.includes(r),
      )
      if (!hasManagementRole) {
        setError(
          "Sua conta não tem permissão de gestão (Proprietário, Administrador ou Moderador) neste serviço.",
        )
        setSubmitting(false)
        return
      }

      login(tokens.accessToken, tokens.refreshToken)
      toast({ type: "success", title: "Bem-vindo de volta" })
      router.replace("/dashboard")
    } catch (err) {
      const message =
        err instanceof AuthApiError ? err.message : "Erro ao fazer login"
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      {/* Formulário */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-8" />
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Acesse o painel de gestão
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com suas credenciais administrativas para gerenciar serviços,
            usuários e papéis.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Esqueci a senha
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="serviceId">ID do Serviço</Label>
              <Input
                id="serviceId"
                placeholder="550e8400-e29b-41d4-a716-446655440000"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                required
                className="font-mono text-xs"
              />
              {knownServices.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {knownServices.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setServiceId(s.id)}
                      className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-accent"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" loading={submitting} className="mt-2 w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground">
            Acesso restrito a {ROLE_NAMES[1]}, {ROLE_NAMES[2]} e {ROLE_NAMES[3]}.
          </p>
        </div>
      </div>

      {/* Painel de marca */}
      <aside className="relative hidden flex-1 overflow-hidden border-l border-border bg-card lg:block">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div className="max-w-md">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              Identidade e acesso para seus serviços
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Um provedor de identidade multi-tenant com RBAC, tokens JWT
              assinados com RS256 e gestão centralizada de usuários e workers.
            </p>
            <ul className="mt-8 flex flex-col gap-4">
              <FeatureItem
                icon={<Layers className="h-5 w-5 text-primary" />}
                title="Multi-tenant"
                desc="Cada serviço é isolado por serviceId."
              />
              <FeatureItem
                icon={<Users className="h-5 w-5 text-primary" />}
                title="RBAC hierárquico"
                desc="Owners, admins, moderadores e workers."
              />
              <FeatureItem
                icon={<KeyRound className="h-5 w-5 text-primary" />}
                title="JWT RS256"
                desc="Tokens verificáveis por chave pública."
              />
              <FeatureItem
                icon={<ShieldCheck className="h-5 w-5 text-primary" />}
                title="Sessões seguras"
                desc="Refresh tokens e auditoria de login."
              />
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            Auth Service • API NestJS
          </p>
        </div>
      </aside>
    </main>
  )
}

function FeatureItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </li>
  )
}
