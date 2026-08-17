export type UserStatus = 'active' | 'suspended'

export type ManagedUserRole = 'rep' | 'invoicer'

export type ManagedUser = {
  id: string
  name: string
  username: string
  /** كلمة المرور ظاهرة للمشرف حسب UC-511 / UC-12 */
  password: string
  phone: string
  region: string
  governorate?: string
  residence?: string
  role: ManagedUserRole
  status: UserStatus
  pharmacyCount: number
  /** شركات مرتبطة بالمندوب — منها فقط يُحدَّد التارغت */
  companies: string[]
  monthlyTarget: number
  createdAt: string
}

export type UsersSummary = {
  repsTotal: number
  repsActive: number
  repsSuspended: number
  invoicersTotal: number
  usersTotal: number
}

export type UsersOverview = {
  summary: UsersSummary
  reps: ManagedUser[]
  invoicers: ManagedUser[]
}

/** بيانات إنشاء حساب (UC-05 / UC-06) */
export type CreateUserInput = {
  name: string
  username: string
  password: string
  phone: string
  region: string
  governorate?: string
  residence?: string
  role: ManagedUserRole
  status?: UserStatus
}

/** بيانات تعديل حساب (UC-12 / UC-14) */
export type UpdateUserInput = {
  name: string
  username: string
  password: string
  phone: string
  region: string
  governorate?: string
  residence?: string
  status: UserStatus
}
