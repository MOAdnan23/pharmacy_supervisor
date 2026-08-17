/**
 * رسائل نجاح/خطأ عامة تظهر أعلى الشاشة
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import '../ui/form.css'

type FeedbackKind = 'ok' | 'error'

type FeedbackItem = {
  id: string
  kind: FeedbackKind
  text: string
}

type FeedbackContextValue = {
  success: (text: string) => void
  fail: (text: string) => void
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FeedbackItem[]>([])

  const push = useCallback((kind: FeedbackKind, text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setItems((prev) => [...prev, { id, kind, text }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id))
    }, 4200)
  }, [])

  const value = useMemo(
    () => ({
      success: (text: string) => push('ok', text),
      fail: (text: string) => push('error', text),
    }),
    [push],
  )

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="feedback-host" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`feedback-banner ${item.kind}`}>
            <span>{item.text}</span>
            <button
              type="button"
              onClick={() =>
                setItems((prev) => prev.filter((x) => x.id !== item.id))
              }
              aria-label="إغلاق"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  )
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext)
  if (!ctx) {
    throw new Error('useFeedback يجب استخدامه داخل FeedbackProvider')
  }
  return ctx
}
