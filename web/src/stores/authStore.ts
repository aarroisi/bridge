import { create } from 'zustand'
import { User } from '@/types'
import { api } from '@/lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const data = await api.post<{ user: User; token: string }>('/auth/login', {
        email,
        password,
      })
      api.setToken(data.token)
      set({ user: data.user, isAuthenticated: true })
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  },

  logout: () => {
    api.clearToken()
    set({ user: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    try {
      const user = await api.get<User>('/auth/me')
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
