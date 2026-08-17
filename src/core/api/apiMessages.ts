/**
 * استخراج رسائل الـ API للعرض للمستخدم — بدون أرقام HTTP أو روابط.
 */

type LooseRecord = Record<string, unknown>

function asRecord(value: unknown): LooseRecord | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as LooseRecord
  }
  return null
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text) return null
  // لا نعرض رسائل تقنية تحتوي حالة HTTP أو مسارات API
  if (/https?:\/\//i.test(text)) return null
  if (/\b(status|http)\s*[:=]?\s*\d{3}\b/i.test(text)) return null
  if (/فشل الطلب\s*\(\d+\)/.test(text)) return null
  return text
}

/** يجمع أخطاء التحقق من Laravel: { field: ["msg"] } */
function fromValidationErrors(errors: unknown): string | null {
  const record = asRecord(errors)
  if (!record) return null

  const parts: string[] = []
  for (const value of Object.values(record)) {
    if (typeof value === 'string') {
      const t = cleanText(value)
      if (t) parts.push(t)
      continue
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const t = cleanText(item)
        if (t) parts.push(t)
      }
    }
  }
  if (parts.length === 0) return null
  // أول رسالتين كافيتان للبانر
  return [...new Set(parts)].slice(0, 2).join(' · ')
}

/**
 * يقرأ رسالة مفهومة من جسم رد الباكند (نجاح أو فشل).
 */
export function pickApiMessage(
  payload: unknown,
  fallback?: string,
): string | null {
  const root = asRecord(payload)
  if (!root) {
    return fallback?.trim() || null
  }

  const fromErrors = fromValidationErrors(root.errors)
  if (fromErrors) return fromErrors

  const direct =
    cleanText(root.message) ??
    cleanText(root.msg) ??
    cleanText(root.error) ??
    cleanText(root.detail)

  if (direct) return direct

  const nested = asRecord(root.data)
  if (nested) {
    const nestedMsg =
      cleanText(nested.message) ??
      cleanText(nested.msg) ??
      fromValidationErrors(nested.errors)
    if (nestedMsg) return nestedMsg
  }

  return fallback?.trim() || null
}

/** رسائل ودّية عند غياب نص من الباكند — بدون ذكر رقم الحالة */
export function fallbackHttpMessage(status: number): string {
  if (status === 401) return 'بيانات الدخول غير صحيحة أو انتهت الجلسة'
  if (status === 403) return 'ليس لديك صلاحية لهذا الإجراء'
  if (status === 404) return 'العنصر المطلوب غير موجود'
  if (status === 409) return 'تعارض في البيانات — راجع القيم المدخلة'
  if (status === 422) return 'البيانات غير مكتملة أو غير صحيحة'
  if (status === 429) return 'محاولات كثيرة — حاول بعد لحظات'
  if (status >= 500) return 'حدث خطأ في الخادم — حاول لاحقاً'
  return 'تعذّر إكمال العملية'
}

export function networkErrorMessage(): string {
  return 'تعذّر الاتصال بالخادم — تحقق من الشبكة وحاول مجدداً'
}
