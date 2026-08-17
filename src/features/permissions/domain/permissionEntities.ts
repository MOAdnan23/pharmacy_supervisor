/** أدوار النظام الثلاثة المعروضة في UC-15 */
export type SystemRole = 'supervisor' | 'invoicer' | 'rep'

export type PermissionAccess = 'yes' | 'no' | 'read'

export type PermissionRow = {
  id: string
  label: string
  /** وصف قصير للمبتدئ */
  hint?: string
  access: Record<SystemRole, PermissionAccess>
}

export type RoleInfo = {
  id: SystemRole
  label: string
  platform: string
}

export type PermissionsMatrix = {
  roles: RoleInfo[]
  permissions: PermissionRow[]
  notes: string[]
}
