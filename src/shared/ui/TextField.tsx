import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import './form.css'

type CommonProps = {
  label: string
  error?: string | null
}

export function TextField({
  label,
  error,
  className,
  id,
  ...rest
}: CommonProps & InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label className="ui-field" htmlFor={inputId}>
      {label}
      <input
        {...rest}
        id={inputId}
        className={[error ? 'invalid' : '', className].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
      />
      {error ? <p className="ui-field-error">{error}</p> : null}
    </label>
  )
}

export function TextAreaField({
  label,
  error,
  className,
  id,
  ...rest
}: CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label className="ui-field" htmlFor={inputId}>
      {label}
      <textarea
        {...rest}
        id={inputId}
        className={[error ? 'invalid' : '', className].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
      />
      {error ? <p className="ui-field-error">{error}</p> : null}
    </label>
  )
}
