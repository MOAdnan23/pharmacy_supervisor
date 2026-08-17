import { describe, expect, it } from 'vitest'
import { gradeFromPercent, gradeLabel } from './evaluationLabels'

describe('evaluation grade scale', () => {
  it('maps percent ranges to Arabic grades', () => {
    expect(gradeLabel(gradeFromPercent(95))).toBe('ممتاز جداً')
    expect(gradeLabel(gradeFromPercent(90))).toBe('ممتاز جداً')
    expect(gradeLabel(gradeFromPercent(85))).toBe('ممتاز')
    expect(gradeLabel(gradeFromPercent(80))).toBe('ممتاز')
    expect(gradeLabel(gradeFromPercent(75))).toBe('جيد جداً')
    expect(gradeLabel(gradeFromPercent(60))).toBe('جيد')
    expect(gradeLabel(gradeFromPercent(45))).toBe('عادي')
    expect(gradeLabel(gradeFromPercent(20))).toBe('سيء')
  })
})
