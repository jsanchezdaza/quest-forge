import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { AuthState } from '../types'

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
          
        set({
          user: {
            id: data.user.id,
            email: data.user.email!,
          },
          profile,
          loading: false,
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ username })
          .eq('id', data.user.id)
          
        if (profileError) throw profileError
        
        set({
          user: {
            id: data.user.id,
            email: data.user.email!,
          },
          profile: {
            id: data.user.id,
            username,
            created_at: new Date().toISOString(),
          },
          loading: false,
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
      
      set({
        user: null,
        profile: null,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  updateProfile: async (username: string) => {
    const { user } = get()
    if (!user) throw new Error('No user logged in')
    
    set({ loading: true })
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ username })
        .eq('id', user.id)
        .select()
        .single()
        
      if (error) throw error
      
      set({
        profile: data,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },
}))

// Initialize auth state
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      
    useAuthStore.setState({
      user: {
        id: session.user.id,
        email: session.user.email!,
      },
      profile,
      loading: false,
    })
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      profile: null,
      loading: false,
    })
  } else {
    useAuthStore.setState({ loading: false })
  }
})