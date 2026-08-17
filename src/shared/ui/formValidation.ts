/** تحقق حقول النماذج — رسائل عربية موحّدة */
export function requireText(value: string, label: string): string | null {
  if (!value.trim()) return `${label} مطلوب`
  return null
}

export function requireMinLength(
  value: string,
  min: number,
  label: string,
): string | null {
  const empty = requireText(value, label)
  if (empty) return empty
  if (value.trim().length < min) {
    return `${label} يجب ألا يقل عن ${min} أحرف`
  }
  return null
}

export function requireMatch(
  value: string,
  other: string,
  label = 'تأكيد كلمة المرور',
): string | null {
  if (!value.trim()) return `${label} مطلوب`
  if (value !== other) return 'كلمتا المرور غير متطابقتين'
  return null
}

export function firstError(
  checks: Array<string | null>,
): string | null {
  return checks.find((c) => c != null) ?? null
}

export type FieldErrors = Record<string, string>

export function setFieldError(
  errors: FieldErrors,
  key: string,
  message: string | null,
): FieldErrors {
  const next = { ...errors }
  if (message) next[key] = message
  else delete next[key]
  return next
}
