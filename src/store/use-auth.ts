'use client'

import { create } from 'zustand'

type AuthState = {
  isLoggedIn: boolean
  login: () => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  isLoggedIn: true,
  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),
}))
