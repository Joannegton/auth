"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { CopyButton } from "@/components/ui/copy-button"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/lib/auth-context"
import { authApi, AuthApiError, type CreateServiceResponse } from "@/lib/api"
import { Role } from "@/lib/roles"
import {
  getKnownServices,
  saveKnownService,
  removeKnownService,
  type KnownService,
} from "@/lib/services-store"
import {
  Layers,
  Plus,
  Trash2,
  KeyRound,
  Info,
  AlertCircle,
  AlertTriangle,
} from "lucide-react"

export default function ServicesPage() {
  const { user, getValidToken } = useAuth()
  const { toast } = useToast()

  const [services, setServices] = useState<KnownService[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newKey, setNewKey] = useState<CreateServiceResponse | null>(null)

  const canCreate =
    user?.roles?.includes(Role.ADMIN) || user?.roles?.includes(Role.OWNER)

  function refresh() {
    setServices(getKnownServices())
  }

  useEffect(() => {
    refresh()
    window.addEventListener("known-services-changed", refresh)
    return () => window.removeEventListener("known-services-changed", refresh)
  }, [])

  return (
    <div>
      <PageHeader
        title="Serviços"
        description="Gerencie os serviços (tenants) deste provedor de identidade."
      >
        <Button variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Registrar existente
        </Button>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Layers className="h-4 w-4" />
            Novo serviço
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 p-6">
        <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-relaxed">
            A API não expõe listagem de serviços. Os serviços abaixo são
            mantidos localmente neste navegador — ao criar um novo serviço ele é
            adicionado automaticamente. Você também pode registrar um serviço
            existente pelo seu ID.
          </p>
        </div>

        {services.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Layers className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Nenhum serviço registrado</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {canCreate
                    ? "Crie um novo serviço ou registre um existente."
                    : "Registre um serviço existente pelo seu ID."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-secondary">
                        <Layers className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        {s.id === user?.serviceId && (
                          <span className="text-xs text-primary">Ativo</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeKnownService(s.id)}
                      aria-label="Remover"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2">
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {s.id}
                    </span>
                    <CopyButton value={s.id} />
                  </div>

                  {s.apiKey && (
                    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2">
                      <span className="flex items-center gap-1.5 truncate font-mono text-xs text-muted-foreground">
                        <KeyRound className="h-3.5 w-3.5 shrink-0" />
                        {s.apiKey.slice(0, 12)}…
                      </span>
                      <CopyButton value={s.apiKey} />
                    </div>
                  )}

                  {s.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Registrado em{" "}
                      {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Criar serviço */}
      <CreateServiceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(svc) => {
          setCreateOpen(false)
          setNewKey(svc)
        }}
        getValidToken={getValidToken}
        toast={toast}
      />

      {/* Registrar existente */}
      <AddServiceDialog open={addOpen} onClose={() => setAddOpen(false)} />

      {/* API Key recém-criada */}
      <Dialog
        open={!!newKey}
        onClose={() => setNewKey(null)}
        title="Serviço criado"
        description="Guarde a API key agora — ela não será exibida novamente."
      >
        {newKey && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Nome</Label>
              <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                {newKey.name}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Service ID</Label>
              <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2">
                <span className="truncate font-mono text-xs">{newKey.id}</span>
                <CopyButton value={newKey.id} label="Copiar" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>API Key</Label>
              <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2">
                <span className="truncate font-mono text-xs">
                  {newKey.apiKey}
                </span>
                <CopyButton value={newKey.apiKey} label="Copiar" />
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Esta é a única vez que a API key completa será mostrada. Copie e
                armazene em local seguro.
              </span>
            </div>
            <Button onClick={() => setNewKey(null)}>Entendi</Button>
          </div>
        )}
      </Dialog>
    </div>
  )
}

function CreateServiceDialog({
  open,
  onClose,
  onCreated,
  getValidToken,
  toast,
}: {
  open: boolean
  onClose: () => void
  onCreated: (svc: CreateServiceResponse) => void
  getValidToken: () => Promise<string | null>
  toast: (t: { type: "success" | "error"; title: string; description?: string }) => void
}) {
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const token = await getValidToken()
      if (!token) {
        setError("Sessão expirada. Faça login novamente.")
        setSubmitting(false)
        return
      }
      const svc = await authApi.createService(name, token)
      saveKnownService({
        id: svc.id,
        name: svc.name,
        apiKey: svc.apiKey,
        createdAt: svc.createdAt ?? new Date().toISOString(),
      })
      toast({ type: "success", title: "Serviço criado", description: svc.name })
      setName("")
      onCreated(svc)
    } catch (err) {
      setError(
        err instanceof AuthApiError ? err.message : "Erro ao criar serviço",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Novo serviço"
      description="Cria um novo tenant isolado. Requer papel de Administrador."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="svc-name">Nome do serviço</Label>
          <Input
            id="svc-name"
            placeholder="Ex: Beleze Salão"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <Button type="submit" loading={submitting}>
          Criar serviço
        </Button>
      </form>
    </Dialog>
  )
}

function AddServiceDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [name, setName] = useState("")
  const [id, setId] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    saveKnownService({
      id: id.trim(),
      name: name.trim() || id.trim(),
      createdAt: new Date().toISOString(),
    })
    setName("")
    setId("")
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Registrar serviço existente"
      description="Adicione um serviço pelo ID para facilitar o login e a criação de usuários."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="add-name">Nome (apelido)</Label>
          <Input
            id="add-name"
            placeholder="Ex: Produção"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="add-id">Service ID</Label>
          <Input
            id="add-id"
            placeholder="550e8400-..."
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            className="font-mono text-xs"
          />
        </div>
        <Button type="submit">Registrar</Button>
      </form>
    </Dialog>
  )
}
