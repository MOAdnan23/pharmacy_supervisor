/**
 * إدارة المناطق الجغرافية — بيانات أساسية يعتمد عليها المفوتر عند إنشاء صيدلية
 * والمندوب عند التوزيع لاحقاً.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getRegionsDatasource } from '../data'
import type {
  MainRegion,
  RegionStatus,
  RegionsOverview,
  SubRegion,
} from '../domain/regionEntities'
import './regions.css'

type Dialog =
  | { kind: 'main'; seed?: MainRegion }
  | { kind: 'sub'; mainRegionId: string; mainName: string; seed?: SubRegion }
  | null

function statusLabel(status: RegionStatus): string {
  return status === 'active' ? 'فعّالة' : 'غير فعّالة'
}

export function RegionsPage() {
  const datasource = useMemo(() => getRegionsDatasource(), [])

  const [data, setData] = useState<RegionsOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [dialog, setDialog] = useState<Dialog>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<RegionStatus>('active')

  async function reload() {
    const next = await datasource.getOverview()
    setData(next)
  }

  useEffect(() => {
    let alive = true
    datasource
      .getOverview()
      .then((overview) => {
        if (alive) setData(overview)
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'تعذّر تحميل المناطق')
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
    if (!data) return []
    const q = query.trim().toLowerCase()
    if (!q) return data.regions
    return data.regions.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.subRegions.some((s) => s.name.toLowerCase().includes(q)),
    )
  }, [data, query])

  function openMain(seed?: MainRegion) {
    setFormError(null)
    setName(seed?.name ?? '')
    setStatus(seed?.status ?? 'active')
    setDialog({ kind: 'main', seed })
  }

  function openSub(
    mainRegionId: string,
    mainName: string,
    seed?: SubRegion,
  ) {
    setFormError(null)
    setName(seed?.name ?? '')
    setStatus(seed?.status ?? 'active')
    setDialog({ kind: 'sub', mainRegionId, mainName, seed })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!dialog) return
    setBusy(true)
    setFormError(null)
    try {
      if (dialog.kind === 'main') {
        if (dialog.seed) {
          await datasource.updateMainRegion({
            id: dialog.seed.id,
            name,
            status,
          })
        } else {
          await datasource.createMainRegion({ name })
        }
      } else if (dialog.seed) {
        await datasource.updateSubRegion({
          id: dialog.seed.id,
          name,
          status,
        })
      } else {
        await datasource.createSubRegion({
          mainRegionId: dialog.mainRegionId,
          name,
        })
      }
      await reload()
      setDialog(null)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'فشل الحفظ')
    } finally {
      setBusy(false)
    }
  }

  async function toggleMainStatus(region: MainRegion) {
    setBusy(true)
    setError(null)
    try {
      await datasource.updateMainRegion({
        id: region.id,
        name: region.name,
        status: region.status === 'active' ? 'inactive' : 'active',
      })
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الحالة')
    } finally {
      setBusy(false)
    }
  }

  async function toggleSubStatus(sub: SubRegion) {
    setBusy(true)
    setError(null)
    try {
      await datasource.updateSubRegion({
        id: sub.id,
        name: sub.name,
        status: sub.status === 'active' ? 'inactive' : 'active',
      })
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الحالة')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="regions-status">جاري تحميل المناطق...</p>
  }

  if (!data) {
    return (
      <p className="regions-status error">{error ?? 'لا توجد بيانات'}</p>
    )
  }

  return (
    <div className="regions">
      <header className="regions-head">
        <div>
          <h1>المناطق الجغرافية</h1>
          <p>
            يُعرّفها المشرف هنا — ثم تظهر للمفوتر عند إنشاء/تعديل صيدلية
            (رئيسية → فرعية)
          </p>
        </div>
        <button
          type="button"
          className="regions-cta"
          disabled={busy}
          onClick={() => openMain()}
        >
          إضافة منطقة رئيسية
        </button>
      </header>

      {error ? <div className="regions-banner error">{error}</div> : null}

      <section className="regions-summary">
        <article>
          <span>مناطق رئيسية</span>
          <strong>{data.totalMain}</strong>
        </article>
        <article>
          <span>مناطق فرعية</span>
          <strong>{data.totalSub}</strong>
        </article>
        <article>
          <span>رئيسية فعّالة</span>
          <strong>{data.activeMain}</strong>
        </article>
        <article>
          <span>فرعية فعّالة</span>
          <strong>{data.activeSub}</strong>
        </article>
      </section>

      <div className="regions-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث باسم المنطقة الرئيسية أو الفرعية"
        />
      </div>

      <div className="regions-table-wrap">
        <table>
          <thead>
            <tr>
              <th>المنطقة الرئيسية</th>
              <th>الفروع</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((region) => {
              const open = expanded[region.id] ?? true
              return (
                <tr key={region.id} className="regions-row-main">
                  <td>
                    <button
                      type="button"
                      className="regions-expand"
                      onClick={() =>
                        setExpanded((m) => ({
                          ...m,
                          [region.id]: !open,
                        }))
                      }
                    >
                      {open ? '▾' : '◂'} {region.name}
                    </button>
                    {open ? (
                      <ul className="regions-subs">
                        {region.subRegions.length === 0 ? (
                          <li className="muted">لا فروع بعد</li>
                        ) : (
                          region.subRegions.map((sub) => (
                            <li key={sub.id}>
                              <span>{sub.name}</span>
                              <span
                                className={`badge ${sub.status === 'active' ? 'ok' : 'stop'}`}
                              >
                                {statusLabel(sub.status)}
                              </span>
                              <span className="actions">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    openSub(region.id, region.name, sub)
                                  }
                                >
                                  تعديل
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => toggleSubStatus(sub)}
                                >
                                  {sub.status === 'active'
                                    ? 'إيقاف'
                                    : 'تفعيل'}
                                </button>
                              </span>
                            </li>
                          ))
                        )}
                      </ul>
                    ) : null}
                  </td>
                  <td>{region.subRegions.length}</td>
                  <td>
                    <span
                      className={`badge ${region.status === 'active' ? 'ok' : 'stop'}`}
                    >
                      {statusLabel(region.status)}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openSub(region.id, region.name)}
                      >
                        إضافة فرعية
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openMain(region)}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleMainStatus(region)}
                      >
                        {region.status === 'active' ? 'إيقاف' : 'تفعيل'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="regions-note">
        المناطق غير الفعّالة تبقى في الكتالوج ولا تُحذف — ويُفترض إخفاؤها من
        قوائم الاختيار في المفوتر حسب حالة الـ API.
      </p>

      {dialog ? (
        <div className="modal-backdrop" role="presentation">
          <form className="modal" onSubmit={onSubmit}>
            <h3>
              {dialog.kind === 'main'
                ? dialog.seed
                  ? 'تعديل منطقة رئيسية'
                  : 'إضافة منطقة رئيسية'
                : dialog.seed
                  ? `تعديل فرعية — ${dialog.mainName}`
                  : `إضافة فرعية — ${dialog.mainName}`}
            </h3>

            <label>
              الاسم
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </label>

            {dialog.seed ? (
              <label>
                الحالة
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as RegionStatus)
                  }
                >
                  <option value="active">فعّالة</option>
                  <option value="inactive">غير فعّالة</option>
                </select>
              </label>
            ) : null}

            {formError ? (
              <div className="regions-banner error">{formError}</div>
            ) : null}

            <div className="modal-actions">
              <button
                type="button"
                className="ghost"
                disabled={busy}
                onClick={() => setDialog(null)}
              >
                إلغاء
              </button>
              <button type="submit" disabled={busy}>
                {busy ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
