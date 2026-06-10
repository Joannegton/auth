"use client"

import { useAuth } from "@/lib/auth-context"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Role,
  ROLE_NAMES,
  ROLE_DESCRIPTIONS,
  roleBadgeClass,
  assignableRoles,
} from "@/lib/roles"
import { cn } from "@/lib/utils"
import { Check, Minus } from "lucide-react"

const ALL_ROLES = [
  Role.OWNER,
  Role.ADMIN,
  Role.MODERATOR,
  Role.WORKER,
  Role.GUEST,
  Role.CLIENT,
  Role.BANNED,
]

export default function RolesPage() {
  const { user } = useAuth()
  const myRoles = user?.roles ?? []
  const myAssignable = assignableRoles(myRoles)

  return (
    <div>
      <PageHeader
        title="Papéis (RBAC)"
        description="Hierarquia de papéis do provedor de identidade e o que cada um pode fazer."
      />

      <div className="grid gap-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ALL_ROLES.map((role) => {
            const isMine = myRoles.includes(role)
            const canAssign = myAssignable.includes(role)
            return (
              <Card
                key={role}
                className={cn(isMine && "ring-1 ring-primary/40")}
              >
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <Badge className={roleBadgeClass(role)}>
                      {ROLE_NAMES[role]}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      id: {role}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2 border-t border-border/60 pt-3">
                    {isMine && (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <Check className="h-3 w-3" /> Seu papel
                      </span>
                    )}
                    {canAssign ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Check className="h-3 w-3" /> Você pode atribuir
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                        <Minus className="h-3 w-3" /> Não atribuível por você
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
