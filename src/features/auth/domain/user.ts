/** شكل مستخدم المشرف داخل التطبيق */
export type AuthUser = {
  id: string
  name: string
  username: string
  role: 'supervisor'
  phone?: string
  address?: string
  avatarUrl?: string | null
}
