import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ApiError, api, clearTokens, setTokens } from '../lib/api'

export interface AuthUser {
  id: string
  email: string
  name: string
  lang: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => user.value !== null)

  // ── Auth actions ────────────────────────────────────────────────────────────

  async function login(email: string, password: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
        '/auth/login',
        { email, password },
      )
      setTokens(data.accessToken, data.refreshToken)
      user.value = data.user
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, name: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
        '/auth/register',
        { email, password, name },
      )
      setTokens(data.accessToken, data.refreshToken)
      user.value = data.user
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Registration failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // Best-effort: clear tokens even if server call fails
    }
    clearTokens()
    user.value = null
  }

  /** Called on app startup to restore session from stored tokens. */
  async function restoreSession(): Promise<void> {
    const hasToken = localStorage.getItem('access_token') || localStorage.getItem('refresh_token')
    if (!hasToken) return
    try {
      user.value = await api.get<AuthUser>('/user/me')
    } catch (e) {
      // Only wipe tokens on definitive auth rejection, not on network errors
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        clearTokens()
      }
      // On network errors, keep tokens so next visit can try again
    }
  }

  return { user, loading, error, isLoggedIn, login, register, logout, restoreSession }
})
