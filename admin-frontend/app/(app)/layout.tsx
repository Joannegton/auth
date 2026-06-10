"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { Logo } from "@/components/logo"
import { Menu, X } from "lucide-react"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        {/* Sidebar desktop */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Sidebar mobile (overlay) */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-background/80"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full">
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar mobile */}
          <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
            <Logo />
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Alternar menu"
              className="text-muted-foreground hover:text-foreground"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </header>

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
