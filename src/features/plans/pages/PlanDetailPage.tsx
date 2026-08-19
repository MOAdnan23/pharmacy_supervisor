/**
 * UC-105→110 — تفاصيل / اعتماد واردة / متابعة / ملاحظات / تقييم
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPlansDatasource } from '../data'
import type {
  EvaluationLevel,
  WorkPlan,
} from '../domain/planEntities'
import {
  evaluationLabel,
  goalProgress,
  planSourceLabel,
  planStatusLabel,
  planStatusTone,
} from '../domain/planLabels'
import { PlanExecutionPanel } from './PlanExecutionPanel'
import './plans.css'

type DetailTab = 'overview' | 'execution' | 'notes' | 'evaluation'

export function PlanDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const datasource = useMemo(() => getPlansDatasource(), [])

  const [plan, setPlan] = useState<WorkPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<DetailTab>('overview')
  const [noteText, setNoteText] = useState('')
  const [evalLevel, setEvalLevel] = useState<EvaluationLevel>('good')
  const [evalNote, setEvalNote] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [execRepFilter, setExecRepFilter] = useState<'all' | string>('all')

  async function reload() {
    if (!id) return
    setPlan(await datasource.getById(id))
  }

  useEffect(() => {
    if (!id) return
    let alive = true
    datasource
      .getById(id)
      .then((p) => {
        if (!alive) return
        setPlan(p)
        if (p.evaluationLevel) setEvalLevel(p.evaluationLevel)
        if (p.evaluationNote) setEvalNote(p.evaluationNote)
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'تعذّر التحميل')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [datasource, id])

  const isIncoming =
    plan?.source === 'rep' && plan.status === 'pending_approval'

  async function review(action: 'approve' | 'request_changes' | 'reject') {
    if (!plan) return
    setBusy(true)
    setError(null)
    try {
      await datasource.reviewIncoming({
        id: plan.id,
        action,
        note: reviewNote,
        rejectReason: action === 'reject' ? rejectReason : undefined,
      })
      setRejectOpen(false)
      setReviewNote('')
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل المراجعة')
    } finally {
      setBusy(false)
    }
  }

  async function submitNote(e: FormEvent) {
    e.preventDefault()
    if (!plan) return
    setBusy(true)
    setError(null)
    try {
      await datasource.addNote(plan.id, noteText)
      setNoteText('')
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل حفظ الملاحظة')
    } finally {
      setBusy(false)
    }
  }

  async function submitEval(e: FormEvent) {
    e.preventDefault()
    if (!plan) return
    setBusy(true)
    setError(null)
    try {
      await datasource.saveEvaluation({
        id: plan.id,
        level: evalLevel,
        note: evalNote,
      })
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل حفظ التقييم')
    } finally {
      setBusy(false)
    }
  }

  async function archive() {
    if (!plan) return
    setBusy(true)
    setError(null)
    try {
      await datasource.archivePlan(plan.id)
      navigate('/plans')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل الأرشفة')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="plans-status">جاري التحميل...</p>
  if (!plan) {
    return <p className="plans-status error">{error ?? 'الخطة غير موجودة'}</p>
  }

  return (
    <div className="plans">
      <header className="plans-hero">
        <div>
          <h1>{plan.name}</h1>
          <p>
            {plan.description || '—'} · المصدر: {planSourceLabel(plan.source)} ·{' '}
            <span className={`badge ${planStatusTone(plan.status)}`}>
              {planStatusLabel(plan.status)}
            </span>
          </p>
        </div>
        <div className="plans-hero-actions">
          <Link className="plans-btn-ghost" to="/plans">
            القائمة
          </Link>
          {plan.source === 'supervisor' && plan.status !== 'archived' ? (
            <button
              type="button"
              className="plans-btn-ghost"
              onClick={() => navigate(`/plans/${plan.id}/edit`)}
            >
              تعديل
            </button>
          ) : null}
        </div>
      </header>

      {error ? <div className="plans-banner">{error}</div> : null}

      {isIncoming ? (
        <section className="plans-panel">
          <h3>مراجعة خطة واردة من المندوب</h3>
          <p className="plans-sub">
            مقدَّمة من: {plan.submittedByRepName ?? plan.repNames.join('، ')}
          </p>
          <label>
            ملاحظة للرد (اختياري)
            <textarea
              rows={2}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              style={{ width: '100%', marginTop: 6 }}
            />
          </label>
          <div className="plans-footer-actions">
            <button
              type="button"
              className="plans-actions"
              disabled={busy}
              onClick={() => setRejectOpen(true)}
              style={{ border: 0, background: 'transparent', padding: 0 }}
            >
              <span className="plans-btn-ghost" style={{ display: 'inline-flex' }}>
                رفض
              </span>
            </button>
            <button
              type="button"
              className="plans-btn-ghost"
              disabled={busy}
              onClick={() => review('request_changes')}
            >
              إعادة للتعديل
            </button>
            <button
              type="button"
              className="plans-btn"
              disabled={busy}
              onClick={() => review('approve')}
            >
              اعتماد ومراقبة
            </button>
          </div>
        </section>
      ) : null}

      <div className="plans-kpis">
        <article className="plans-kpi">
          <span>نسبة الإنجاز</span>
          <strong>{plan.progressPercent}%</strong>
        </article>
        <article className="plans-kpi">
          <span>المندوبون</span>
          <strong style={{ fontSize: '1rem' }}>
            {plan.repNames.join('، ')}
          </strong>
        </article>
        <article className="plans-kpi">
          <span>المنطقة</span>
          <strong style={{ fontSize: '1rem' }}>{plan.regionLabel}</strong>
        </article>
        <article className="plans-kpi">
          <span>الفترة</span>
          <strong style={{ fontSize: '0.95rem' }}>
            {plan.startDate} → {plan.endDate}
          </strong>
        </article>
      </div>

      <div className="plans-tabs">
        <button
          type="button"
          className={tab === 'overview' ? 'active' : ''}
          onClick={() => setTab('overview')}
        >
          الأهداف
        </button>
        <button
          type="button"
          className={tab === 'execution' ? 'active' : ''}
          onClick={() => setTab('execution')}
        >
          متابعة التنفيذ
        </button>
        <button
          type="button"
          className={tab === 'notes' ? 'active' : ''}
          onClick={() => setTab('notes')}
        >
          الملاحظات
        </button>
        <button
          type="button"
          className={tab === 'evaluation' ? 'active' : ''}
          onClick={() => setTab('evaluation')}
        >
          التقييم
        </button>
      </div>

      {tab === 'overview' ? (
        <div className="plans-table-card">
          <table>
            <thead>
              <tr>
                <th>الهدف</th>
                <th>المطلوب</th>
                <th>المنجز</th>
                <th>الإنجاز</th>
                <th>ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {plan.goals.map((g) => {
                const pct = goalProgress(g.achievedValue, g.targetValue)
                return (
                  <tr key={g.id}>
                    <td>{g.label}</td>
                    <td>
                      {g.targetValue.toLocaleString('ar-SY')} {g.unit}
                    </td>
                    <td>
                      {g.achievedValue.toLocaleString('ar-SY')} {g.unit}
                    </td>
                    <td>
                      <div className="plans-progress">
                        <strong>{pct}%</strong>
                        <div className="plans-progress-track">
                          <div
                            className="plans-progress-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>{g.note || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'execution' ? (
        <section className="plans-panel plans-panel-exec">
          <div className="plans-detail-head">
            <div>
              <h3>متابعة التنفيذ</h3>
              <p className="plans-sub" style={{ margin: 0 }}>
                جداول تفصيلية حسب نوع الهدف: زيارات · مبيعات · تحصيل · صيدليات
              </p>
            </div>
            {plan.repIds.length > 1 ? (
              <select
                value={execRepFilter}
                onChange={(e) => setExecRepFilter(e.target.value)}
              >
                <option value="all">كل المندوبين</option>
                {plan.repIds.map((rid, i) => (
                  <option key={rid} value={rid}>
                    {plan.repNames[i]}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <PlanExecutionPanel plan={plan} repFilter={execRepFilter} />
        </section>
      ) : null}

      {tab === 'notes' ? (
        <section className="plans-panel">
          <h3>ملاحظات الخطة</h3>
          <div className="plans-note-thread">
            {plan.notes.length === 0 ? (
              <p className="plans-sub">لا ملاحظات بعد</p>
            ) : (
              plan.notes.map((n) => (
                <article
                  key={n.id}
                  className={`plans-note ${n.authorRole}`}
                >
                  <header>
                    <strong>{n.authorName}</strong>
                    <span>
                      {n.kind === 'evaluation'
                        ? 'تقييم'
                        : n.kind === 'evaluation_reply'
                          ? 'رد على التقييم'
                          : n.authorRole === 'rep'
                            ? 'مندوب'
                            : 'مشرف'}{' '}
                      · {new Date(n.createdAt).toLocaleString('ar-SY')}
                    </span>
                  </header>
                  <div>{n.text}</div>
                </article>
              ))
            )}
          </div>
          <form onSubmit={submitNote} style={{ marginTop: 14 }}>
            <label>
              ملاحظة جديدة من المشرف
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{ width: '100%', marginTop: 6 }}
                required
              />
            </label>
            <div className="plans-footer-actions">
              <button type="submit" className="plans-btn" disabled={busy}>
                حفظ الملاحظة
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {tab === 'evaluation' ? (
        <section className="plans-panel">
          <h3>تقييم نتائج الخطة</h3>
          {plan.evaluationLevel ? (
            <p className="plans-sub">
              التقييم الحالي:{' '}
              <strong>{evaluationLabel(plan.evaluationLevel)}</strong>
              {plan.evaluationNote ? ` — ${plan.evaluationNote}` : ''}
            </p>
          ) : null}

          {(() => {
            const list = plan.notes.filter(
              (n) =>
                n.kind === 'evaluation_reply' ||
                (n.authorRole === 'rep' && n.id.startsWith('plan-reply')),
            )
            if (!list.length) {
              return (
                <p className="plans-sub" style={{ marginTop: 8 }}>
                  لا يوجد رد من المندوب على التقييم بعد.
                </p>
              )
            }
            return (
              <div className="plans-note-thread" style={{ marginTop: 12 }}>
                <h4 style={{ margin: '0 0 8px' }}>رد المندوب على التقييم</h4>
                {list.map((n) => (
                  <article key={n.id} className="plans-note rep">
                    <header>
                      <strong>{n.authorName}</strong>
                      <span>
                        {new Date(n.createdAt).toLocaleString('ar-SY')}
                      </span>
                    </header>
                    <div>{n.text}</div>
                  </article>
                ))}
              </div>
            )
          })()}

          <form onSubmit={submitEval} className="plans-form-grid">
            <label>
              مستوى التقييم
              <select
                value={evalLevel}
                onChange={(e) =>
                  setEvalLevel(e.target.value as EvaluationLevel)
                }
              >
                <option value="excellent">ممتاز</option>
                <option value="very_good">جيد جداً</option>
                <option value="good">جيد</option>
                <option value="needs_followup">يحتاج متابعة</option>
              </select>
            </label>
            <label className="full">
              ملاحظات التقييم
              <textarea
                rows={3}
                value={evalNote}
                onChange={(e) => setEvalNote(e.target.value)}
              />
            </label>
            <div className="plans-footer-actions full">
              <button type="submit" className="plans-btn" disabled={busy}>
                حفظ التقييم
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {(plan.status === 'completed' ||
        plan.status === 'rejected' ||
        plan.status === 'delayed') ? (
        <div className="plans-footer-actions">
          <button
            type="button"
            className="plans-btn-ghost"
            disabled={busy}
            onClick={archive}
          >
            أرشفة الخطة
          </button>
        </div>
      ) : null}

      {rejectOpen ? (
        <div className="modal-backdrop">
          <form
            className="modal"
            onSubmit={(e) => {
              e.preventDefault()
              void review('reject')
            }}
          >
            <h3>رفض الخطة الواردة</h3>
            <label>
              سبب الرفض *
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => setRejectOpen(false)}
              >
                إلغاء
              </button>
              <button type="submit" disabled={busy}>
                تأكيد الرفض
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
