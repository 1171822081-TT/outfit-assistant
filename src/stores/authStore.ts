import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  isLoading: boolean
  isNewUser: boolean
  initAuth: () => () => void
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithPhone: (phone: string, password: string) => Promise<void>
  sendEmailOtp: (email: string) => Promise<void>
  verifyEmailOtp: (email: string, token: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (email: string, token: string, newPassword: string) => Promise<void>
  checkOnboarding: () => Promise<boolean>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isNewUser: false,

  initAuth: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
      })
    }).catch(() => {
      set({ isLoading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
      })
    })

    return () => subscription.unsubscribe()
  },

  signUp: async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    set({ user: data.user, session: data.session })
  },

  signInWithPhone: async (phone: string, password: string) => {
    const { data: email, error: lookupErr } = await supabase
      .rpc('lookup_email_by_phone', { search_phone: phone })

    if (lookupErr || !email) {
      throw new Error('手机号未注册')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    set({ user: data.user, session: data.session })
  },

  sendEmailOtp: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
  },

  verifyEmailOtp: async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) throw error

    set({ user: data.user, session: data.session })
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
  },

  updatePassword: async (email: string, token: string, newPassword: string) => {
    const { data, error: verifyErr } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (verifyErr) throw verifyErr

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error

    set({ user: data.user, session: data.session })
  },

  checkOnboarding: async (): Promise<boolean> => {
    const { data } = await supabase
      .from('user_profile')
      .select('onboarding_done')
      .single()
    const done = data?.onboarding_done === true
    set({ isNewUser: !done })
    return !done
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, isNewUser: false })
  },
}))
