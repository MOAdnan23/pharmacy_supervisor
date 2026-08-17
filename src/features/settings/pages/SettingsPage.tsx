/**
 * إعدادات المشرف — ملف شخصي + إضافة مشرفين
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useFeedback } from '../../../shared/feedback/FeedbackContext'
import { PasswordField } from '../../../shared/ui/PasswordField'
import { TextAreaField, TextField } from '../../../shared/ui/TextField'
import {
  firstError,
  requireMatch,
  requireMinLength,
  requireText,
  type FieldErrors,
} from '../../../shared/ui/formValidation'
import { useAuth } from '../../auth/AuthContext'
import { getSettingsDatasource } from '../data'
import type { SettingsBoard } from '../domain/settingsEntities'
import './settings.css'

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('تعذّر قراءة الصورة'))
    reader.readAsDataURL(file)
  })
}

export function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { success, fail } = useFeedback()
  const datasource = useMemo(() => getSettingsDatasource(), [])

  const [board, setBoard] = useState<SettingsBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({})

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({})

  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPass, setNewPass] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [createErrors, setCreateErrors] = useState<FieldErrors>({})

  async function reload() {
    if (!user) return
    const next = await datasource.getBoard(user.id)
    setBoard(next)
    setName(next.profile.name)
    setPhone(next.profile.phone ?? '')
    setAddress(next.profile.address ?? '')
    setAvatarUrl(next.profile.avatarUrl ?? null)
  }

  useEffect(() => {
    let alive = true
    if (!user) return
    datasource
      .getBoard(user.id)
      .then((next) => {
        if (!alive) return
        setBoard(next)
        setName(next.profile.name)
        setPhone(next.profile.phone ?? '')
        setAddress(next.profile.address ?? '')
        setAvatarUrl(next.profile.avatarUrl ?? null)
      })
      .catch((err: unknown) => {
        if (alive) {
          const msg =
            err instanceof Error ? err.message : 'تعذّر تحميل الإعدادات'
          setError(msg)
          fail(msg)
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [datasource, user, fail])

  async function onAvatarChange(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      fail('اختر ملف صورة صالح')
      return
    }
    if (file.size > 2_000_000) {
      fail('حجم الصورة يجب ألا يتجاوز 2MB')
      return
    }
    try {
      const dataUrl = await readImageAsDataUrl(file)
      setAvatarUrl(dataUrl)
      success('تم اختيار الصورة — احفظ الملف الشخصي لتثبيتها')
    } catch (err: unknown) {
      fail(err instanceof Error ? err.message : 'فشل رفع الصورة')
    }
  }

  function validateProfile(): boolean {
    const next: FieldErrors = {}
    const eName = requireText(name, 'الاسم')
    const ePhone = requireText(phone, 'رقم الهاتف')
    const eAddress = requireText(address, 'العنوان')
    if (eName) next.name = eName
    if (ePhone) next.phone = ePhone
    if (eAddress) next.address = eAddress
    setProfileErrors(next)
    const top = firstError([eName, ePhone, eAddress])
    if (top) {
      fail(top)
      return false
    }
    return true
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    if (!validateProfile()) return
    setBusy(true)
    try {
      const result = await datasource.updateProfile(user.id, {
        name,
        phone,
        address,
        avatarUrl,
      })
      updateUser(result.user)
      await reload()
      success(result.message)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حفظ الملف'
      setError(msg)
      fail(msg)
    } finally {
      setBusy(false)
    }
  }

  function validatePassword(): boolean {
    const next: FieldErrors = {}
    const eCur = requireText(currentPassword, 'كلمة المرور الحالية')
    const eNew = requireMinLength(newPassword, 4, 'كلمة المرور الجديدة')
    const eConf = requireMatch(confirmPassword, newPassword)
    if (eCur) next.currentPassword = eCur
    if (eNew) next.newPassword = eNew
    if (eConf) next.confirmPassword = eConf
    setPasswordErrors(next)
    const top = firstError([eCur, eNew, eConf])
    if (top) {
      fail(top)
      return false
    }
    return true
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    if (!validatePassword()) return
    setBusy(true)
    try {
      const msg = await datasource.changePassword(user.id, {
        currentPassword,
        newPassword,
        confirmPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordErrors({})
      success(msg)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تغيير كلمة المرور'
      setError(msg)
      setPasswordErrors({ currentPassword: msg })
      fail(msg)
    } finally {
      setBusy(false)
    }
  }

  function validateCreate(): boolean {
    const next: FieldErrors = {}
    const eName = requireText(newName, 'الاسم')
    const eUser = requireText(newUsername, 'اسم المستخدم')
    const ePass = requireMinLength(newPass, 4, 'كلمة المرور')
    const ePhone = requireText(newPhone, 'رقم الهاتف')
    const eAddress = requireText(newAddress, 'العنوان')
    if (eName) next.name = eName
    if (eUser) next.username = eUser
    if (ePass) next.password = ePass
    if (ePhone) next.phone = ePhone
    if (eAddress) next.address = eAddress
    setCreateErrors(next)
    const top = firstError([eName, eUser, ePass, ePhone, eAddress])
    if (top) {
      fail(top)
      return false
    }
    return true
  }

  async function createSupervisor(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validateCreate()) return
    setBusy(true)
    try {
      const msg = await datasource.createSupervisor({
        name: newName,
        username: newUsername,
        password: newPass,
        phone: newPhone,
        address: newAddress,
      })
      setNewName('')
      setNewUsername('')
      setNewPass('')
      setNewPhone('')
      setNewAddress('')
      setCreateErrors({})
      await reload()
      success(msg)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل إضافة المشرف'
      setError(msg)
      fail(msg)
    } finally {
      setBusy(false)
    }
  }

  if (!user) return <p className="set-status error">يلزم تسجيل الدخول</p>
  if (loading) return <p className="set-status">جاري تحميل الإعدادات…</p>
  if (!board) return <p className="set-status error">{error ?? 'لا بيانات'}</p>

  return (
    <div className="set-page">
      <header className="set-hero">
        <div className="set-hero-brand">
          <img src="/brand-logo.png" alt="شعار النظام" className="set-logo" />
          <div>
            <h1>إعدادات المشرف</h1>
            <p>الملف الشخصي، كلمة المرور، وإضافة مشرفين جدد للنظام.</p>
          </div>
        </div>
      </header>

      {error ? <p className="set-status error">{error}</p> : null}

      <div className="set-grid">
        <form className="set-card" onSubmit={saveProfile} noValidate>
          <h2>الملف الشخصي</h2>
          <div className="set-avatar-row">
            <div className="set-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} />
              ) : (
                <span>{name.slice(0, 1) || 'م'}</span>
              )}
            </div>
            <div className="set-avatar-actions">
              <label className="set-file-btn">
                اختيار صورة
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    void onAvatarChange(e.target.files?.[0] ?? null)
                  }
                />
              </label>
              {avatarUrl ? (
                <button
                  type="button"
                  className="set-btn-ghost"
                  onClick={() => setAvatarUrl(null)}
                >
                  إزالة الصورة
                </button>
              ) : null}
            </div>
          </div>

          <TextField
            label="الاسم الظاهر"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={profileErrors.name}
          />
          <TextField
            label="اسم المستخدم"
            value={board.profile.username}
            disabled
          />
          <TextField
            label="رقم الهاتف"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={profileErrors.phone}
          />
          <TextAreaField
            label="العنوان"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={profileErrors.address}
          />
          <button type="submit" className="set-btn" disabled={busy}>
            حفظ الملف الشخصي
          </button>
        </form>

        <form className="set-card" onSubmit={savePassword} noValidate>
          <h2>تغيير كلمة المرور</h2>
          <PasswordField
            label="كلمة المرور الحالية"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={passwordErrors.currentPassword}
            autoComplete="current-password"
          />
          <PasswordField
            label="كلمة المرور الجديدة"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={passwordErrors.newPassword}
            autoComplete="new-password"
          />
          <PasswordField
            label="تأكيد كلمة المرور"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={passwordErrors.confirmPassword}
            autoComplete="new-password"
          />
          <button type="submit" className="set-btn" disabled={busy}>
            تحديث كلمة المرور
          </button>
        </form>

        <form className="set-card wide" onSubmit={createSupervisor} noValidate>
          <h2>إضافة مشرف جديد</h2>
          <div className="set-form-grid">
            <TextField
              label="الاسم"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              error={createErrors.name}
            />
            <TextField
              label="اسم المستخدم"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              error={createErrors.username}
            />
            <PasswordField
              label="كلمة المرور"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              error={createErrors.password}
              autoComplete="new-password"
            />
            <TextField
              label="رقم الهاتف"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              error={createErrors.phone}
            />
            <div className="full">
              <TextField
                label="العنوان"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                error={createErrors.address}
              />
            </div>
          </div>
          <button type="submit" className="set-btn" disabled={busy}>
            إضافة المشرف
          </button>
        </form>

        <section className="set-card wide">
          <h2>المشرفون في النظام</h2>
          <div className="set-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>المستخدم</th>
                  <th>الهاتف</th>
                  <th>العنوان</th>
                </tr>
              </thead>
              <tbody>
                {board.supervisors.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="set-user-cell">
                        <div className="set-avatar sm">
                          {s.avatarUrl ? (
                            <img src={s.avatarUrl} alt={s.name} />
                          ) : (
                            <span>{s.name.slice(0, 1)}</span>
                          )}
                        </div>
                        <strong>{s.name}</strong>
                      </div>
                    </td>
                    <td>{s.username}</td>
                    <td>{s.phone}</td>
                    <td>{s.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
