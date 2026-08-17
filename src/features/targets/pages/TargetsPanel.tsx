/**
 * تبويب التارغت — UC-16 → UC-19
 * تارغت المندوب = شركات متعددة + نسب + مجموع
 */
import { Fragment, useEffect, useMemo, useState, type FormEvent } from 'react'
import { getTargetsDatasource } from '../data'
import type {
  CompanyTarget,
  CompanyTargetStatus,
  RepTarget,
  RepTargetStatus,
  TargetsBoard,
} from '../domain/targetEntities'
import './targets.css'

type Props = {
  onRepTargetsChanged?: () => void
}

type Dialog =
  | { kind: 'rep'; seed?: RepTarget }
  | { kind: 'company'; seed?: CompanyTarget }
  | null

type RepLineForm = {
  companyName: string
  target: string
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function percent(achieved: number, target: number): string {
  if (target <= 0) return '—'
  return `${Math.round((achieved / target) * 100)}%`
}

function repStatusLabel(status: RepTargetStatus): string {
  if (status === 'achieved') return 'محقق'
  if (status === 'in_progress') return 'قيد التنفيذ'
  return 'غير محقق'
}

function companyStatusLabel(status: CompanyTargetStatus): string {
  if (status === 'active') return 'نشط'
  if (status === 'suspended') return 'موقوف'
  return 'مؤرشف'
}

function emptyLine(defaultCompany = ''): RepLineForm {
  return { companyName: defaultCompany, target: '' }
}

export function TargetsPanel({ onRepTargetsChanged }: Props) {
  const datasource = useMemo(() => getTargetsDatasource(), [])

  const [board, setBoard] = useState<TargetsBoard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [repForm, setRepForm] = useState({
    repId: '',
    month: currentMonth(),
    lines: [emptyLine()] as RepLineForm[],
  })

  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    amount: '',
    startDate: '',
    endDate: '',
  })

  async function reload() {
    const next = await datasource.getBoard()
    setBoard(next)
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
          setError(err instanceof Error ? err.message : 'تعذّر تحميل التارغت')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [datasource])

  function companiesForRep(repId: string): string[] {
    return (
      board?.repOptions.find((r) => r.id === repId)?.companies ?? []
    )
  }

  function openRep(seed?: RepTarget) {
    setFormError(null)
    const repId = seed?.repId ?? board?.repOptions[0]?.id ?? ''
    const companies = companiesForRep(repId)
    setRepForm({
      repId,
      month: seed?.month ?? currentMonth(),
      lines: seed
        ? seed.lines.map((l) => ({
            companyName: l.companyName,
            target: String(l.target),
          }))
        : [emptyLine(companies[0] ?? '')],
    })
    setDialog({ kind: 'rep', seed })
  }

  function changeRep(repId: string) {
    const companies = companiesForRep(repId)
    setRepForm((f) => ({
      ...f,
      repId,
      lines: [emptyLine(companies[0] ?? '')],
    }))
  }

  function openCompany(seed?: CompanyTarget) {
    setFormError(null)
    setCompanyForm({
      companyName: seed?.companyName ?? board?.companyOptions[0] ?? '',
      amount: seed ? String(seed.amount) : '',
      startDate: seed?.startDate ?? '',
      endDate: seed?.endDate ?? '',
    })
    setDialog({ kind: 'company', seed })
  }

  function updateLine(index: number, patch: Partial<RepLineForm>) {
    setRepForm((f) => ({
      ...f,
      lines: f.lines.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }))
  }

  function unusedCompaniesForForm(): string[] {
    const all = companiesForRep(repForm.repId)
    return all.filter(
      (name) =>
        !repForm.lines.some(
          (l) => l.companyName.trim().toLowerCase() === name.toLowerCase(),
        ),
    )
  }

  function addLine() {
    const unused = unusedCompaniesForForm()
    if (unused.length === 0) {
      setFormError('لا توجد شركات إضافية مرتبطة بهذا المندوب')
      return
    }
    setFormError(null)
    setRepForm((f) => ({ ...f, lines: [...f.lines, emptyLine(unused[0])] }))
  }

  function removeLine(index: number) {
    setRepForm((f) => ({
      ...f,
      lines: f.lines.length <= 1 ? f.lines : f.lines.filter((_, i) => i !== index),
    }))
  }

  function optionsForLine(index: number): string[] {
    const all = companiesForRep(repForm.repId)
    const current = repForm.lines[index]?.companyName
    return all.filter(
      (name) =>
        name === current ||
        !repForm.lines.some(
          (l, i) =>
            i !== index &&
            l.companyName.trim().toLowerCase() === name.toLowerCase(),
        ),
    )
  }

  const linesTotal = useMemo(() => {
    return repForm.lines.reduce((sum, line) => {
      const n = Number(line.target)
      return sum + (Number.isFinite(n) && n > 0 ? n : 0)
    }, 0)
  }, [repForm.lines])

  async function submitRep(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setFormError(null)
    try {
      await datasource.setRepTarget({
        repId: repForm.repId,
        month: repForm.month,
        lines: repForm.lines.map((l) => ({
          companyName: l.companyName,
          target: Number(l.target),
        })),
      })
      await reload()
      onRepTargetsChanged?.()
      setDialog(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'فشل الحفظ')
    } finally {
      setBusy(false)
    }
  }

  async function submitCompany(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setFormError(null)
    try {
      await datasource.upsertCompanyTarget({
        id: dialog?.kind === 'company' ? dialog.seed?.id : undefined,
        companyName: companyForm.companyName,
        amount: Number(companyForm.amount),
        startDate: companyForm.startDate,
        endDate: companyForm.endDate,
      })
      await reload()
      setDialog(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'فشل الحفظ')
    } finally {
      setBusy(false)
    }
  }

  async function changeCompanyStatus(
    target: CompanyTarget,
    status: CompanyTargetStatus,
  ) {
    const labels: Record<CompanyTargetStatus, string> = {
      active: 'تفعيل',
      suspended: 'إيقاف',
      archived: 'أرشفة',
    }
    const ok = window.confirm(
      `${labels[status]} تارغت «${target.companyName}»؟`,
    )
    if (!ok) return
    setBusy(true)
    try {
      await datasource.setCompanyTargetStatus(target.id, status)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تغيير الحالة')
    } finally {
      setBusy(false)
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (loading) {
    return <p className="users-note">جاري تحميل التارغت...</p>
  }

  if (!board) {
    return <p className="users-note">{error ?? 'لا توجد بيانات تارغت'}</p>
  }

  return (
    <div className="targets">
      {error && <p className="users-banner error">{error}</p>}

      <section className="targets-block">
        <div className="targets-block-head">
          <div>
            <h2>تارغت المندوبين حسب الشركة</h2>
            <p>
              لكل مندوب: شركات متعددة + نسبة كل شركة + المجموع (شهري فقط)
            </p>
          </div>
          <button type="button" className="users-cta" onClick={() => openRep()}>
            تحديد تارغت مندوب
          </button>
        </div>

        <div className="users-table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>المندوب</th>
                <th>الشهر</th>
                <th>الشركات</th>
                <th>المجموع</th>
                <th>المحقق</th>
                <th>نسبة المجموع</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {board.repTargets.length === 0 && (
                <tr>
                  <td colSpan={9}>لا توجد تارغتات مندوبين بعد</td>
                </tr>
              )}
              {board.repTargets.map((row) => {
                const open = expanded[row.id] ?? true
                return (
                  <Fragment key={row.id}>
                    <tr>
                      <td>
                        <button
                          type="button"
                          className="expand-btn"
                          onClick={() => toggleExpand(row.id)}
                          aria-label="عرض الشركات"
                        >
                          {open ? '▾' : '◂'}
                        </button>
                      </td>
                      <td>{row.repName}</td>
                      <td>{row.month}</td>
                      <td>{row.lines.length}</td>
                      <td>{row.monthlyTarget.toLocaleString('ar-SY')}</td>
                      <td>{row.achieved.toLocaleString('ar-SY')}</td>
                      <td>{percent(row.achieved, row.monthlyTarget)}</td>
                      <td>
                        <span className={`badge ${repBadgeClass(row.status)}`}>
                          {repStatusLabel(row.status)}
                        </span>
                      </td>
                      <td className="actions">
                        <button type="button" onClick={() => openRep(row)}>
                          تعديل
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="targets-detail-row">
                        <td colSpan={9}>
                          <table className="targets-inner-table">
                            <thead>
                              <tr>
                                <th>الشركة</th>
                                <th>التارغت</th>
                                <th>المحقق</th>
                                <th>نسبة التحقيق</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.lines.map((line) => (
                                <tr key={`${row.id}-${line.companyName}`}>
                                  <td>{line.companyName}</td>
                                  <td>{line.target.toLocaleString('ar-SY')}</td>
                                  <td>
                                    {line.achieved.toLocaleString('ar-SY')}
                                  </td>
                                  <td>
                                    {percent(line.achieved, line.target)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="targets-total-row">
                                <td>المجموع</td>
                                <td>
                                  {row.monthlyTarget.toLocaleString('ar-SY')}
                                </td>
                                <td>
                                  {row.achieved.toLocaleString('ar-SY')}
                                </td>
                                <td>
                                  {percent(row.achieved, row.monthlyTarget)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="targets-block">
        <div className="targets-block-head">
          <div>
            <h2>تارغت الشركات العام (شهري)</h2>
            <p>تحديد وعرض وتعديل وإيقاف وأرشفة التارغت</p>
          </div>
          <button
            type="button"
            className="users-cta"
            onClick={() => openCompany()}
          >
            تحديد تارغت شركة
          </button>
        </div>

        <div className="users-table-wrap">
          <table>
            <thead>
              <tr>
                <th>الشركة</th>
                <th>التارغت</th>
                <th>من</th>
                <th>إلى</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {board.companyTargets.length === 0 && (
                <tr>
                  <td colSpan={6}>لا توجد تارغتات شركات بعد</td>
                </tr>
              )}
              {board.companyTargets.map((row) => (
                <tr key={row.id}>
                  <td>{row.companyName}</td>
                  <td>{row.amount.toLocaleString('ar-SY')}</td>
                  <td>{row.startDate}</td>
                  <td>{row.endDate}</td>
                  <td>
                    <span className={`badge ${companyBadgeClass(row.status)}`}>
                      {companyStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className="actions">
                    <button type="button" onClick={() => openCompany(row)}>
                      تعديل
                    </button>
                    {row.status !== 'active' && (
                      <button
                        type="button"
                        onClick={() => changeCompanyStatus(row, 'active')}
                      >
                        تفعيل
                      </button>
                    )}
                    {row.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => changeCompanyStatus(row, 'suspended')}
                      >
                        إيقاف
                      </button>
                    )}
                    {row.status !== 'archived' && (
                      <button
                        type="button"
                        className="danger"
                        onClick={() => changeCompanyStatus(row, 'archived')}
                      >
                        أرشفة
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {dialog?.kind === 'rep' && (
        <div className="modal-backdrop">
          <form className="modal modal-wide" onSubmit={submitRep}>
            <h3>
              {dialog.seed ? 'تعديل تارغت مندوب' : 'تحديد تارغت مندوب'}
            </h3>
            <p className="users-note" style={{ margin: 0 }}>
              الشركات تظهر فقط من قائمة شركات المندوب المرتبطة به — لا يمكن إضافة
              شركة غير مرتبطة.
            </p>
            <label>
              المندوب
              <select
                value={repForm.repId}
                onChange={(e) => changeRep(e.target.value)}
                required
                disabled={Boolean(dialog.seed)}
              >
                {board.repOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              الشهر
              <input
                type="month"
                value={repForm.month}
                onChange={(e) =>
                  setRepForm((f) => ({ ...f, month: e.target.value }))
                }
                required
              />
            </label>

            <div className="rep-lines-head">
              <strong>تارغت كل شركة</strong>
              <button
                type="button"
                className="ghost-mini"
                onClick={addLine}
                disabled={unusedCompaniesForForm().length === 0}
              >
                + إضافة شركة
              </button>
            </div>

            {companiesForRep(repForm.repId).length === 0 && (
              <p className="users-banner error">
                لا توجد شركات مرتبطة بهذا المندوب.
              </p>
            )}

            <div className="rep-lines">
              {repForm.lines.map((line, index) => (
                <div key={index} className="rep-line-row">
                  <label>
                    الشركة
                    <select
                      value={line.companyName}
                      onChange={(e) =>
                        updateLine(index, { companyName: e.target.value })
                      }
                      required
                    >
                      <option value="" disabled>
                        اختر شركة
                      </option>
                      {optionsForLine(index).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    التارغت
                    <input
                      type="number"
                      min={1}
                      value={line.target}
                      onChange={(e) =>
                        updateLine(index, { target: e.target.value })
                      }
                      required
                    />
                  </label>
                  <button
                    type="button"
                    className="danger-mini"
                    onClick={() => removeLine(index)}
                    disabled={repForm.lines.length <= 1}
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>

            <p className="lines-total">
              مجموع التارغت:{' '}
              <strong>{linesTotal.toLocaleString('ar-SY')}</strong>
            </p>

            {formError && <p className="users-banner error">{formError}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => setDialog(null)}
                disabled={busy}
              >
                إلغاء
              </button>
              <button type="submit" disabled={busy}>
                {busy ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {dialog?.kind === 'company' && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={submitCompany}>
            <h3>
              {dialog.seed ? 'تعديل تارغت شركة' : 'تحديد تارغت شركة'}
            </h3>
            <label>
              الشركة
              <input
                list="company-options"
                value={companyForm.companyName}
                onChange={(e) =>
                  setCompanyForm((f) => ({
                    ...f,
                    companyName: e.target.value,
                  }))
                }
                required
              />
              <datalist id="company-options">
                {board.companyOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>
            <label>
              قيمة التارغت الشهري
              <input
                type="number"
                min={1}
                value={companyForm.amount}
                onChange={(e) =>
                  setCompanyForm((f) => ({ ...f, amount: e.target.value }))
                }
                required
              />
            </label>
            <label>
              تاريخ البداية
              <input
                type="date"
                value={companyForm.startDate}
                onChange={(e) =>
                  setCompanyForm((f) => ({ ...f, startDate: e.target.value }))
                }
                required
              />
            </label>
            <label>
              تاريخ النهاية
              <input
                type="date"
                value={companyForm.endDate}
                onChange={(e) =>
                  setCompanyForm((f) => ({ ...f, endDate: e.target.value }))
                }
                required
              />
            </label>
            {formError && <p className="users-banner error">{formError}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => setDialog(null)}
                disabled={busy}
              >
                إلغاء
              </button>
              <button type="submit" disabled={busy}>
                {busy ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {busy && <p className="users-note">جاري تنفيذ العملية...</p>}
    </div>
  )
}

function repBadgeClass(status: RepTargetStatus): string {
  if (status === 'achieved') return 'ok'
  if (status === 'in_progress') return 'warn'
  return 'stop'
}

function companyBadgeClass(status: CompanyTargetStatus): string {
  if (status === 'active') return 'ok'
  if (status === 'suspended') return 'stop'
  return 'muted'
}
