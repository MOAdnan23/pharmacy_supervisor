import type {
  CompanyTargetStatus,
  SetRepTargetInput,
  TargetsBoard,
  UpsertCompanyTargetInput,
} from '../domain/targetEntities'

export type TargetsDatasource = {
  getBoard: () => Promise<TargetsBoard>
  setRepTarget: (input: SetRepTargetInput) => Promise<void>
  upsertCompanyTarget: (input: UpsertCompanyTargetInput) => Promise<void>
  setCompanyTargetStatus: (
    id: string,
    status: CompanyTargetStatus,
  ) => Promise<void>
}
