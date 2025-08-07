import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { AuthState } from '../types'

const setLoadingState = (loading: boolean) => ({ loading })
const setAuthenticatedState = (user: any, profile: any) => ({
  user: { id: user.id, email: user.email! },
  profile,
  loading: false,
})
const setUnauthenticatedState = () => ({
  user: null,
  profile: null,
  loading: false,
})

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    set(setLoadingState(true))
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set(setLoadingState(false))
      throw error
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      set(setAuthenticatedState(data.user, profile))
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    set(setLoadingState(true))
    
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      set(setLoadingState(false))
      throw error
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ username })
        .eq('id', data.user.id)
      
      if (profileError) {
        set(setLoadingState(false))
        throw profileError
      }

      const profile = {
        id: data.user.id,
        username,
        created_at: new Date().toISOString(),
      }
      
      set(setAuthenticatedState(data.user, profile))
    }
  },

  signOut: async () => {
    set(setLoadingState(true))
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      set(setLoadingState(false))
      throw error
    }
    
    set(setUnauthenticatedState())
  },

  updateProfile: async (username: string) => {
    const { user } = get()
    if (!user) throw new Error('No user logged in')
    
    set(setLoadingState(true))
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ username })
      .eq('id', user.id)
      .select()
      .single()
    
    if (error) {
      set(setLoadingState(false))
      throw error
    }
    
    set({ profile: data, loading: false })
  },
}))

// Initialize auth state immediately
const initializeAuth = async () => {
  console.log('🔄 Initializing auth...')
  try {
    console.log('📡 Getting session from Supabase...')
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('📋 Session data:', { session, error })
    
    if (error) {
      console.error('❌ Session error:', error)
      useAuthStore.setState(setUnauthenticatedState())
      return
    }
    
    if (session?.user) {
      console.log('👤 User found, fetching profile...')
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      console.log('📝 Profile data:', { profile, profileError })
      
      useAuthStore.setState(setAuthenticatedState(session.user, profile))
    } else {
      console.log('🚫 No user session found')
      useAuthStore.setState(setUnauthenticatedState())
    }
  } catch (error) {
    console.error('💥 Auth initialization error:', error)
    useAuthStore.setState(setUnauthenticatedState())
  }
  console.log('✅ Auth initialization complete')
}

// Initialize immediately
initializeAuth()

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    useAuthStore.setState(setAuthenticatedState(session.user, profile))
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState(setUnauthenticatedState())
  }
})