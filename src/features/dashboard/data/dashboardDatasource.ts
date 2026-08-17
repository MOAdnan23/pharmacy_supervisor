import type { DashboardOverview } from '../domain/dashboard'

export type DashboardDatasource = {
  getOverview: () => Promise<DashboardOverview>
}
