"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { CreateUserForm } from "@/components/create-user-form"
import { ROLE_NAMES, roleBadgeClass } from "@/lib/roles"
import {
  getCreatedUsers,
  removeCreatedUser,
  type CreatedUser,
} from "@/lib/users-store"
import { UserPlus, Users, Trash2, Info } from "lucide-react"

export default function UsersPage() {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<CreatedUser[]>([])

  function refresh() {
    setUsers(getCreatedUsers())
  }

  useEffect(() => {
    refresh()
    window.addEventListener("created-users-changed", refresh)
    return () => window.removeEventListener("created-users-changed", refresh)
  }, [])

  return (
    <div>
      <PageHeader
        title="Usuários & Workers"
        description="Crie usuários e workers escopados a um serviço, respeitando a hierarquia RBAC."
      >
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Novo usuário
        </Button>
      </PageHeader>

      <div className="grid gap-6 p-6">
        <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-relaxed">
            A API de autenticação não expõe listagem de usuários por questões de
            segurança. A tabela abaixo mostra um histórico local dos usuários que
            você criou neste navegador, apenas para conferência.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Nenhum usuário criado ainda</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Crie seu primeiro usuário para começar.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Novo usuário
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Papel</th>
                      <th className="px-5 py-3 font-medium">Serviço</th>
                      <th className="px-5 py-3 font-medium">Criado em</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="px-5 py-3 font-medium">{u.email}</td>
                        <td className="px-5 py-3">
                          <Badge className={roleBadgeClass(u.roleIdNum)}>
                            {ROLE_NAMES[u.roleIdNum] ?? `Role ${u.roleIdNum}`}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-muted-foreground">
                            {u.serviceName ?? (
                              <span className="font-mono text-xs">
                                {u.serviceId.slice(0, 8)}…
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {new Date(u.createdAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCreatedUser(u.id)}
                            aria-label="Remover do histórico"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Criar usuário"
        description="O usuário será criado no serviço informado com o papel selecionado."
      >
        <CreateUserForm onSuccess={() => setOpen(false)} />
      </Dialog>
    </div>
  )
}
