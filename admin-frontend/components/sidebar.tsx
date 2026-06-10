"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ROLE_NAMES, roleBadgeClass } from "@/lib/roles"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Layers,
  LogOut,
  ShieldCheck,
} from "lucide-react"

const nav = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/users", label: "Usuários & Workers", icon: Users },
  { href: "/services", label: "Serviços", icon: Layers },
  { href: "/roles", label: "Papéis (RBAC)", icon: ShieldCheck },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const primaryRole = user?.roles?.length ? Math.min(...user.roles) : undefined

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center border-b border-border px-5">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-md bg-secondary p-3">
          <p className="truncate text-sm font-medium">
            {user?.name || user?.email}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          {primaryRole !== undefined && (
            <Badge className={cn("mt-2", roleBadgeClass(primaryRole))}>
              {ROLE_NAMES[primaryRole]}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="mt-2 w-full justify-start text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
