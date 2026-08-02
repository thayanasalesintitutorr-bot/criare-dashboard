'use client'

import { create } from 'zustand'

type Role = 'admin' | 'marketing' | null

type SessionRoleState = {
  role: Role
  loaded: boolean
  fetchRole: () => Promise<void>
}

// A sessão virou um cookie HttpOnly (o front não consegue mais ler o valor
// direto de document.cookie) — quem precisa saber se é admin ou marketing
// pergunta pra /api/auth/me uma vez e guarda aqui.
export const useSessionRole = create<SessionRoleState>((set, get) => ({
  role: null,
  loaded: false,
  fetchRole: async () => {
    if (get().loaded) return

    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      const json = await res.json().catch(() => ({ role: null }))
      set({ role: res.ok ? json.role : null, loaded: true })
    } catch {
      set({ role: null, loaded: true })
    }
  },
}))
