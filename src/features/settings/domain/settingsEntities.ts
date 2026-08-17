import type { AuthUser } from '../../auth/domain/user'

export type SupervisorListItem = {
  id: string
  name: string
  username: string
  phone: string
  address: string
  avatarUrl: string | null
  createdAt: string
}

export type UpdateProfileInput = {
  name: string
  phone: string
  address: string
  avatarUrl?: string | null
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type CreateSupervisorInput = {
  name: string
  username: string
  password: string
  phone: string
  address: string
}

export type SettingsBoard = {
  profile: AuthUser
  supervisors: SupervisorListItem[]
}
