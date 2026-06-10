"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { authApi, AuthApiError } from "@/lib/api"
import { useToast } from "@/components/ui/toast"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { ArrowLeft, AlertCircle } from "lucide-react"

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setEmail(params.get("email") ?? "")
    setServiceId(params.get("serviceId") ?? "")
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirm) {
      setError("As senhas não coincidem.")
      return
    }
    if (code.length !== 6) {
      setError("O código deve ter 6 dígitos.")
      return
    }

    setSubmitting(true)
    try {
      await authApi.resetPassword({ email, serviceId, code, newPassword })
      toast({
        type: "success",
        title: "Senha redefinida",
        description: "Faça login com a nova senha.",
      })
      router.push("/login")
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : "Erro ao redefinir a senha",
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Logo className="mb-8" />
      <h1 className="text-2xl font-semibold tracking-tight">Redefinir senha</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Informe o código que você recebeu por email e escolha uma nova senha.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="serviceId">ID do Serviço</Label>
          <Input
            id="serviceId"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            required
            className="font-mono text-xs"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Código de verificação</Label>
          <Input
            id="code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            className="text-center font-mono text-lg tracking-[0.5em]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="newPassword">Nova senha</Label>
          <PasswordInput
            id="newPassword"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm">Confirmar nova senha</Label>
          <PasswordInput
            id="confirm"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Redefinir senha
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao login
      </Link>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  )
}
