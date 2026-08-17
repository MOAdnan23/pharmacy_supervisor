export type DashboardTone = 'good' | 'bad' | 'neutral' | 'danger'

export type DashboardKpi = {
  label: string
  value: string
  hint: string
  tone: DashboardTone
}

export type DashboardAlert = {
  id: string
  message: string
  tone: 'danger' | 'success' | 'warn'
}

export type DashboardOverview = {
  kpis: DashboardKpi[]
  alerts: DashboardAlert[]
}
