import { create } from 'zustand'
import type { Rol } from '../shared/types'

export interface Session {
  usuarioId: string | null
  rol: Rol | null
  onboardingDone: boolean
}

interface SessionState extends Session {
  login: (usuarioId: string, rol: Rol) => void
  selectRol: (rol: Rol) => void
  logout: () => void
  markOnboarding: () => void
}

const KEY = 'pickids-session'

function readStored(): Session {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { usuarioId: null, rol: null, onboardingDone: false }
    return JSON.parse(raw)
  } catch { return { usuarioId: null, rol: null, onboardingDone: false } }
}

function persist(s: Session) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* noop */ }
}

export const useSession = create<SessionState>((set, get) => ({
  ...readStored(),
  login: (usuarioId, rol) => {
    const next = { usuarioId, rol, onboardingDone: get().onboardingDone }
    persist(next); set(next)
  },
  selectRol: (rol) => {
    const next = { usuarioId: get().usuarioId, rol, onboardingDone: get().onboardingDone }
    persist(next); set(next)
  },
  logout: () => {
    const next = { usuarioId: null, rol: null, onboardingDone: get().onboardingDone }
    persist(next); set(next)
  },
  markOnboarding: () => {
    const next = { ...get(), onboardingDone: true } as Session
    persist(next); set(next)
  },
}))
