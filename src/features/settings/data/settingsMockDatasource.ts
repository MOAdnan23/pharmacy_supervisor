import type { SettingsDatasource } from './settingsDatasource'
import {
  createSupervisorAccount,
  getSupervisorById,
  listSupervisorAccounts,
  toAuthUser,
  updateSupervisorAccount,
} from './supervisorAccountsStore'

export const settingsMockDatasource: SettingsDatasource = {
  async getBoard(currentUserId) {
    const me = getSupervisorById(currentUserId)
    if (!me) throw new Error('تعذّر تحميل الملف الشخصي')
    return {
      profile: toAuthUser(me),
      supervisors: listSupervisorAccounts().map(
        ({ password: _p, ...rest }) => rest,
      ),
    }
  },

  async updateProfile(currentUserId, input) {
    const name = input.name.trim()
    const phone = input.phone.trim()
    const address = input.address.trim()
    if (!name) throw new Error('الاسم مطلوب')
    if (!phone) throw new Error('رقم الهاتف مطلوب')
    if (!address) throw new Error('العنوان مطلوب')
    const updated = updateSupervisorAccount(currentUserId, {
      name,
      phone,
      address,
      avatarUrl: input.avatarUrl === undefined ? undefined : input.avatarUrl,
    })
    return {
      user: toAuthUser(updated),
      message: 'تم حفظ الملف الشخصي بنجاح',
    }
  },

  async changePassword(currentUserId, input) {
    const me = getSupervisorById(currentUserId)
    if (!me) throw new Error('الحساب غير موجود')
    if (input.currentPassword !== me.password) {
      throw new Error('كلمة المرور الحالية غير صحيحة')
    }
    if (input.newPassword.trim().length < 4) {
      throw new Error('كلمة المرور الجديدة قصيرة جداً')
    }
    if (input.newPassword !== input.confirmPassword) {
      throw new Error('تأكيد كلمة المرور غير متطابق')
    }
    updateSupervisorAccount(currentUserId, {
      password: input.newPassword.trim(),
    })
    return 'تم تغيير كلمة المرور بنجاح'
  },

  async createSupervisor(input) {
    createSupervisorAccount(input)
    return 'تم إضافة المشرف بنجاح'
  },
}
