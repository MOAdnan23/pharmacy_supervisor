import { useId, useState, type InputHTMLAttributes } from 'react'
import './form.css'

type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label: string
  error?: string | null
}

export function PasswordField({
  label,
  error,
  className,
  id,
  ...rest
}: PasswordFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const [visible, setVisible] = useState(false)

  return (
    <label className="ui-field" htmlFor={inputId}>
      {label}
      <div className="ui-pass-wrap">
        <input
          {...rest}
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={[error ? 'invalid' : '', className].filter(Boolean).join(' ')}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="ui-pass-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          {visible ? 'إخفاء' : 'إظهار'}
        </button>
      </div>
      {error ? <p className="ui-field-error">{error}</p> : null}
    </label>
  )
}
