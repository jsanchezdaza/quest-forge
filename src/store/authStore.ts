import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { AuthState } from '../types'

// Helper for auth operations with consistent error handling
const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  setState: (state: Partial<AuthState>) => void
): Promise<T> => {
  setState({ loading: true })
  try {
    const result = await operation()
    setState({ loading: false })
    return result
  } catch (error) {
    setState({ loading: false })
    throw error
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: false,

  signIn: async (email: string, password: string) => {
    return withErrorHandling(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) throw error

      if (data.user) {
        set({ 
          user: { id: data.user.id, email: data.user.email || '' },
          profile: null
        })
      }
    }, set)
  },

  signUp: async (email: string, password: string, username: string) => {
    return withErrorHandling(async () => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      
      if (error) throw error

      if (data.user) {
        set({ 
          user: { id: data.user.id, email: data.user.email || '' },
          profile: { id: data.user.id, username, created_at: new Date().toISOString() }
        })
      }
    }, set)
  },

  signOut: async () => {
    return withErrorHandling(async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      set({ user: null, profile: null })
    }, set)
  },
}))

// Simple initialization
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    useAuthStore.setState({
      user: { id: session.user.id, email: session.user.email || '' },
      profile: null,
      loading: false
    })
  } else {
    useAuthStore.setState({
      user: null,
      profile: null,
      loading: false
    })
  }
})