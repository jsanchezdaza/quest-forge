import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { AuthState } from '../types'

// Constants
const AUTH_INITIALIZATION_TIMEOUT = 2000

// Helper functions
const fetchUserProfile = async (userId: string) => {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return profile
}

const setLoadingState = (loading: boolean) => ({ loading })
const setAuthenticatedState = (user: { id: string; email?: string }, profile: { id: string; username: string; created_at: string } | null) => ({
  user: { id: user.id, email: user.email || '' },
  profile,
  loading: false,
})
const setUnauthenticatedState = () => ({
  user: null,
  profile: null,
  loading: false,
})

const handleAsyncAction = async (action: () => Promise<void>, set: (state: Partial<AuthState>) => void) => {
  set(setLoadingState(true))
  try {
    await action()
  } catch (error) {
    set(setLoadingState(false))
    throw error
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    await handleAsyncAction(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id)
        set(setAuthenticatedState(data.user, profile))
      }
    }, set)
  },

  signUp: async (email: string, password: string, username: string) => {
    await handleAsyncAction(async () => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ username })
          .eq('id', data.user.id)
        
        if (profileError) throw profileError

        const profile = {
          id: data.user.id,
          username,
          created_at: new Date().toISOString(),
        }
        
        set(setAuthenticatedState(data.user, profile))
      }
    }, set)
  },

  signOut: async () => {
    await handleAsyncAction(async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set(setUnauthenticatedState())
    }, set)
  },

  updateProfile: async (username: string) => {
    const { user } = get()
    if (!user) throw new Error('No user logged in')
    
    await handleAsyncAction(async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ username })
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) throw error
      set({ profile: data, loading: false })
    }, set)
  },
}))

// Initialize auth state - rely on onAuthStateChange instead of getSession
const initializeAuth = () => {
  // In test environment, initialize immediately without auth
  if (import.meta.env.MODE === 'test' || process.env.NODE_ENV === 'test') {
    useAuthStore.setState(setUnauthenticatedState())
    return
  }
  
  // Set a fallback timeout in case onAuthStateChange never fires
  setTimeout(() => {
    const currentState = useAuthStore.getState()
    if (currentState.loading) {
      useAuthStore.setState(setUnauthenticatedState())
    }
  }, AUTH_INITIALIZATION_TIMEOUT)
}

// Initialize immediately
initializeAuth()

supabase.auth.onAuthStateChange(async (_, session) => {
  if (session?.user) {
    const profile = await fetchUserProfile(session.user.id)
    useAuthStore.setState(setAuthenticatedState(session.user, profile))
  } else {
    useAuthStore.setState(setUnauthenticatedState())
  }
})