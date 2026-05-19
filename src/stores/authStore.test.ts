import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignUp = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignInWithOtp = vi.fn()
const mockVerifyOtp = vi.fn()
const mockUpdateUser = vi.fn()
const mockSignOut = vi.fn()
const mockRpc = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signInWithOtp: (...args: unknown[]) => mockSignInWithOtp(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      signOut: () => mockSignOut(),
    },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null } })
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  })

  function getStore() {
    return import('./authStore').then((m) => m.useAuthStore)
  }

  it('has correct initial state', async () => {
    const useAuthStore = await getStore()
    const state = useAuthStore.getState()
    expect(state.session).toBe(null)
    expect(state.user).toBe(null)
    expect(state.isLoading).toBe(true)
    expect(state.isNewUser).toBe(false)
  })

  it('signUp delegates to supabase auth', async () => {
    const useAuthStore = await getStore()
    mockSignUp.mockResolvedValueOnce({ error: null })

    await useAuthStore.getState().signUp('test@example.com', 'password123')

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('signUp throws on error', async () => {
    const useAuthStore = await getStore()
    mockSignUp.mockResolvedValueOnce({ error: new Error('Email already registered') })

    await expect(
      useAuthStore.getState().signUp('test@example.com', 'password123'),
    ).rejects.toThrow('Email already registered')
  })

  it('signIn updates user and session on success', async () => {
    const useAuthStore = await getStore()
    const mockUser = { id: 'u1', email: 'test@example.com' }
    const mockSession = { access_token: 'token', user: mockUser }
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    })

    await useAuthStore.getState().signIn('test@example.com', 'password123')

    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.session).toEqual(mockSession)
  })

  it('signIn throws on error', async () => {
    const useAuthStore = await getStore()
    mockSignInWithPassword.mockResolvedValueOnce({
      data: null,
      error: new Error('Invalid credentials'),
    })

    await expect(
      useAuthStore.getState().signIn('test@example.com', 'password123'),
    ).rejects.toThrow('Invalid credentials')
  })

  it('signOut clears session and user', async () => {
    const useAuthStore = await getStore()
    // Set initial user state
    const mockUser = { id: 'u1' }
    const mockSession = { access_token: 'token', user: mockUser }
    useAuthStore.setState({ user: mockUser, session: mockSession, isNewUser: true })

    mockSignOut.mockResolvedValueOnce(undefined)

    await useAuthStore.getState().signOut()

    const state = useAuthStore.getState()
    expect(state.session).toBe(null)
    expect(state.user).toBe(null)
    expect(state.isNewUser).toBe(false)
  })

  it('signInWithPhone looks up email via rpc then signs in', async () => {
    const useAuthStore = await getStore()
    mockRpc.mockResolvedValueOnce({ data: 'test@example.com', error: null })
    const mockUser = { id: 'u1' }
    const mockSession = { access_token: 'token', user: mockUser }
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    })

    await useAuthStore.getState().signInWithPhone('13800138000', 'password123')

    expect(mockRpc).toHaveBeenCalledWith('lookup_email_by_phone', { search_phone: '13800138000' })
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('signInWithPhone throws when phone not registered', async () => {
    const useAuthStore = await getStore()
    mockRpc.mockResolvedValueOnce({ data: null, error: null })

    await expect(
      useAuthStore.getState().signInWithPhone('13800138000', 'password'),
    ).rejects.toThrow('手机号未注册')
  })

  it('sendEmailOtp delegates to supabase auth', async () => {
    const useAuthStore = await getStore()
    mockSignInWithOtp.mockResolvedValueOnce({ error: null })

    await useAuthStore.getState().sendEmailOtp('test@example.com')

    expect(mockSignInWithOtp).toHaveBeenCalledWith({ email: 'test@example.com' })
  })

  it('resetPassword delegates to send OTP', async () => {
    const useAuthStore = await getStore()
    mockSignInWithOtp.mockResolvedValueOnce({ error: null })

    await useAuthStore.getState().resetPassword('test@example.com')

    expect(mockSignInWithOtp).toHaveBeenCalledWith({ email: 'test@example.com' })
  })

  it('checkOnboarding returns true and sets isNewUser when not onboarded', async () => {
    const useAuthStore = await getStore()
    const mockSelect = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null }) })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await useAuthStore.getState().checkOnboarding()

    expect(result).toBe(true)
    expect(useAuthStore.getState().isNewUser).toBe(true)
  })

  it('checkOnboarding returns false when onboarding done', async () => {
    const useAuthStore = await getStore()
    const mockSelect = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { onboarding_done: true } }),
    })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await useAuthStore.getState().checkOnboarding()

    expect(result).toBe(false)
    expect(useAuthStore.getState().isNewUser).toBe(false)
  })

  it('initAuth sets up session and auth state listener', async () => {
    const useAuthStore = await getStore()
    const mockUser = { id: 'u1' }
    const mockSession = { access_token: 'token', user: mockUser }
    mockGetSession.mockResolvedValue({ data: { session: mockSession } })

    const cleanup = useAuthStore.getState().initAuth()

    // getSession is called immediately
    await vi.waitFor(() => {
      expect(useAuthStore.getState().session).toEqual(mockSession)
      expect(useAuthStore.getState().user).toEqual(mockUser)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    expect(mockOnAuthStateChange).toHaveBeenCalled()
    expect(typeof cleanup).toBe('function')
  })
})
