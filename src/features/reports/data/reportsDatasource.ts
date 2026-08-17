import type {
  ReportsBoard,
  ReportResult,
  RunReportInput,
} from '../domain/reportEntities'

export type ReportsDatasource = {
  getBoard(): Promise<ReportsBoard>
  runReport(input: RunReportInput): Promise<ReportResult>
}
