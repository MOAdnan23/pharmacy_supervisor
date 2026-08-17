import {
  listRepOptionsFromUsers,
  syncRepTargetsOnUser,
} from '../../users/data/usersMockDatasource'
import type {
  CompanyTarget,
  CompanyTargetStatus,
  RepCompanyLine,
  RepTarget,
  RepTargetStatus,
  SetRepTargetInput,
  TargetsBoard,
  UpsertCompanyTargetInput,
} from '../domain/targetEntities'
import type { TargetsDatasource } from './targetsDatasource'

const COMPANY_OPTIONS = [
  'شركة دمشق فارما',
  'شركة حلب ميديكال',
  'شركة ابن سينا',
  'شركة الشام للدواء',
]

function sumTargets(lines: RepCompanyLine[]): number {
  return lines.reduce((s, l) => s + l.target, 0)
}

function sumAchieved(lines: RepCompanyLine[]): number {
  return lines.reduce((s, l) => s + l.achieved, 0)
}

function computeRepStatus(
  monthlyTarget: number,
  achieved: number,
): RepTargetStatus {
  if (monthlyTarget <= 0) return 'not_achieved'
  if (achieved >= monthlyTarget) return 'achieved'
  if (achieved > 0) return 'in_progress'
  return 'not_achieved'
}

function withTotals(
  base: Omit<RepTarget, 'monthlyTarget' | 'achieved' | 'status'>,
): RepTarget {
  const monthlyTarget = sumTargets(base.lines)
  const achieved = sumAchieved(base.lines)
  return {
    ...base,
    monthlyTarget,
    achieved,
    status: computeRepStatus(monthlyTarget, achieved),
  }
}

let repTargets: RepTarget[] = [
  withTotals({
    id: 'rt1',
    repId: 'r1',
    repName: 'ياسين العمودي',
    month: '2026-08',
    lines: [
      { companyName: 'شركة دمشق فارما', target: 15000000, achieved: 12000000 },
      { companyName: 'شركة حلب ميديكال', target: 7000000, achieved: 4500000 },
      { companyName: 'شركة ابن سينا', target: 3000000, achieved: 2000000 },
    ],
  }),
  withTotals({
    id: 'rt2',
    repId: 'r2',
    repName: 'محمد الشهري',
    month: '2026-08',
    lines: [
      { companyName: 'شركة دمشق فارما', target: 10000000, achieved: 11000000 },
      { companyName: 'شركة الشام للدواء', target: 8000000, achieved: 8200000 },
    ],
  }),
  withTotals({
    id: 'rt3',
    repId: 'r3',
    repName: 'سامر الحسن',
    month: '2026-07',
    lines: [
      { companyName: 'شركة ابن سينا', target: 12000000, achieved: 7200000 },
    ],
  }),
]

let companyTargets: CompanyTarget[] = [
  {
    id: 'ct1',
    companyName: 'شركة دمشق فارما',
    amount: 120000000,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'active',
  },
  {
    id: 'ct2',
    companyName: 'شركة حلب ميديكال',
    amount: 95000000,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'active',
  },
  {
    id: 'ct3',
    companyName: 'شركة ابن سينا',
    amount: 90000000,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: 'archived',
  },
]

let seq = 20

function board(): TargetsBoard {
  return {
    repTargets: [...repTargets],
    companyTargets: [...companyTargets],
    repOptions: listRepOptionsFromUsers(),
    companyOptions: [...COMPANY_OPTIONS],
  }
}

function normalizeLines(
  inputLines: SetRepTargetInput['lines'],
  previous?: RepCompanyLine[],
): RepCompanyLine[] {
  const cleaned = inputLines
    .map((l) => ({
      companyName: l.companyName.trim(),
      target: Number(l.target),
    }))
    .filter((l) => l.companyName && l.target > 0)

  if (cleaned.length === 0) {
    throw new Error('أضف شركة واحدة على الأقل بقيمة تارغت أكبر من صفر')
  }

  const names = cleaned.map((l) => l.companyName.toLowerCase())
  const unique = new Set(names)
  if (unique.size !== names.length) {
    throw new Error('لا يمكن تكرار نفس الشركة في تارغت المندوب')
  }

  return cleaned.map((l) => {
    const prev = previous?.find(
      (p) => p.companyName.toLowerCase() === l.companyName.toLowerCase(),
    )
    return {
      companyName: l.companyName,
      target: l.target,
      achieved: prev?.achieved ?? 0,
    }
  })
}

export const targetsMockDatasource: TargetsDatasource = {
  async getBoard() {
    await delay(200)
    return board()
  },

  async setRepTarget(input: SetRepTargetInput) {
    await delay(250)
    const rep = listRepOptionsFromUsers().find((r) => r.id === input.repId)
    if (!rep) throw new Error('المندوب غير موجود')

    const month = input.month.trim()
    if (!month) throw new Error('اختر الشهر')

    const existingIndex = repTargets.findIndex(
      (t) => t.repId === input.repId && t.month === month,
    )
    const previous =
      existingIndex >= 0 ? repTargets[existingIndex].lines : undefined
    const lines = normalizeLines(input.lines, previous)

    const allowed = new Set(
      rep.companies.map((c) => c.trim().toLowerCase()),
    )
    for (const line of lines) {
      if (!allowed.has(line.companyName.toLowerCase())) {
        throw new Error(
          `الشركة «${line.companyName}» غير مرتبطة بالمندوب — اختر من شركاته فقط`,
        )
      }
    }

    if (existingIndex >= 0) {
      repTargets[existingIndex] = withTotals({
        id: repTargets[existingIndex].id,
        repId: input.repId,
        repName: rep.name,
        month,
        lines,
      })
    } else {
      repTargets = [
        withTotals({
          id: `rt${seq++}`,
          repId: input.repId,
          repName: rep.name,
          month,
          lines,
        }),
        ...repTargets,
      ]
    }

    const currentMonth = new Date().toISOString().slice(0, 7)
    if (month === currentMonth) {
      const total = sumTargets(lines)
      syncRepTargetsOnUser(input.repId, total)
    }
  },

  async upsertCompanyTarget(input: UpsertCompanyTargetInput) {
    await delay(250)
    const companyName = input.companyName.trim()
    const amount = Number(input.amount)
    const startDate = input.startDate.trim()
    const endDate = input.endDate.trim()

    if (!companyName || amount <= 0 || !startDate || !endDate) {
      throw new Error('أكمل اسم الشركة والقيمة والتواريخ')
    }
    if (endDate < startDate) {
      throw new Error('تاريخ النهاية يجب أن يكون بعد البداية')
    }

    if (input.id) {
      const index = companyTargets.findIndex((t) => t.id === input.id)
      if (index < 0) throw new Error('تارغت الشركة غير موجود')
      companyTargets[index] = {
        ...companyTargets[index],
        companyName,
        amount,
        startDate,
        endDate,
        status: input.status ?? companyTargets[index].status,
      }
      return
    }

    companyTargets = [
      {
        id: `ct${seq++}`,
        companyName,
        amount,
        startDate,
        endDate,
        status: input.status ?? 'active',
      },
      ...companyTargets,
    ]
  },

  async setCompanyTargetStatus(id: string, status: CompanyTargetStatus) {
    await delay(150)
    const index = companyTargets.findIndex((t) => t.id === id)
    if (index < 0) throw new Error('تارغت الشركة غير موجود')
    companyTargets[index] = { ...companyTargets[index], status }
  },
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
