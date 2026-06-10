"use client"

// O backend não expõe listagem de serviços. Mantemos um cache local
// dos serviços que o admin cria ou consulta para facilitar a gestão.

const KEY = "auth_admin_known_services"

export interface KnownService {
  id: string
  name: string
  apiKey?: string
  createdAt: string
}

export function getKnownServices(): KnownService[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as KnownService[]) : []
  } catch {
    return []
  }
}

export function saveKnownService(service: KnownService) {
  const list = getKnownServices()
  const idx = list.findIndex((s) => s.id === service.id)
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...service }
  } else {
    list.unshift(service)
  }
  window.localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new Event("known-services-changed"))
}

export function removeKnownService(id: string) {
  const list = getKnownServices().filter((s) => s.id !== id)
  window.localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new Event("known-services-changed"))
}
