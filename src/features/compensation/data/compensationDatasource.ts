import type {
  AwardBonusInput,
  CompensationBoard,
  UpsertFixedSalaryInput,
} from '../domain/compensationEntities'

export type CompensationDatasource = {
  getBoard(): Promise<CompensationBoard>
  upsertFixedSalary(input: UpsertFixedSalaryInput): Promise<string>
  suspendFixedSalary(repId: string): Promise<string>
  awardBonus(input: AwardBonusInput): Promise<string>
}
