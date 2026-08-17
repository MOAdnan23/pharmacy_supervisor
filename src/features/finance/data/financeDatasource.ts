import type {
  FinanceBoard,
  FinanceFilter,
  FinancialAdjustmentInput,
} from '../domain/financeEntities'

export type FinanceDatasource = {
  getBoard(filter?: FinanceFilter): Promise<FinanceBoard>
  createAdjustment(input: FinancialAdjustmentInput): Promise<void>
}
