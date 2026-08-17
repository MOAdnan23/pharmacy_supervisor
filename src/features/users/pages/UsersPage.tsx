/**
 * إدارة المستخدمين — UC-09 → UC-14 (+ إيقاف/حذف)
 *
 * الصفحة تتكلم مع getUsersDatasource() فقط.
 * البيانات حالياً من Mock.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PermissionsPanel } from '../../permissions/pages/PermissionsPanel'
import { TargetsPanel } from '../../targets/pages/TargetsPanel'
import { getUsersDatasource } from '../data'
import type {
  CreateUserInput,
  ManagedUser,
  ManagedUserRole,
  UpdateUserInput,
  UserStatus,
  UsersOverview,
} from '../domain/userEntities'
import './users.css'

type TabId = 'reps' | 'invoicers' | 'permissions' | 'targets'
type DialogMode = 'create' | 'edit' | null

type UserFormState = {
  name: string
  username: string
  password: string
  phone: string
  region: string
  governorate: string
  residence: string
  role: ManagedUserRole
  status: UserStatus
}

const emptyForm: UserFormState = {
  name: '',
  username: '',
  password: '',
  phone: '',
  region: '',
  governorate: '',
  residence: '',
  role: 'rep',
  status: 'active',
}

export function UsersPage() {
  const datasource = useMemo(() => getUsersDatasource(), [])

  const [data, setData] = useState<UsersOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<TabId>('reps')
  const [query, setQuery] = useState('')

  const [dialog, setDialog] = useState<DialogMode>(null)
  const [editing, setEditing] = useState<ManagedUser | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function reload() {
    const overview = await datasource.getOverview()
    setData(overview)
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
          setError(err instanceof Error ? err.message : 'تعذّر تحميل المستخدمين')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [datasource])

  const list = useMemo(() => {
    if (!data) return []
    const source = tab === 'invoicers' ? data.invoicers : data.reps
    const q = query.trim().toLowerCase()
    if (!q) return source
    return source.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.region.toLowerCase().includes(q),
    )
  }, [data, tab, query])

  function openCreate() {
    setEditing(null)
    setForm({
      ...emptyForm,
      role: tab === 'invoicers' ? 'invoicer' : 'rep',
    })
    setFormError(null)
    setShowPassword(true)
    setDialog('create')
  }

  function openEdit(user: ManagedUser) {
    setEditing(user)
    setForm({
      name: user.name,
      username: user.username,
      password: user.password,
      phone: user.phone,
      region: user.region,
      governorate: user.governorate ?? '',
      residence: user.residence ?? '',
      role: user.role,
      status: user.status,
    })
    setFormError(null)
    setShowPassword(false)
    setDialog('edit')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setFormError(null)
    try {
      if (dialog === 'create') {
        const input: CreateUserInput = {
          name: form.name,
          username: form.username,
          password: form.password,
          phone: form.phone,
          region: form.region,
          governorate: form.governorate || undefined,
          residence: form.residence || undefined,
          role: form.role,
          status: form.status,
        }
        await datasource.createUser(input)
      } else if (dialog === 'edit' && editing) {
        const input: UpdateUserInput = {
          name: form.name,
          username: form.username,
          password: form.password,
          phone: form.phone,
          region: form.region,
          governorate: form.governorate || undefined,
          residence: form.residence || undefined,
          status: form.status,
        }
        await datasource.updateUser(editing.id, input)
      }
      await reload()
      setDialog(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'فشلت العملية')
    } finally {
      setBusy(false)
    }
  }

  async function toggleStatus(user: ManagedUser) {
    const next = user.status === 'active' ? 'suspended' : 'active'
    const ok = window.confirm(
      next === 'suspended'
        ? `إيقاف حساب «${user.name}»؟ لن يستطيع الدخول.`
        : `تفعيل حساب «${user.name}»؟`,
    )
    if (!ok) return
    setBusy(true)
    try {
      await datasource.setStatus(user.id, next)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تغيير الحالة')
    } finally {
      setBusy(false)
    }
  }

  async function removeUser(user: ManagedUser) {
    const ok = window.confirm(
      `حذف حساب «${user.name}»؟`,
    )
    if (!ok) return
    setBusy(true)
    try {
      await datasource.deleteUser(user.id)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحذف')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="users-note">جاري تحميل المستخدمين...</p>
  }

  if (!data) {
    return <p className="users-note">{error ?? 'لا توجد بيانات'}</p>
  }

  const summary = [
    { label: 'المندوبون', value: String(data.summary.repsTotal) },
    { label: 'نشطون', value: String(data.summary.repsActive) },
    { label: 'موقوفون', value: String(data.summary.repsSuspended) },
    { label: 'المفوترون', value: String(data.summary.invoicersTotal) },
  ]

  return (
    <div className="users">
      <header className="users-head">
        <div>
          <h1>إدارة المستخدمين والمندوبين</h1>
          <p>
            {tab === 'targets'
              ? 'تارغت المندوبين والشركات'
              : tab === 'permissions'
                ? 'صلاحيات الأدوار (عرض فقط)'
                : 'إنشاء وتعديل وإيقاف وحذف حسابات المندوبين'}
          </p>
        </div>
        {(tab === 'reps' || tab === 'invoicers') && (
          <button type="button" className="users-cta" onClick={openCreate}>
            إنشاء حساب
          </button>
        )}
      </header>

      {error && <p className="users-banner error">{error}</p>}

      <section className="users-summary">
        {summary.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="users-tabs">
        <button
          type="button"
          className={tab === 'reps' ? 'active' : ''}
          onClick={() => setTab('reps')}
        >
          المندوبون
        </button>
        <button
          type="button"
          className={tab === 'invoicers' ? 'active' : ''}
          onClick={() => setTab('invoicers')}
        >
          المفوترون
        </button>
        <button
          type="button"
          className={tab === 'permissions' ? 'active' : ''}
          onClick={() => setTab('permissions')}
        >
          الصلاحيات
        </button>
        <button
          type="button"
          className={tab === 'targets' ? 'active' : ''}
          onClick={() => setTab('targets')}
        >
          التارغت
        </button>
      </section>

      {(tab === 'reps' || tab === 'invoicers') && (
        <>
          <div className="users-toolbar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث بالاسم / المستخدم / الهاتف / المنطقة"
            />
          </div>

          <section className="users-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>اسم المستخدم</th>
                  <th>الهاتف</th>
                  <th>{tab === 'reps' ? 'المنطقة' : 'القسم'}</th>
                  {tab === 'reps' && <th>الصيدليات</th>}
                  {tab === 'reps' && <th>تارغت شهري</th>}
                  <th>الحالة</th>
                  <th>تاريخ الإنشاء</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr>
                    <td colSpan={tab === 'reps' ? 9 : 7}>لا توجد نتائج</td>
                  </tr>
                )}
                {list.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.username}</td>
                    <td>{user.phone}</td>
                    <td>{user.region}</td>
                    {tab === 'reps' && <td>{user.pharmacyCount}</td>}
                    {tab === 'reps' && (
                      <td>{user.monthlyTarget.toLocaleString('ar-SY')}</td>
                    )}
                    <td>
                      <span
                        className={`badge ${user.status === 'active' ? 'ok' : 'stop'}`}
                      >
                        {user.status === 'active' ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td>{user.createdAt}</td>
                    <td className="actions">
                      <button type="button" onClick={() => openEdit(user)}>
                        تعديل
                      </button>
                      <button type="button" onClick={() => toggleStatus(user)}>
                        {user.status === 'active' ? 'إيقاف' : 'تفعيل'}
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => removeUser(user)}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {tab === 'permissions' && <PermissionsPanel />}
      {tab === 'targets' && (
        <TargetsPanel onRepTargetsChanged={() => void reload()} />
      )}

      {dialog && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={handleSubmit}>
            <h3>{dialog === 'create' ? 'إنشاء حساب' : 'تعديل حساب'}</h3>

            {dialog === 'create' && (
              <label>
                نوع الحساب
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as ManagedUserRole,
                    }))
                  }
                >
                  <option value="rep">مندوب</option>
                  <option value="invoicer">مفوتر</option>
                </select>
              </label>
            )}

            <label>
              الاسم الكامل
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label>
              اسم المستخدم
              <input
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                required
              />
            </label>
            <label>
              كلمة المرور
              <div className="password-row">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
            </label>
            <label>
              رقم الهاتف
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
              />
            </label>
            <label>
              المنطقة / الموقع
              <input
                value={form.region}
                onChange={(e) =>
                  setForm((f) => ({ ...f, region: e.target.value }))
                }
                required
              />
            </label>
            <label>
              المحافظة (اختياري)
              <input
                value={form.governorate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, governorate: e.target.value }))
                }
              />
            </label>
            <label>
              مكان السكن (اختياري)
              <input
                value={form.residence}
                onChange={(e) =>
                  setForm((f) => ({ ...f, residence: e.target.value }))
                }
              />
            </label>
            <label>
              الحالة
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as 'active' | 'suspended',
                  }))
                }
              >
                <option value="active">نشط</option>
                <option value="suspended">موقوف</option>
              </select>
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
