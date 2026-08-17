/**
 * احتساب نقاط التقييم من فواتير البيع
 * التارغت 35 · التغطية 35 · المكررة 20 · مرة واحدة 10
 */
import type {
  CompanySaleInvoiceRow,
  CompanyTargetRow,
  PharmacyEvalRow,
  ScoreBreakdown,
} from './evaluationEntities'

export type SaleInvoiceSeed = {
  id: string
  invoiceNumber: string
  repId: string
  pharmacyId: string
  pharmacyName: string
  mainRegionId: string
  subRegionId: string
  regionLabel: string
  companyId: string
  companyName: string
  amount: number
  date: string
}

export type ReturnSeed = {
  invoiceId?: string
  repId: string
  pharmacyId: string
  companyId: string
  amount: number
  date: string
  mainRegionId: string
  subRegionId: string
}

export type CompanyTargetSeed = {
  companyId: string
  companyName: string
  targetAmount: number
  repId: string
}

export type PharmacySeed = {
  id: string
  name: string
  mainRegionId: string
  subRegionId: string
  regionLabel: string
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function achievementPoints(
  achieved: number,
  target: number,
  max: number,
): number {
  if (target <= 0) return 0
  return clamp((achieved / target) * max, 0, max)
}

function invoicesForCompany(
  invoices: SaleInvoiceSeed[],
  companyId: string,
): CompanySaleInvoiceRow[] {
  return invoices
    .filter((inv) => inv.companyId === companyId)
    .map((inv) => ({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      pharmacyId: inv.pharmacyId,
      pharmacyName: inv.pharmacyName,
      regionLabel: inv.regionLabel,
      amount: inv.amount,
    }))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        a.pharmacyName.localeCompare(b.pharmacyName, 'ar'),
    )
}

export function computeBreakdown(input: {
  invoices: SaleInvoiceSeed[]
  returns: ReturnSeed[]
  targets: CompanyTargetSeed[]
  pharmaciesInScope: PharmacySeed[]
}): ScoreBreakdown {
  const { invoices, returns, targets, pharmaciesInScope } = input

  const companyIds = [...new Set(targets.map((t) => t.companyId))]
  const companies: CompanyTargetRow[] = companyIds.map((companyId) => {
    const t = targets.find((x) => x.companyId === companyId)!
    const sold = invoices
      .filter((i) => i.companyId === companyId)
      .reduce((s, i) => s + i.amount, 0)
    const ret = returns
      .filter((r) => r.companyId === companyId)
      .reduce((s, r) => s + r.amount, 0)
    const achieved = Math.max(0, sold - ret)
    const achievementPercent =
      t.targetAmount <= 0 ? 0 : Math.min(100, (achieved / t.targetAmount) * 100)
    return {
      companyId,
      companyName: t.companyName,
      targetAmount: t.targetAmount,
      achievedAmount: achieved,
      achievementPercent,
      points: 0,
      maxPoints: 0,
      invoices: invoicesForCompany(invoices, companyId),
    }
  })

  const totalTarget = companies.reduce((s, c) => s + c.targetAmount, 0)
  const totalAchieved = companies.reduce((s, c) => s + c.achievedAmount, 0)
  const targetPoints = achievementPoints(totalAchieved, totalTarget, 35)
  for (const c of companies) {
    const share = totalTarget <= 0 ? 0 : (c.targetAmount / totalTarget) * 35
    c.maxPoints = share
    c.points = achievementPoints(c.achievedAmount, c.targetAmount, share)
  }

  const byPharmacy = new Map<string, PharmacyEvalRow>()
  for (const inv of invoices) {
    const prev = byPharmacy.get(inv.pharmacyId)
    if (prev) {
      prev.invoiceCount += 1
      prev.salesAmount += inv.amount
      prev.invoices.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        amount: inv.amount,
      })
    } else {
      byPharmacy.set(inv.pharmacyId, {
        pharmacyId: inv.pharmacyId,
        pharmacyName: inv.pharmacyName,
        regionLabel: inv.regionLabel,
        invoiceCount: 1,
        salesAmount: inv.amount,
        invoices: [
          {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            date: inv.date,
            amount: inv.amount,
          },
        ],
      })
    }
  }
  const soldList = [...byPharmacy.values()].sort((a, b) =>
    a.pharmacyName.localeCompare(b.pharmacyName, 'ar'),
  )
  const totalPharmacies = Math.max(pharmaciesInScope.length, soldList.length)
  const soldPharmacies = soldList.length
  const coveragePercent =
    totalPharmacies === 0 ? 0 : (soldPharmacies / totalPharmacies) * 100
  const coveragePoints = clamp((coveragePercent / 100) * 35, 0, 35)

  const repeated = soldList.filter((p) => p.invoiceCount >= 2)
  const once = soldList.filter((p) => p.invoiceCount === 1)
  const repeatedPercent =
    soldPharmacies === 0 ? 0 : (repeated.length / soldPharmacies) * 100
  const oncePercent =
    soldPharmacies === 0 ? 0 : (once.length / soldPharmacies) * 100

  return {
    target: {
      maxPoints: 35,
      points: Math.round(targetPoints * 10) / 10,
      percent:
        totalTarget <= 0
          ? 0
          : Math.min(100, (totalAchieved / totalTarget) * 100),
      companies,
    },
    coverage: {
      maxPoints: 35,
      points: Math.round(coveragePoints * 10) / 10,
      percent: coveragePercent,
      totalPharmacies,
      soldPharmacies,
      pharmacies: soldList,
    },
    repeated: {
      maxPoints: 20,
      points: Math.round(clamp((repeatedPercent / 100) * 20, 0, 20) * 10) / 10,
      percent: repeatedPercent,
      count: repeated.length,
      pharmacies: repeated,
    },
    once: {
      maxPoints: 10,
      points: Math.round(clamp((oncePercent / 100) * 10, 0, 10) * 10) / 10,
      percent: oncePercent,
      count: once.length,
      pharmacies: once,
    },
  }
}

export function totalPointsFromBreakdown(b: ScoreBreakdown): number {
  return (
    Math.round(
      (b.target.points +
        b.coverage.points +
        b.repeated.points +
        b.once.points) *
        10,
    ) / 10
  )
}
