/**
 * AuthContext = حالة الدخول المشتركة بين الصفحات
 */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getAuthDatasource } from './data'
import type { AuthUser } from './domain/user'

type LoginOutcome =
  | { ok: true; message: string }
  | { ok: false; error: string }

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<LoginOutcome>
  logout: () => void
  updateUser: (next: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'supervisor_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const datasource = getAuthDatasource()

  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as AuthUser) : null
  })

  async function login(
    username: string,
    password: string,
  ): Promise<LoginOutcome> {
    try {
      const result = await datasource.login(username, password)
      setUser(result.user)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user))
      return { ok: true, message: result.message }
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : 'فشل تسجيل الدخول',
      }
    }
  }

  async function logout() {
    try {
      await datasource.logout()
    } finally {
      setUser(null)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function updateUser(next: AuthUser) {
    setUser(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
      updateUser,
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth يجب استخدامه داخل AuthProvider')
  }
  return ctx
}
