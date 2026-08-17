/**
 * Remote جاهز لاحقاً — VITE_USE_REMOTE_SETTINGS=true
 */
import { apiEndpoints } from '../../../core/api/apiEndpoints'
import {
  httpRequest,
  successMessageFrom,
} from '../../../core/api/httpClient'
import type { AuthUser } from '../../auth/domain/user'
import type {
  ChangePasswordInput,
  CreateSupervisorInput,
  SettingsBoard,
  UpdateProfileInput,
} from '../domain/settingsEntities'
import type { SettingsDatasource } from './settingsDatasource'

type MessageBody = { message?: string; msg?: string; data?: unknown }

export const settingsRemoteDatasource: SettingsDatasource = {
  async getBoard(_currentUserId) {
    const data = await httpRequest<{ data?: SettingsBoard } & SettingsBoard>(
      apiEndpoints.settings.board,
    )
    if (data.profile && data.supervisors) return data
    if (data.data?.profile) return data.data
    throw new Error('تعذّر قراءة بيانات الإعدادات من الخادم')
  },

  async updateProfile(_currentUserId, input: UpdateProfileInput) {
    const data = await httpRequest<
      MessageBody & { data?: AuthUser } & AuthUser
    >(apiEndpoints.settings.profile, {
      method: 'PUT',
      body: {
        name: input.name,
        phone: input.phone,
        address: input.address,
        avatar_url: input.avatarUrl,
      },
    })
    const user =
      data.id && data.name
        ? data
        : data.data?.id
          ? data.data
          : null
    if (!user) {
      throw new Error('تعذّر قراءة الملف الشخصي من الخادم')
    }
    return {
      user,
      message: successMessageFrom(data, 'تم حفظ الملف الشخصي بنجاح'),
    }
  },

  async changePassword(_currentUserId, input: ChangePasswordInput) {
    const data = await httpRequest<MessageBody>(apiEndpoints.settings.password, {
      method: 'POST',
      body: {
        current_password: input.currentPassword,
        new_password: input.newPassword,
        confirm_password: input.confirmPassword,
      },
    })
    return successMessageFrom(data, 'تم تغيير كلمة المرور بنجاح')
  },

  async createSupervisor(input: CreateSupervisorInput) {
    const data = await httpRequest<MessageBody>(
      apiEndpoints.settings.supervisors,
      {
        method: 'POST',
        body: {
          name: input.name,
          username: input.username,
          password: input.password,
          phone: input.phone,
          address: input.address,
        },
      },
    )
    return successMessageFrom(data, 'تم إضافة المشرف بنجاح')
  },
}
