import type {
  CreateUserInput,
  UpdateUserInput,
  UserStatus,
  UsersOverview,
} from '../domain/userEntities'

/**
 * عقد إدارة المستخدمين — Mock و Remote بنفس الدوال.
 */
export type UsersDatasource = {
  getOverview: () => Promise<UsersOverview>
  createUser: (input: CreateUserInput) => Promise<void>
  updateUser: (id: string, input: UpdateUserInput) => Promise<void>
  setStatus: (id: string, status: UserStatus) => Promise<void>
  deleteUser: (id: string) => Promise<void>
}
