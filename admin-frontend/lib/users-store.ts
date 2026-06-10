"use client"

// O backend não expõe listagem de usuários. Guardamos um histórico local
// dos usuários criados pelo admin nesta máquina, para conferência.

const KEY = "auth_admin_created_users"

export interface CreatedUser {
  id: string // gerado localmente (não é o id do backend)
  email: string
  roleIdNum: number
  serviceId: string
  serviceName?: string
  createdAt: string
  createdBy: string
}

export function getCreatedUsers(): CreatedUser[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CreatedUser[]) : []
  } catch {
    return []
  }
}

export function addCreatedUser(user: CreatedUser) {
  const list = getCreatedUsers()
  list.unshift(user)
  window.localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new Event("created-users-changed"))
}

export function removeCreatedUser(id: string) {
  const list = getCreatedUsers().filter((u) => u.id !== id)
  window.localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new Event("created-users-changed"))
}
