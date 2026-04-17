import { create } from 'zustand'

export interface Toast {
  id: string
  title: string
  body?: string
  variant: 'info' | 'success' | 'error' | 'warning'
}

interface ToastState {
  list: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

export const useToast = create<ToastState>((set, get) => ({
  list: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2, 9)
    set({ list: [...get().list, { ...t, id }] })
    setTimeout(() => get().dismiss(id), 3800)
  },
  dismiss: (id) => set({ list: get().list.filter(t => t.id !== id) }),
}))
