import type { AuthUser } from '../domain/user'

export type AuthLoginResult = {
  user: AuthUser
  message: string
}

/**
 * عقد مصدر بيانات الدخول — Mock و Remote ينفّذان نفس الدوال.
 */
export type AuthDatasource = {
  login: (username: string, password: string) => Promise<AuthLoginResult>
  logout: () => Promise<void>
}
