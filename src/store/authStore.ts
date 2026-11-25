import { create } from 'zustand'
import { languageMetadataUpdate, signUpMetadata } from '../lib/authLanguage'
import { passwordRecoveryRedirectTo } from '../lib/passwordRecovery'
import { supabase } from '../lib/supabase'
import { loadAndSyncUserProfile, type UserProfileRepository } from '../lib/userProfile'
import { getMockAuth, isMockInitialLoading, isMockPasswordRecovery, isTestMode } from '../lib/testMode'
import { createRecoveryHold, signOutInBackground, signOutLocalSession } from '../lib/updatePassword'
import { useLanguageStore } from './languageStore'
import type { AuthState, User } from '../types'

const recoveryHold = createRecoveryHold()

function afterAuthCallbackUnlocks(run: () => Promise<void>) {
  setTimeout(run, 0)
}

const userProfileRepository: UserProfileRepository = {
  findById: async (id) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, created_at')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  },
  upsertUsername: async (id, username) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ id, username }, { onConflict: 'id' })
      .select('id, username, created_at')
      .single()

    if (error) throw error
    return data
  },
}

const appUser = (user: { id: string; email?: string }): User => ({
  id: user.id,
  email: user.email || '',
})

const loadProfile = async (user: Parameters<typeof loadAndSyncUserProfile>[0]) => {
  try {
    return await loadAndSyncUserProfile(user, userProfileRepository)
  } catch (error) {
    console.error('Failed to load user profile:', error)
    return null
  }
}

const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  setState: (state: Partial<AuthState>) => void,
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
  initializing: !isTestMode(),
  loading: false,
  passwordRecovery: false,

  signIn: async (email: string, password: string) => {
    return withErrorHandling(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      if (data.user) {
        const profile = await loadProfile(data.user)
        set({ user: appUser(data.user), profile })
      }
    }, set)
  },

  signUp: async (email: string, password: string, username: string) => {
    return withErrorHandling(async () => {
      const normalizedUsername = username.trim()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: signUpMetadata(normalizedUsername, useLanguageStore.getState().language),
        },
      })
      if (error) throw error

      if (data.user) {
        const persistedProfile = data.session ? await loadProfile(data.user) : null
        set({
          user: appUser(data.user),
          profile: persistedProfile ?? {
            id: data.user.id,
            username: normalizedUsername,
            created_at: new Date().toISOString(),
          },
        })
      }
    }, set)
  },

  requestPasswordReset: async (email: string) => {
    const redirectTo = passwordRecoveryRedirectTo(window.location.origin)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    if (error) throw error
  },

  updatePassword: async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  },

  clearPasswordRecovery: () => {
    recoveryHold.release()
    set({ passwordRecovery: false })
  },

  endRecoverySession: () => {
    recoveryHold.release()
    set({ user: null, profile: null, passwordRecovery: false, loading: false })
    if (isTestMode()) {
      localStorage.removeItem('sb-mock-auth-token')
      return
    }
    signOutInBackground(
      async () => {
        const { error } = await signOutLocalSession((options) => supabase.auth.signOut(options))
        if (error) throw error
      },
      (error) => console.error('Failed to end the recovery session:', error),
    )
  },

  signOut: async () => {
    if (isTestMode()) {
      localStorage.removeItem('sb-mock-auth-token')
      set({ user: null, profile: null, loading: false })
      return
    }

    return withErrorHandling(async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, profile: null })
    }, set)
  },
}))

useLanguageStore.subscribe((state, previous) => {
  if (state.language === previous.language) return
  const update = languageMetadataUpdate(state.language, useAuthStore.getState().user !== null)
  if (!update) return
  void supabase.auth.updateUser(update).then(({ error }) => {
    if (error) console.error('Failed to store the language preference:', error)
  })
})

if (isTestMode()) {
  if (isMockInitialLoading()) {
    useAuthStore.setState({
      user: null,
      profile: null,
      initializing: true,
      passwordRecovery: isMockPasswordRecovery(),
    })
  } else {
    const mockAuth = getMockAuth()
    useAuthStore.setState({
      user: mockAuth?.user ?? null,
      profile: mockAuth?.profile ?? null,
      initializing: false,
      passwordRecovery: isMockPasswordRecovery(),
    })
  }
} else {
  let authSequence = 0
  supabase.auth.onAuthStateChange((event, session) => {
    const sequence = ++authSequence
    const passwordRecovery = recoveryHold.apply(event, Boolean(session?.user))
    if (!session?.user) {
      useAuthStore.setState({
        user: null,
        profile: null,
        initializing: false,
        passwordRecovery,
      })
      return
    }

    afterAuthCallbackUnlocks(async () => {
      const profile = await loadProfile(session.user)
      if (sequence !== authSequence) return
      useAuthStore.setState({
        user: appUser(session.user),
        profile,
        initializing: false,
        passwordRecovery: recoveryHold.current(),
      })
    })
  })
}
