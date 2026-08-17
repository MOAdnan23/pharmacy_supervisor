import type {
  PreviewCommissionInput,
  PreviewCommissionResult,
  RatesBoard,
  UpsertCompanyRateInput,
  UpsertProductRateInput,
} from '../domain/rateEntities'

export type RatesDatasource = {
  getBoard(): Promise<RatesBoard>
  upsertCompanyRate(input: UpsertCompanyRateInput): Promise<void>
  suspendCompanyRate(id: string): Promise<void>
  upsertProductRate(input: UpsertProductRateInput): Promise<void>
  suspendProductRate(id: string): Promise<void>
  deleteProductRate(id: string): Promise<void>
  previewCommission(
    input: PreviewCommissionInput,
  ): Promise<PreviewCommissionResult>
}
