import { apiEndpoints } from '../../../core/api/apiEndpoints'
import { httpRequest } from '../../../core/api/httpClient'
import type {
  CreateUserInput,
  UpdateUserInput,
  UserStatus,
  UsersOverview,
} from '../domain/userEntities'
import type { UsersDatasource } from './usersDatasource'

/**
 * Remote جاهز لاحقاً — نفس العقد.
 * لن يُستدعى ما دام useRemoteUsers = false.
 */
export const usersRemoteDatasource: UsersDatasource = {
  async getOverview() {
    const data = await httpRequest<{ data?: UsersOverview } & UsersOverview>(
      apiEndpoints.users.summary,
    )
    if (data.summary && data.reps && data.invoicers) return data
    if (data.data?.summary) return data.data
    throw new Error('رد المستخدمين غير مفهوم')
  },

  async createUser(input: CreateUserInput) {
    await httpRequest(apiEndpoints.users.list, {
      method: 'POST',
      body: input,
    })
  },

  async updateUser(id: string, input: UpdateUserInput) {
    await httpRequest(apiEndpoints.users.byId(id), {
      method: 'PATCH',
      body: input,
    })
  },

  async setStatus(id: string, status: UserStatus) {
    await httpRequest(apiEndpoints.users.status(id), {
      method: 'POST',
      body: { status },
    })
  },

  async deleteUser(id: string) {
    await httpRequest(apiEndpoints.users.byId(id), {
      method: 'DELETE',
    })
  },
}
