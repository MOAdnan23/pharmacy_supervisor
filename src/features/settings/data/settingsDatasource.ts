import type { AuthUser } from '../../auth/domain/user'
import type {
  ChangePasswordInput,
  CreateSupervisorInput,
  SettingsBoard,
  UpdateProfileInput,
} from '../domain/settingsEntities'

export type SettingsDatasource = {
  getBoard(currentUserId: string): Promise<SettingsBoard>
  updateProfile(
    currentUserId: string,
    input: UpdateProfileInput,
  ): Promise<{ user: AuthUser; message: string }>
  changePassword(
    currentUserId: string,
    input: ChangePasswordInput,
  ): Promise<string>
  createSupervisor(input: CreateSupervisorInput): Promise<string>
}
