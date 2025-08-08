import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { AuthState } from '../types'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        set({ loading: false })
        throw error
      }

      if (data.user) {
        set({ 
          user: { id: data.user.id, email: data.user.email || '' },
          profile: null,
          loading: false 
        })
      }
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    set({ loading: true })
    
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      
      if (error) {
        set({ loading: false })
        throw error
      }

      if (data.user) {
        set({ 
          user: { id: data.user.id, email: data.user.email || '' },
          profile: { id: data.user.id, username, created_at: new Date().toISOString() },
          loading: false 
        })
      }
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  signOut: async () => {
    set({ loading: true })
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      set({ user: null, profile: null, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  updateProfile: async (_username: string) => {
    // Not implemented for basic version
    throw new Error('Profile update not available in basic mode')
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