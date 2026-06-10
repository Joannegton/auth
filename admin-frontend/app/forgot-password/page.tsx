"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { authApi, AuthApiError } from "@/lib/api"
import { getKnownServices, type KnownService } from "@/lib/services-store"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [knownServices, setKnownServices] = useState<KnownService[]>([])

  useEffect(() => {
    setKnownServices(getKnownServices())
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await authApi.forgotPassword(email, serviceId)
      setDone(true)
    } catch (err) {
      setError(
        err instanceof AuthApiError ? err.message : "Erro ao enviar solicitação",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Logo className="mb-8" />

        {done ? (
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Verifique seu email
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Se existir uma conta para <strong>{email}</strong> neste serviço,
              enviamos um código de 6 dígitos para redefinir a senha.
            </p>
            <Link href={`/reset-password?email=${encodeURIComponent(email)}&serviceId=${encodeURIComponent(serviceId)}`}>
              <Button className="w-full">Já tenho um código</Button>
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              Recuperar senha
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Informe seu email e o ID do serviço para receber um código de
              redefinição.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="serviceId">ID do Serviço</Label>
                <Input
                  id="serviceId"
                  placeholder="550e8400-..."
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
                Enviar código
              </Button>
            </form>

            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
