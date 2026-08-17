/**
 * حوار اختيار اسم ملف PDF قبل التنزيل.
 */
import { useEffect, useState, type FormEvent } from 'react'

type Props = {
  defaultName: string
  busy?: boolean
  onCancel: () => void
  onConfirm: (fileName: string) => void
}

export function SavePdfNameDialog({
  defaultName,
  busy = false,
  onCancel,
  onConfirm,
}: Props) {
  const [name, setName] = useState(defaultName)

  useEffect(() => {
    setName(defaultName)
  }, [defaultName])

  function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal" onSubmit={submit}>
        <h3>حفظ PDF</h3>
        <p className="offers-hint">اختر اسم الملف الذي سيُحفظ على الجهاز.</p>
        <label>
          اسم الملف
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            placeholder="مثال: عرض الشتاء"
          />
        </label>
        <p className="offers-hint">يُضاف امتداد .pdf تلقائياً إن لم تكتبه.</p>
        <div className="modal-actions">
          <button
            type="button"
            className="ghost"
            disabled={busy}
            onClick={onCancel}
          >
            إلغاء
          </button>
          <button type="submit" disabled={busy || !name.trim()}>
            {busy ? 'جاري الحفظ...' : 'حفظ PDF'}
          </button>
        </div>
      </form>
    </div>
  )
}
