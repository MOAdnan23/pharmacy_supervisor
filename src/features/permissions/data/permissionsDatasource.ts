import type { PermissionsMatrix } from '../domain/permissionEntities'

export type PermissionsDatasource = {
  getMatrix: () => Promise<PermissionsMatrix>
}
