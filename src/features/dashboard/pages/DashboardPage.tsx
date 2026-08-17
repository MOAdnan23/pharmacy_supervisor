/**
 * لوحة التحكم — ملخص مؤشرات من أقسام النظام
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardDatasource } from '../data'
import type { DashboardOverview } from '../domain/dashboard'
import './dashboard.css'

const KPI_LINKS: Record<string, string> = {
  'إجمالي المبيعات': '/finance',
  التحصيلات: '/finance',
  'إجمالي الذمم': '/finance',
  'صيدليات نشطة': '/finance',
  'مناديب فاعلين': '/users',
  'خطط العمل': '/plans',
  'أصناف حرجة': '/warehouse?tab=low',
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const datasource = getDashboardDatasource()

    datasource
      .getOverview()
      .then((overview) => {
        if (!alive) return
        setData(overview)
      })
      .catch((err: unknown) => {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'تعذّر تحميل اللوحة')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return <p className="dash-status">جاري تحميل لوحة التحكم...</p>
  }

  if (error || !data) {
    return <p className="dash-status error">{error ?? 'لا توجد بيانات'}</p>
  }

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <h1>نظرة عامة على الأداء</h1>
          <p>
            المؤشرات تُجمَّع من المالية والمستودع وخطط العمل والمناديب — اضغط أي
            بطاقة للانتقال للتفاصيل.
          </p>
        </div>
      </header>

      <section className="kpi-grid">
        {data.kpis.map((kpi) => {
          const to = KPI_LINKS[kpi.label]
          const inner = (
            <>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <small>{kpi.hint}</small>
            </>
          )
          return to ? (
            <Link
              key={kpi.label}
              to={to}
              className={`kpi-card ${kpi.tone}`}
            >
              {inner}
            </Link>
          ) : (
            <article key={kpi.label} className={`kpi-card ${kpi.tone}`}>
              {inner}
            </article>
          )
        })}
      </section>

      <section className="dash-panels">
        <article className="panel">
          <h3>إجراءات سريعة</h3>
          <div className="quick-actions">
            <Link to="/plans/new">إضافة خطة</Link>
            <Link to="/offers/new">إنشاء عرض</Link>
            <Link to="/compensation">الرواتب</Link>
            <Link to="/reports">التقارير</Link>
          </div>
        </article>

        <article className="panel">
          <h3>آخر التنبيهات</h3>
          <ul className="alerts">
            {data.alerts.map((alert) => (
              <li key={alert.id} className={`alert ${alert.tone}`}>
                {alert.message}
              </li>
            ))}
          </ul>
          <Link className="dash-more" to="/notifications">
            فتح مركز الإشعارات
          </Link>
        </article>
      </section>
    </div>
  )
}
