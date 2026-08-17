/**
 * صفحة تسجيل الدخول
 */
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useFeedback } from '../../../shared/feedback/FeedbackContext'
import { PasswordField } from '../../../shared/ui/PasswordField'
import { TextField } from '../../../shared/ui/TextField'
import {
  firstError,
  requireText,
  type FieldErrors,
} from '../../../shared/ui/formValidation'
import { useAuth } from '../AuthContext'
import './login.css'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const { success, fail } = useFeedback()
  const navigate = useNavigate()

  const [username, setUsername] = useState('supervisor')
  const [password, setPassword] = useState('123456')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  function validate(): boolean {
    const next: FieldErrors = {}
    const u = requireText(username, 'اسم المستخدم أو الهاتف')
    const p = requireText(password, 'كلمة المرور')
    if (u) next.username = u
    if (p) next.password = p
    setFieldErrors(next)
    const top = firstError([u, p])
    if (top) {
      setError(top)
      fail(top)
      return false
    }
    return true
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setLoading(true)
    const outcome = await login(username, password)
    setLoading(false)
    if (!outcome.ok) {
      setError(outcome.error)
      setFieldErrors({ password: outcome.error })
      fail(outcome.error)
      return
    }
    success(outcome.message)
    navigate('/')
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <img src="/brand-logo.png" alt="شعار النظام" className="login-logo" />
        <p className="login-eyebrow">نظام إدارة المستودع الدوائي</p>
        <h1>لوحة تحكم المشرف</h1>
        <p className="login-sub">سجّل الدخول بحساب المشرف</p>

        <TextField
          label="اسم المستخدم أو الهاتف"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            setFieldErrors((prev) => {
              const n = { ...prev }
              delete n.username
              return n
            })
          }}
          autoComplete="username"
          error={fieldErrors.username}
        />

        <PasswordField
          label="كلمة المرور"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setFieldErrors((prev) => {
              const n = { ...prev }
              delete n.password
              return n
            })
          }}
          autoComplete="current-password"
          error={fieldErrors.password}
        />

        {error ? <p className="login-error">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
        </button>

        <p className="login-hint">الحساب الافتراضي: supervisor / 123456</p>
      </form>
    </div>
  )
}
