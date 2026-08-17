/**
 * إعدادات التبديل بين Mock و Remote
 *
 * الافتراضي = Mock (يعمل بدون سيرفر)
 * للتفعيل لاحقاً عند تشغيل Vite:
 *   VITE_USE_REMOTE_AUTH=true
 *   VITE_USE_REMOTE_DASHBOARD=true
 *   VITE_USE_REMOTE_USERS=true
 *   VITE_USE_REMOTE_TARGETS=true
 *   VITE_USE_REMOTE_PERMISSIONS=true
 *   VITE_USE_REMOTE_REGIONS=true
 *   VITE_USE_REMOTE_OFFERS=true
 *   VITE_USE_REMOTE_PLANS=true
 *   VITE_USE_REMOTE_RATES=true
 *   VITE_USE_REMOTE_FINANCE=true
 *   VITE_USE_REMOTE_EVALUATION=true
 *   VITE_USE_REMOTE_COMPENSATION=true
 *   VITE_USE_REMOTE_WAREHOUSE=true
 *   VITE_USE_REMOTE_NOTIFICATIONS=true
 *   VITE_USE_REMOTE_REPORTS=true
 *   VITE_USE_REMOTE_SETTINGS=true
 */
function flag(name: string, fallback = false): boolean {
  const value = import.meta.env[name]
  if (value === undefined || value === '') return fallback
  return value === 'true' || value === '1'
}

export const appConfig = {
  /** عنوان السيرفر لاحقاً */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    'http://localhost:8000',

  useRemoteAuth: flag('VITE_USE_REMOTE_AUTH'),
  useRemoteDashboard: flag('VITE_USE_REMOTE_DASHBOARD'),
  useRemoteUsers: flag('VITE_USE_REMOTE_USERS'),
  useRemoteTargets: flag('VITE_USE_REMOTE_TARGETS'),
  useRemotePermissions: flag('VITE_USE_REMOTE_PERMISSIONS'),
  useRemoteRegions: flag('VITE_USE_REMOTE_REGIONS'),
  useRemoteOffers: flag('VITE_USE_REMOTE_OFFERS'),
  useRemotePlans: flag('VITE_USE_REMOTE_PLANS'),
  useRemoteRates: flag('VITE_USE_REMOTE_RATES'),
  useRemoteFinance: flag('VITE_USE_REMOTE_FINANCE'),
  useRemoteEvaluation: flag('VITE_USE_REMOTE_EVALUATION'),
  useRemoteCompensation: flag('VITE_USE_REMOTE_COMPENSATION'),
  useRemoteWarehouse: flag('VITE_USE_REMOTE_WAREHOUSE'),
  useRemoteNotifications: flag('VITE_USE_REMOTE_NOTIFICATIONS'),
  useRemoteReports: flag('VITE_USE_REMOTE_REPORTS'),
  useRemoteSettings: flag('VITE_USE_REMOTE_SETTINGS'),
}
