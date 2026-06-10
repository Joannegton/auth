"use client"

import { useState, useEffect } from "react"
import { authApi, AuthApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { PasswordInput } from "@/components/ui/password-input"
import {
  assignableRoles,
  ROLE_NAMES,
  Role,
} from "@/lib/roles"
import { checkPassword, isStrongPassword } from "@/lib/password"
import { getKnownServices, type KnownService } from "@/lib/services-store"
import { addCreatedUser } from "@/lib/users-store"
import { Check, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function CreateUserForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user, getValidToken } = useAuth()
  const { toast } = useToast()

  const allowed = assignableRoles(user?.roles ?? [])
  const defaultServiceId = user?.serviceId ?? ""

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [roleIdNum, setRoleIdNum] = useState<number>(allowed[0] ?? Role.WORKER)
  const [serviceId, setServiceId] = useState(defaultServiceId)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [knownServices, setKnownServices] = useState<KnownService[]>([])

  useEffect(() => {
    setKnownServices(getKnownServices())
  }, [])

  const pwChecks = checkPassword(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isStrongPassword(password)) {
      setError(
        "A senha deve ter ao menos 8 caracteres com maiúscula, minúscula, número e símbolo.",
      )
      return
    }

    setSubmitting(true)
    try {
      const token = await getValidToken()
      if (!token) {
        setError("Sessão expirada. Faça login novamente.")
        setSubmitting(false)
        return
      }

      await authApi.createServiceUser(
        { email, password, roleIdNum, serviceId },
        token,
      )

      const svc = knownServices.find((s) => s.id === serviceId)
      addCreatedUser({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        email,
        roleIdNum,
        serviceId,
        serviceName: svc?.name,
        createdAt: new Date().toISOString(),
        createdBy: user?.email ?? "",
      })

      toast({
        type: "success",
        title: "Usuário criado",
        description: `${email} foi criado como ${ROLE_NAMES[roleIdNum]}.`,
      })
      setEmail("")
      setPassword("")
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof AuthApiError ? err.message : "Erro ao criar usuário",
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (allowed.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        Seu papel atual não permite criar usuários.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cu-email">Email</Label>
        <Input
          id="cu-email"
          type="email"
          placeholder="usuario@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cu-role">Papel</Label>
        <Select
          id="cu-role"
          value={roleIdNum}
          onChange={(e) => setRoleIdNum(Number(e.target.value))}
        >
          {allowed.map((r) => (
            <option key={r} value={r}>
              {ROLE_NAMES[r]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cu-service">Serviço (serviceId)</Label>
        <Input
          id="cu-service"
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="cu-password">Senha</Label>
        <PasswordInput
          id="cu-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <PwRule ok={pwChecks.length} label="8+ caracteres" />
          <PwRule ok={pwChecks.upper} label="Letra maiúscula" />
          <PwRule ok={pwChecks.lower} label="Letra minúscula" />
          <PwRule ok={pwChecks.number} label="Número" />
          <PwRule ok={pwChecks.symbol} label="Símbolo" />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" loading={submitting} className="mt-2">
        Criar usuário
      </Button>
    </form>
  )
}

function PwRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-xs",
        ok ? "text-primary" : "text-muted-foreground",
      )}
    >
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </span>
  )
}
