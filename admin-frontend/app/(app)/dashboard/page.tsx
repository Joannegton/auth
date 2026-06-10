"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ROLE_NAMES,
  ROLE_DESCRIPTIONS,
  roleBadgeClass,
  assignableRoles,
  Role,
} from "@/lib/roles"
import { getKnownServices, type KnownService } from "@/lib/services-store"
import { cn } from "@/lib/utils"
import {
  UserPlus,
  Layers,
  ShieldCheck,
  KeyRound,
  Mail,
  Phone,
  Fingerprint,
  Clock,
  ArrowRight,
} from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<KnownService[]>([])

  useEffect(() => {
    setServices(getKnownServices())
    const handler = () => setServices(getKnownServices())
    window.addEventListener("known-services-changed", handler)
    return () => window.removeEventListener("known-services-changed", handler)
  }, [])

  if (!user) return null

  const roles = user.roles ?? []
  const canAssign = assignableRoles(roles)
  const activeService = services.find((s) => s.id === user.serviceId)
  const sessionExp = new Date(user.exp * 1000)

  return (
    <div>
      <PageHeader
        title={`Olá, ${user.name || user.email.split("@")[0]}`}
        description="Visão geral da sua sessão, papéis e ações de gestão disponíveis."
      />

      <div className="grid gap-6 p-6">
        {/* Cartões de resumo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<ShieldCheck className="h-5 w-5 text-primary" />}
            label="Papéis ativos"
            value={String(roles.length)}
          />
          <StatCard
            icon={<UserPlus className="h-5 w-5 text-primary" />}
            label="Papéis que você pode criar"
            value={String(canAssign.length)}
          />
          <StatCard
            icon={<Layers className="h-5 w-5 text-primary" />}
            label="Serviços conhecidos"
            value={String(services.length)}
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-primary" />}
            label="Sessão expira"
            value={sessionExp.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sessão atual */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sessão atual</CardTitle>
              <CardDescription>
                Claims extraídos do token JWT (RS256).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
              {user.name && (
                <InfoRow icon={<Fingerprint className="h-4 w-4" />} label="Nome" value={user.name} />
              )}
              {user.phone && (
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={user.phone} />
              )}
              <InfoRow
                icon={<Fingerprint className="h-4 w-4" />}
                label="User ID"
                value={user.sub}
                mono
              />
              <InfoRow
                icon={<Layers className="h-4 w-4" />}
                label="Serviço ativo"
                value={activeService ? `${activeService.name} (${user.serviceId})` : user.serviceId}
                mono
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-sm text-muted-foreground">Papéis:</span>
                {roles.map((r) => (
                  <Badge key={r} className={roleBadgeClass(r)}>
                    {ROLE_NAMES[r] ?? `Role ${r}`}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ações rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações rápidas</CardTitle>
              <CardDescription>Atalhos de gestão.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <QuickAction
                href="/users"
                icon={<UserPlus className="h-4 w-4" />}
                label="Criar usuário ou worker"
              />
              {roles.includes(Role.ADMIN) || roles.includes(Role.OWNER) ? (
                <QuickAction
                  href="/services"
                  icon={<Layers className="h-4 w-4" />}
                  label="Criar novo serviço"
                />
              ) : null}
              <QuickAction
                href="/roles"
                icon={<KeyRound className="h-4 w-4" />}
                label="Ver matriz de papéis"
              />
            </CardContent>
          </Card>
        </div>

        {/* Papéis que pode atribuir */}
        <Card>
          <CardHeader>
            <CardTitle>Papéis que você pode atribuir</CardTitle>
            <CardDescription>
              Baseado na sua hierarquia RBAC ao criar novos usuários.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canAssign.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Seu papel atual não permite criar outros usuários.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {canAssign.map((r) => (
                  <div
                    key={r}
                    className="rounded-md border border-border bg-secondary/50 p-4"
                  >
                    <Badge className={cn("mb-2", roleBadgeClass(r))}>
                      {ROLE_NAMES[r]}
                    </Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {ROLE_DESCRIPTIONS[r]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-secondary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "truncate text-sm text-foreground",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </span>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link href={href}>
      <Button variant="outline" className="w-full justify-between">
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  )
}
