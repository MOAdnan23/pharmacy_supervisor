/**
 * مسارات API المتوقعة للمشرف (عقد للباك لاحقاً)
 * مشابه لفكرة ApiEndpoints في تطبيق المفوتر.
 */
export const apiEndpoints = {
  auth: {
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    me: '/api/v1/auth/me',
  },
  dashboard: {
    overview: '/api/v1/supervisor/dashboard',
  },
  users: {
    list: '/api/v1/users',
    summary: '/api/v1/users/summary',
    byId: (id: string) => `/api/v1/users/${id}`,
    status: (id: string) => `/api/v1/users/${id}/status`,
  },
  targets: {
    board: '/api/v1/targets/board',
    repTargets: '/api/v1/targets/reps',
    companyTargets: '/api/v1/targets/companies',
    companyById: (id: string) => `/api/v1/targets/companies/${id}`,
    companyStatus: (id: string) => `/api/v1/targets/companies/${id}/status`,
  },
  permissions: {
    matrix: '/api/v1/permissions/matrix',
  },
  regions: {
    list: '/api/v1/regions',
    byId: (id: string) => `/api/v1/regions/${id}`,
    subRegions: (regionId: string) =>
      `/api/v1/regions/${regionId}/sub-regions`,
    subRegionById: (id: string) => `/api/v1/sub-regions/${id}`,
  },
  offers: {
    board: '/api/v1/supervisor/offers/board',
    list: '/api/v1/supervisor/offers',
    byId: (id: string) => `/api/v1/supervisor/offers/${id}`,
    status: (id: string) => `/api/v1/supervisor/offers/${id}/status`,
    activate: (id: string) => `/api/v1/supervisor/offers/${id}/activate`,
    duplicate: (id: string) => `/api/v1/supervisor/offers/${id}/duplicate`,
  },
  plans: {
    board: '/api/v1/supervisor/plans/board',
    list: '/api/v1/supervisor/plans',
    byId: (id: string) => `/api/v1/supervisor/plans/${id}`,
    review: (id: string) => `/api/v1/supervisor/plans/${id}/review`,
    notes: (id: string) => `/api/v1/supervisor/plans/${id}/notes`,
    evaluate: (id: string) => `/api/v1/supervisor/plans/${id}/evaluate`,
    archive: (id: string) => `/api/v1/supervisor/plans/${id}/archive`,
  },
  /** نسب العمولة — الكتالوج من المفوتر؛ النسب من المشرف */
  rates: {
    board: '/api/v1/supervisor/rates/board',
    companyRates: '/api/v1/supervisor/rates/companies',
    companyRateById: (id: string) =>
      `/api/v1/supervisor/rates/companies/${id}`,
    suspendCompanyRate: (id: string) =>
      `/api/v1/supervisor/rates/companies/${id}/suspend`,
    productRates: '/api/v1/supervisor/rates/products',
    productRateById: (id: string) =>
      `/api/v1/supervisor/rates/products/${id}`,
    suspendProductRate: (id: string) =>
      `/api/v1/supervisor/rates/products/${id}/suspend`,
    preview: '/api/v1/supervisor/rates/preview',
    /** قراءة كتالوج المفوتر لاحقاً إن احتجنا استدعاءً منفصلاً */
    catalog: '/api/v1/catalog/companies-products',
  },
  /** مالية وذمم — نفس عقد المفوتر تقريباً */
  finance: {
    dashboard: '/api/v1/finance/dashboard',
    adjustments: '/api/v1/finance/adjustments',
    regions: '/api/v1/regions',
    pharmacies: '/api/v1/pharmacies',
    reps: '/api/v1/distribution/reps',
  },
  /** تقييم المندوب — محسوب من فواتير البيع */
  evaluation: {
    board: '/api/v1/supervisor/evaluation/board',
    sendReview: '/api/v1/supervisor/evaluation/review',
  },
  /** راتب ثابت ومكافآت — المشرف يحدد؛ المفوتر يحتسب */
  compensation: {
    board: '/api/v1/supervisor/compensation/board',
    fixedSalary: '/api/v1/supervisor/compensation/fixed-salary',
    suspendSalary: (repId: string) =>
      `/api/v1/supervisor/compensation/fixed-salary/${repId}/suspend`,
    bonuses: '/api/v1/supervisor/compensation/bonuses',
  },
  /** مستودع المشرف — قراءة فقط + ملاحظات (البيانات من المفوتر) */
  warehouse: {
    board: '/api/v1/supervisor/warehouse/board',
    notes: '/api/v1/supervisor/warehouse/notes',
  },
  /** إشعارات داخل اللوحة فقط */
  notifications: {
    feed: '/api/v1/supervisor/notifications',
    markRead: (id: string) =>
      `/api/v1/supervisor/notifications/${id}/read`,
    markAllRead: '/api/v1/supervisor/notifications/read-all',
  },
  /** مركز التقارير */
  reports: {
    board: '/api/v1/supervisor/reports/board',
    run: '/api/v1/supervisor/reports/run',
  },
  /** إعدادات المشرف والحسابات */
  settings: {
    board: '/api/v1/supervisor/settings/board',
    profile: '/api/v1/supervisor/settings/profile',
    password: '/api/v1/supervisor/settings/password',
    supervisors: '/api/v1/supervisor/settings/supervisors',
  },
} as const
