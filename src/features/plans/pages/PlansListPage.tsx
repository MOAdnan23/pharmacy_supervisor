/**
 * UC-97/100/105/112 — شاشة خطط العمل (حالية / واردة / أرشيف)
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPlansDatasource } from '../data'
import type { PlansBoard, PlanStatus, WorkPlan } from '../domain/planEntities'
import {
  planSourceLabel,
  planStatusLabel,
  planStatusTone,
} from '../domain/planLabels'
import './plans.css'

type TabId = 'current' | 'incoming' | 'archive'

function ProgressCell({ value }: { value: number }) {
  return (
    <div className="plans-progress">
      <strong>{value}%</strong>
      <div className="plans-progress-track">
        <div className="plans-progress-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function PlansListPage() {
  const navigate = useNavigate()
  const datasource = useMemo(() => getPlansDatasource(), [])

  const [board, setBoard] = useState<PlansBoard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<TabId>('current')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | PlanStatus>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'supervisor' | 'rep'>(
    'all',
  )

  async function reload() {
    setBoard(await datasource.getBoard())
  }

  useEffect(() => {
    let alive = true
    datasource
      .getBoard()
      .then((next) => {
        if (alive) setBoard(next)
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'تعذّر تحميل الخطط')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [datasource])

  const filtered = useMemo(() => {
    if (!board) return []
    const q = query.trim().toLowerCase()
    return board.plans.filter((p) => {
      if (tab === 'incoming') {
        if (!(p.source === 'rep' && p.status === 'pending_approval')) return false
      } else if (tab === 'archive') {
        if (p.status !== 'archived') return false
      } else if (p.status === 'archived' || p.status === 'pending_approval') {
        return false
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (sourceFilter !== 'all' && p.source !== sourceFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.regionLabel.toLowerCase().includes(q) ||
        p.repNames.some((n) => n.toLowerCase().includes(q))
      )
    })
  }, [board, tab, query, statusFilter, sourceFilter])

  async function archive(plan: WorkPlan) {
    setBusy(true)
    setError(null)
    try {
      await datasource.archivePlan(plan.id)
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل الأرشفة')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="plans-status">جاري تحميل خطط العمل...</p>
  if (!board) {
    return <p className="plans-status error">{error ?? 'لا بيانات'}</p>
  }

  const { summary } = board
  const incomingCount = summary.incoming

  return (
    <div className="plans">
      <header className="plans-hero">
        <div>
          <h1>خطط العمل</h1>
          <p>
            أنشئ خططاً من المشرف، أو اعتمد خططاً واردة من المندوبين ثم راقب
            التنفيذ والتقدم والتقييم
          </p>
        </div>
        <div className="plans-hero-actions">
          <button
            type="button"
            className="plans-btn"
            onClick={() => navigate('/plans/new')}
          >
            إنشاء خطة
          </button>
        </div>
      </header>

      {error ? <div className="plans-banner">{error}</div> : null}

      <section className="plans-kpis">
        <article className="plans-kpi">
          <span>إجمالي النشطة</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="plans-kpi">
          <span>قيد التنفيذ</span>
          <strong>{summary.inProgress}</strong>
        </article>
        <article className="plans-kpi">
          <span>متأخرة / مكتملة</span>
          <strong>
            {summary.delayed} / {summary.completed}
          </strong>
        </article>
        <article className="plans-kpi">
          <span>متوسط الإنجاز · واردة</span>
          <strong>
            {summary.avgProgress}% · {summary.incoming}
          </strong>
        </article>
      </section>

      <div className="plans-tabs">
        <button
          type="button"
          className={tab === 'current' ? 'active' : ''}
          onClick={() => setTab('current')}
        >
          الخطط الحالية
        </button>
        <button
          type="button"
          className={tab === 'incoming' ? 'active' : ''}
          onClick={() => setTab('incoming')}
        >
          واردة من المندوبين
          <span className="count">({incomingCount})</span>
        </button>
        <button
          type="button"
          className={tab === 'archive' ? 'active' : ''}
          onClick={() => setTab('archive')}
        >
          الأرشيف
        </button>
      </div>

      <div className="plans-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث بالاسم / المندوب / المنطقة"
        />
        {tab === 'current' ? (
          <>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | PlanStatus)
              }
            >
              <option value="all">كل الحالات</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="completed">مكتملة</option>
              <option value="delayed">متأخرة</option>
              <option value="draft">مسودة</option>
              <option value="approved">معتمدة</option>
              <option value="rejected">مرفوضة</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(
                  e.target.value as 'all' | 'supervisor' | 'rep',
                )
              }
            >
              <option value="all">كل المصادر</option>
              <option value="supervisor">المشرف</option>
              <option value="rep">المندوب</option>
            </select>
          </>
        ) : null}
      </div>

      <div className="plans-table-card">
        <table>
          <thead>
            <tr>
              <th>الخطة</th>
              <th>المصدر</th>
              <th>المندوب/ون</th>
              <th>المنطقة</th>
              <th>الفترة</th>
              <th>الإنجاز</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="plans-empty">
                  لا توجد خطط في هذا التبويب
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <div className="plans-sub">{p.description || '—'}</div>
                  </td>
                  <td>{planSourceLabel(p.source)}</td>
                  <td>{p.repNames.join('، ')}</td>
                  <td>{p.regionLabel}</td>
                  <td>
                    {p.startDate} → {p.endDate}
                  </td>
                  <td>
                    <ProgressCell value={p.progressPercent} />
                  </td>
                  <td>
                    <span className={`badge ${planStatusTone(p.status)}`}>
                      {planStatusLabel(p.status)}
                    </span>
                  </td>
                  <td>
                    <div className="plans-actions">
                      <button
                        type="button"
                        onClick={() => navigate(`/plans/${p.id}`)}
                      >
                        {tab === 'incoming' ? 'مراجعة' : 'تفاصيل'}
                      </button>
                      {tab === 'current' && p.source === 'supervisor' ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/plans/${p.id}/edit`)}
                        >
                          تعديل
                        </button>
                      ) : null}
                      {tab === 'current' &&
                      (p.status === 'completed' ||
                        p.status === 'rejected' ||
                        p.status === 'delayed') ? (
                        <button
                          type="button"
                          className="danger"
                          disabled={busy}
                          onClick={() => archive(p)}
                        >
                          أرشفة
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {tab === 'incoming' ? (
        <p className="plans-sub" style={{ marginTop: 12 }}>
          بعد الاعتماد تنتقل الخطة إلى «الخطط الحالية» ويمكنك مراقبة تنفيذها.
        </p>
      ) : null}

      <p className="plans-sub" style={{ marginTop: 8 }}>
        <Link to="/plans/new">إنشاء خطة جديدة من المشرف</Link>
      </p>
    </div>
  )
}
