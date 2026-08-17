/**
 * قواعد احتساب التنفيذ المرتبطة بفواتير المندوب:
 * - كل فاتورة بيع لصيدلية = زيارة واحدة
 * - هدف «عدد الصيدليات» = صيدليات فريدة (مرة واحدة لكل صيدلية مهما تكرر البيع)
 * مثال: 3 فواتير لنفس الصيدلية في الشهر → 3 زيارات + صيدلية واحدة
 */
import type {
  AchievedPharmacyRow,
  SalesPharmacyRow,
  VisitPharmacyRow,
} from './planEntities'

export const VISIT_FROM_SALE_RULE =
  'كل فاتورة بيع لصيدلية تسجّل زيارة. تكرار البيع لنفس الصيدلية يزيد الزيارات فقط.'

export const UNIQUE_PHARMACY_RULE =
  'عدد الصيدليات يُحسب مرة واحدة لكل صيدلية — حتى لو زارها المندوب (باعها) عدة مرات.'

type VisitAggKey = string

function visitKey(pharmacyId: string, repId: string): VisitAggKey {
  return `${pharmacyId}::${repId}`
}

/** تجميع الزيارات من أسطر المبيعات: visitCount = مجموع فواتير البيع */
export function visitsFromSalesInvoices(
  sales: SalesPharmacyRow[],
  metaByPharmacy: Map<string, Pick<VisitPharmacyRow, 'regionLabel' | 'lastVisitAt'>> = new Map(),
): VisitPharmacyRow[] {
  const map = new Map<
    VisitAggKey,
    VisitPharmacyRow
  >()

  for (const row of sales) {
    const key = visitKey(row.pharmacyId, row.repId)
    const meta = metaByPharmacy.get(row.pharmacyId)
    const prev = map.get(key)
    if (prev) {
      prev.visitCount += row.invoicesCount
    } else {
      map.set(key, {
        pharmacyId: row.pharmacyId,
        pharmacyName: row.pharmacyName,
        regionLabel: meta?.regionLabel ?? '—',
        visitCount: row.invoicesCount,
        lastVisitAt: meta?.lastVisitAt ?? '—',
        repId: row.repId,
        repName: row.repName,
      })
    }
  }

  return [...map.values()].sort((a, b) =>
    a.pharmacyName.localeCompare(b.pharmacyName, 'ar'),
  )
}

/** صيدليات فريدة محققة من نفس منطق الزيارات */
export function uniquePharmaciesFromVisits(
  visits: VisitPharmacyRow[],
  metaByPharmacy: Map<
    string,
    Pick<AchievedPharmacyRow, 'regionLabel' | 'firstVisitAt'>
  > = new Map(),
): AchievedPharmacyRow[] {
  const map = new Map<VisitAggKey, AchievedPharmacyRow>()

  for (const row of visits) {
    const key = visitKey(row.pharmacyId, row.repId)
    const meta = metaByPharmacy.get(row.pharmacyId)
    const prev = map.get(key)
    if (prev) {
      prev.visitCount += row.visitCount
    } else {
      map.set(key, {
        pharmacyId: row.pharmacyId,
        pharmacyName: row.pharmacyName,
        regionLabel: meta?.regionLabel ?? row.regionLabel,
        firstVisitAt: meta?.firstVisitAt ?? row.lastVisitAt,
        visitCount: row.visitCount,
        repId: row.repId,
        repName: row.repName,
      })
    }
  }

  return [...map.values()].sort((a, b) =>
    a.pharmacyName.localeCompare(b.pharmacyName, 'ar'),
  )
}

export function totalVisitCount(rows: { visitCount: number }[]): number {
  return rows.reduce((s, v) => s + v.visitCount, 0)
}

export function uniquePharmacyCount(rows: { pharmacyId: string }[]): number {
  return new Set(rows.map((v) => v.pharmacyId)).size
}
