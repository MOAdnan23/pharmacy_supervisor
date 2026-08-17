import { apiEndpoints } from '../../../core/api/apiEndpoints'
import {
  httpRequest,
  successMessageFrom,
} from '../../../core/api/httpClient'
import type { AuthUser } from '../domain/user'
import type { AuthDatasource } from './authDatasource'

/**
 * مصدر حقيقي لاحقاً — يستدعي Laravel.
 * غير مفعّل افتراضياً (انظر appConfig.useRemoteAuth).
 */
export const authRemoteDatasource: AuthDatasource = {
  async login(username, password) {
    const data = await httpRequest<{
      user?: AuthUser
      message?: string
      data?: { user?: AuthUser }
    }>(apiEndpoints.auth.login, {
      method: 'POST',
      body: { username, password },
    })

    const user = data.user ?? data.data?.user
    if (!user) {
      throw new Error('تعذّر قراءة بيانات المستخدم من الخادم')
    }
    return {
      user,
      message: successMessageFrom(data, 'تم تسجيل الدخول بنجاح'),
    }
  },

  async logout() {
    await httpRequest(apiEndpoints.auth.logout, { method: 'POST' })
  },
}
