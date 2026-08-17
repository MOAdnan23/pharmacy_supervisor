import type { EvaluationGrade } from './evaluationEntities'

/**
 * سلم التقدير حسب النسبة المئوية (من 100):
 * 90–100 ممتاز جداً | 80–90 ممتاز | 70–80 جيد جداً
 * 55–70 جيد | 40–55 عادي | أقل من 40 سيء
 */
export function gradeFromPercent(percent: number): EvaluationGrade {
  const p = Math.max(0, Math.min(100, percent))
  if (p >= 90) return 'excellent_plus'
  if (p >= 80) return 'excellent'
  if (p >= 70) return 'very_good'
  if (p >= 55) return 'good'
  if (p >= 40) return 'average'
  return 'bad'
}

export function gradeLabel(grade: EvaluationGrade): string {
  switch (grade) {
    case 'excellent_plus':
      return 'ممتاز جداً'
    case 'excellent':
      return 'ممتاز'
    case 'very_good':
      return 'جيد جداً'
    case 'good':
      return 'جيد'
    case 'average':
      return 'عادي'
    case 'bad':
      return 'سيء'
  }
}

export function gradeTone(grade: EvaluationGrade): string {
  switch (grade) {
    case 'excellent_plus':
      return 'top'
    case 'excellent':
      return 'ok'
    case 'very_good':
      return 'good'
    case 'good':
      return 'mid'
    case 'average':
      return 'warn'
    case 'bad':
      return 'bad'
  }
}

export const GRADE_SCALE: Array<{
  grade: EvaluationGrade
  range: string
  label: string
}> = [
  { grade: 'excellent_plus', range: '90% – 100%', label: 'ممتاز جداً' },
  { grade: 'excellent', range: '80% – 90%', label: 'ممتاز' },
  { grade: 'very_good', range: '70% – 80%', label: 'جيد جداً' },
  { grade: 'good', range: '55% – 70%', label: 'جيد' },
  { grade: 'average', range: '40% – 55%', label: 'عادي' },
  { grade: 'bad', range: 'أقل من 40%', label: 'سيء' },
]

export function money(n: number): string {
  return `${n.toLocaleString('ar-SY', {
    maximumFractionDigits: 0,
  })} ل.س`
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function defaultEvalDates(): { from: string; to: string } {
  const to = todayIsoDate()
  return { from: '2026-08-01', to }
}
