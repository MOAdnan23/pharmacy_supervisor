import { apiEndpoints } from '../../../core/api/apiEndpoints'
import { httpRequest } from '../../../core/api/httpClient'
import type { PermissionsMatrix } from '../domain/permissionEntities'
import type { PermissionsDatasource } from './permissionsDatasource'

/** Remote جاهز لاحقاً — لن يُستدعى ما دام useRemotePermissions = false */
export const permissionsRemoteDatasource: PermissionsDatasource = {
  async getMatrix() {
    const data = await httpRequest<
      { data?: PermissionsMatrix } & PermissionsMatrix
    >(apiEndpoints.permissions.matrix)
    if (data.roles && data.permissions) return data
    if (data.data?.roles) return data.data
    throw new Error('رد الصلاحيات غير مفهوم')
  },
}
