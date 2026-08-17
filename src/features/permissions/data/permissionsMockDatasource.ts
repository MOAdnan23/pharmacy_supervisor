import type { PermissionsMatrix } from '../domain/permissionEntities'
import type { PermissionsDatasource } from './permissionsDatasource'

/**
 * Matrix قراءة فقط — صلاحيات عامة مرتبطة بالدور (UC-15)
 * ليست صلاحيات قابلة للتعديل من الواجهة.
 */
const matrix: PermissionsMatrix = {
  roles: [
    {
      id: 'supervisor',
      label: 'مشرف',
      platform: 'لوحة تحكم المشرف (ويب)',
    },
    {
      id: 'invoicer',
      label: 'مفوتر',
      platform: 'تطبيق المفوتر (سطح مكتب)',
    },
    {
      id: 'rep',
      label: 'مندوب',
      platform: 'تطبيق المندوب',
    },
  ],
  permissions: [
    {
      id: 'login_own_app',
      label: 'الدخول لتطبيقه فقط',
      hint: 'كل دور يدخل منصته ولا يخلط مع المنصات الأخرى',
      access: { supervisor: 'yes', invoicer: 'yes', rep: 'yes' },
    },
    {
      id: 'manage_users',
      label: 'إدارة المستخدمين والمندوبين',
      hint: 'إنشاء / تعديل / إيقاف الحسابات',
      access: { supervisor: 'yes', invoicer: 'no', rep: 'no' },
    },
    {
      id: 'manage_targets',
      label: 'تحديد ومتابعة التارغت',
      access: { supervisor: 'yes', invoicer: 'no', rep: 'read' },
    },
    {
      id: 'commission_rates',
      label: 'نسب عمولة الشركات والأصناف',
      access: { supervisor: 'yes', invoicer: 'read', rep: 'no' },
    },
    {
      id: 'offers_plans',
      label: 'العروض وخطط العمل',
      access: { supervisor: 'yes', invoicer: 'no', rep: 'read' },
    },
    {
      id: 'evaluation_reports',
      label: 'التقييم والتقارير',
      access: { supervisor: 'yes', invoicer: 'read', rep: 'read' },
    },
    {
      id: 'warehouse_manage',
      label: 'إدارة الجرد والشركات والأصناف',
      access: { supervisor: 'no', invoicer: 'yes', rep: 'no' },
    },
    {
      id: 'warehouse_view',
      label: 'عرض شركات/أصناف المستودع',
      hint: 'المندوب بدون كميات رقمية',
      access: { supervisor: 'read', invoicer: 'yes', rep: 'read' },
    },
    {
      id: 'orders_invoices',
      label: 'مراجعة الطلبيات وإصدار الفواتير',
      access: { supervisor: 'no', invoicer: 'yes', rep: 'no' },
    },
    {
      id: 'create_orders',
      label: 'إنشاء طلبيات للصيدليات',
      access: { supervisor: 'no', invoicer: 'no', rep: 'yes' },
    },
    {
      id: 'collections',
      label: 'التحصيلات',
      access: { supervisor: 'read', invoicer: 'yes', rep: 'yes' },
    },
    {
      id: 'payroll',
      label: 'احتساب وصرف الرواتب/العمولات',
      access: { supervisor: 'no', invoicer: 'yes', rep: 'no' },
    },
    {
      id: 'salary_setup',
      label: 'إعداد الراتب الثابت والمكافآت',
      access: { supervisor: 'yes', invoicer: 'read', rep: 'no' },
    },
    {
      id: 'distribute_pharmacies',
      label: 'توزيع المناطق والصيدليات على المندوبين',
      access: { supervisor: 'no', invoicer: 'yes', rep: 'no' },
    },
  ],
  notes: [
    'الصلاحيات الأساسية مرتبطة بالدور — هذا التبويب للعرض فقط.',
    'حساب المشرف يدخل لوحة التحكم فقط، المفوتر لتطبيق المفوتر، والمندوب لتطبيق المندوب.',
  ],
}

export const permissionsMockDatasource: PermissionsDatasource = {
  async getMatrix() {
    await delay(180)
    return matrix
  },
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
