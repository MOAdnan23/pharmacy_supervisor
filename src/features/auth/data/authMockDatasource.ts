import type { AuthDatasource } from './authDatasource'
import {
  findSupervisorByLogin,
  toAuthUser,
} from '../../settings/data/supervisorAccountsStore'

/** دخول عبر حسابات المشرفين المحفوظة محلياً */
export const authMockDatasource: AuthDatasource = {
  async login(username, password) {
    await delay(280)

    if (!username.trim() || !password.trim()) {
      throw new Error('أدخل اسم المستخدم وكلمة المرور')
    }

    const account = findSupervisorByLogin(username, password)
    if (!account) {
      throw new Error('بيانات الدخول غير صحيحة')
    }
    return {
      user: toAuthUser(account),
      message: 'تم تسجيل الدخول بنجاح',
    }
  },

  async logout() {
    await delay(80)
  },
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
