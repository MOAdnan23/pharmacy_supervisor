import type { DashboardOverview } from '../domain/dashboard'
import type { DashboardDatasource } from './dashboardDatasource'

export const dashboardMockDatasource: DashboardDatasource = {
  async getOverview() {
    await delay(250)
    const data: DashboardOverview = {
      kpis: [
        { label: 'إجمالي المبيعات', value: '48.2M', hint: '+12.5%', tone: 'good' },
        { label: 'التحصيلات', value: '31.7M', hint: '+8.2%', tone: 'good' },
        { label: 'إجمالي الذمم', value: '16.4M', hint: '-5.4%', tone: 'bad' },
        { label: 'صيدليات نشطة', value: '64', hint: 'صيدلية', tone: 'neutral' },
        { label: 'مناديب فاعلين', value: '12', hint: 'مندوب', tone: 'neutral' },
        { label: 'خطط العمل', value: '08', hint: 'خطة', tone: 'neutral' },
        { label: 'أصناف حرجة', value: '42', hint: 'تنبيه', tone: 'danger' },
      ],
      alerts: [
        {
          id: '1',
          message: 'نقص حرج في مخزون — يحتاج متابعة من المفوتر',
          tone: 'danger',
        },
        {
          id: '2',
          message: 'مندوب حقق التارغت الشهري',
          tone: 'success',
        },
        {
          id: '3',
          message: 'ذمم متأخرة على صيدليات محددة',
          tone: 'warn',
        },
      ],
    }
    return data
  },
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
