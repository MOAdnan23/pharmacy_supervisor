/**
 * جداول تفصيل متابعة التنفيذ حسب نوع الهدف
 * الزيارات مشتقة من فواتير البيع؛ الصيدليات = فريدة
 */
import { useMemo, useState } from 'react'
import type {
  GoalType,
  PlanExecutionDetails,
  PlanGoal,
  WorkPlan,
} from '../domain/planEntities'
import {
  UNIQUE_PHARMACY_RULE,
  VISIT_FROM_SALE_RULE,
  totalVisitCount,
  uniquePharmaciesFromVisits,
  uniquePharmacyCount,
  visitsFromSalesInvoices,
} from '../domain/planExecutionRules'
import { goalProgress } from '../domain/planLabels'

type Props = {
  plan: WorkPlan
  repFilter: 'all' | string
}

function money(n: number): string {
  return `${n.toLocaleString('ar-SY')} ل.س`
}

function hasGoal(goals: PlanGoal[], type: GoalType): boolean {
  return goals.some((g) => g.type === type)
}

function filterByRep<T extends { repId: string }>(
  rows: T[],
  repFilter: 'all' | string,
): T[] {
  if (repFilter === 'all') return rows
  return rows.filter((r) => r.repId === repFilter)
}

function emptyDetails(): PlanExecutionDetails {
  return {
    visits: [],
    sales: [],
    collections: [],
    achievedPharmacies: [],
  }
}

export function PlanExecutionPanel({ plan, repFilter }: Props) {
  const details = plan.executionDetails ?? emptyDetails()
  const [visitBucket, setVisitBucket] = useState<'1' | '2' | '3plus'>('1')

  const sales = useMemo(
    () => filterByRep(details.sales, repFilter),
    [details.sales, repFilter],
  )
  const collections = useMemo(
    () => filterByRep(details.collections, repFilter),
    [details.collections, repFilter],
  )

  /** الزيارات تُحسب من فواتير البيع (كل فاتورة = زيارة) */
  const visits = useMemo(() => {
    const meta = new Map(
      details.visits.map((v) => [
        v.pharmacyId,
        { regionLabel: v.regionLabel, lastVisitAt: v.lastVisitAt },
      ]),
    )
    for (const p of details.achievedPharmacies) {
      if (!meta.has(p.pharmacyId)) {
        meta.set(p.pharmacyId, {
          regionLabel: p.regionLabel,
          lastVisitAt: p.firstVisitAt,
        })
      }
    }
    if (sales.length > 0) {
      return visitsFromSalesInvoices(sales, meta)
    }
    return filterByRep(details.visits, repFilter)
  }, [sales, details.visits, details.achievedPharmacies, repFilter])

  /** صيدليات فريدة — مرة لكل صيدلية مهما تكرر البيع */
  const pharmacies = useMemo(() => {
    if (visits.length > 0) {
      const meta = new Map(
        details.achievedPharmacies.map((p) => [
          p.pharmacyId,
          { regionLabel: p.regionLabel, firstVisitAt: p.firstVisitAt },
        ]),
      )
      return uniquePharmaciesFromVisits(visits, meta)
    }
    return filterByRep(details.achievedPharmacies, repFilter)
  }, [visits, details.achievedPharmacies, repFilter])

  const visitsOnce = visits.filter((v) => v.visitCount === 1)
  const visitsTwice = visits.filter((v) => v.visitCount === 2)
  const visitsThrice = visits.filter((v) => v.visitCount >= 3)

  const visitRows =
    visitBucket === '1'
      ? visitsOnce
      : visitBucket === '2'
        ? visitsTwice
        : visitsThrice

  const salesTotal = sales.reduce((s, r) => s + r.amount, 0)
  const collectionsTotal = collections.reduce((s, r) => s + r.amount, 0)
  const visitsTotal = totalVisitCount(visits)
  const pharmaciesUnique = uniquePharmacyCount(visits)

  const showVisits = hasGoal(plan.goals, 'visits')
  const showSales = hasGoal(plan.goals, 'sales')
  const showCollections = hasGoal(plan.goals, 'collections')
  const showPharmacies =
    hasGoal(plan.goals, 'pharmacies') ||
    hasGoal(plan.goals, 'specific_pharmacies')

  return (
    <div className="plans-exec-details">
      <div className="plans-rule-banner">
        <p>
          <strong>قاعدة الاحتساب:</strong> {VISIT_FROM_SALE_RULE}
        </p>
        <p>{UNIQUE_PHARMACY_RULE}</p>
      </div>

      <div className="plans-exec-summary">
        {plan.goals.map((g) => {
          const pct = goalProgress(g.achievedValue, g.targetValue)
          return (
            <article key={g.id} className="plans-exec-chip">
              <span>{g.label}</span>
              <strong>{pct}%</strong>
              <div className="plans-progress-track">
                <div
                  className="plans-progress-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <small>
                {g.achievedValue.toLocaleString('ar-SY')} /{' '}
                {g.targetValue.toLocaleString('ar-SY')} {g.unit}
              </small>
            </article>
          )
        })}
      </div>

      {showVisits ? (
        <section className="plans-detail-block">
          <div className="plans-detail-head">
            <div>
              <h3>تفصيل الزيارات</h3>
              <p>
                من فواتير البيع · إجمالي الزيارات {visitsTotal} · صيدليات فريدة{' '}
                {pharmaciesUnique}
              </p>
            </div>
            <div className="plans-mini-stats">
              <span>مرة: {visitsOnce.length}</span>
              <span>مرتين: {visitsTwice.length}</span>
              <span>3+: {visitsThrice.length}</span>
            </div>
          </div>
          <div className="plans-tabs plans-tabs-soft">
            <button
              type="button"
              className={visitBucket === '1' ? 'active' : ''}
              onClick={() => setVisitBucket('1')}
            >
              فاتورة واحدة ({visitsOnce.length})
            </button>
            <button
              type="button"
              className={visitBucket === '2' ? 'active' : ''}
              onClick={() => setVisitBucket('2')}
            >
              فاتورتان ({visitsTwice.length})
            </button>
            <button
              type="button"
              className={visitBucket === '3plus' ? 'active' : ''}
              onClick={() => setVisitBucket('3plus')}
            >
              3 فواتير فأكثر ({visitsThrice.length})
            </button>
          </div>
          <div className="plans-table-card tight">
            <table>
              <thead>
                <tr>
                  <th>الصيدلية</th>
                  <th>المنطقة</th>
                  <th>الزيارات (= فواتير)</th>
                  <th>آخر زيارة</th>
                  <th>المندوب</th>
                </tr>
              </thead>
              <tbody>
                {visitRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="plans-empty">
                      لا صيدليات في هذا التصنيف
                    </td>
                  </tr>
                ) : (
                  visitRows.map((row) => (
                    <tr key={`${row.pharmacyId}-${row.repId}`}>
                      <td>
                        <strong>{row.pharmacyName}</strong>
                      </td>
                      <td>{row.regionLabel}</td>
                      <td>
                        <span className="badge done">{row.visitCount}</span>
                      </td>
                      <td>{row.lastVisitAt}</td>
                      <td>{row.repName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {showSales ? (
        <section className="plans-detail-block">
          <div className="plans-detail-head">
            <div>
              <h3>تفصيل المبيعات</h3>
              <p>كل صيدلية · القيمة حسب الشركة (كل فاتورة تسجّل زيارة)</p>
            </div>
            <div className="plans-mini-stats">
              <span>الإجمالي: {money(salesTotal)}</span>
              <span>أسطر: {sales.length}</span>
            </div>
          </div>
          <div className="plans-table-card tight">
            <table>
              <thead>
                <tr>
                  <th>الصيدلية</th>
                  <th>الشركة</th>
                  <th>قيمة المبيعات</th>
                  <th>عدد الفواتير</th>
                  <th>المندوب</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="plans-empty">
                      لا بيانات مبيعات بعد
                    </td>
                  </tr>
                ) : (
                  sales.map((row, idx) => (
                    <tr key={`${row.pharmacyId}-${row.companyName}-${idx}`}>
                      <td>
                        <strong>{row.pharmacyName}</strong>
                      </td>
                      <td>{row.companyName}</td>
                      <td>
                        <strong>{money(row.amount)}</strong>
                      </td>
                      <td>{row.invoicesCount}</td>
                      <td>{row.repName}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {sales.length > 0 ? (
                <tfoot>
                  <tr>
                    <td colSpan={2}>
                      <strong>المجموع</strong>
                    </td>
                    <td>
                      <strong>{money(salesTotal)}</strong>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </section>
      ) : null}

      {showCollections ? (
        <section className="plans-detail-block">
          <div className="plans-detail-head">
            <div>
              <h3>تفصيل التحصيل</h3>
              <p>كل صيدلية · المبلغ المحصّل وطريقة الدفع</p>
            </div>
            <div className="plans-mini-stats">
              <span>الإجمالي: {money(collectionsTotal)}</span>
              <span>عمليات: {collections.length}</span>
            </div>
          </div>
          <div className="plans-table-card tight">
            <table>
              <thead>
                <tr>
                  <th>الصيدلية</th>
                  <th>المبلغ</th>
                  <th>طريقة التحصيل</th>
                  <th>التاريخ</th>
                  <th>المندوب</th>
                </tr>
              </thead>
              <tbody>
                {collections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="plans-empty">
                      لا بيانات تحصيل بعد
                    </td>
                  </tr>
                ) : (
                  collections.map((row, idx) => (
                    <tr key={`${row.pharmacyId}-${row.collectedAt}-${idx}`}>
                      <td>
                        <strong>{row.pharmacyName}</strong>
                      </td>
                      <td>
                        <strong>{money(row.amount)}</strong>
                      </td>
                      <td>
                        <span className="badge draft">{row.method}</span>
                      </td>
                      <td>{row.collectedAt}</td>
                      <td>{row.repName}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {collections.length > 0 ? (
                <tfoot>
                  <tr>
                    <td>
                      <strong>المجموع</strong>
                    </td>
                    <td>
                      <strong>{money(collectionsTotal)}</strong>
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </section>
      ) : null}

      {showPharmacies ? (
        <section className="plans-detail-block">
          <div className="plans-detail-head">
            <div>
              <h3>الصيدليات المحققة</h3>
              <p>
                صيدليات فريدة ({pharmacies.length}) — تكرار البيع يزيد الزيارات
                فقط
              </p>
            </div>
            <div className="plans-mini-stats">
              <span>العدد: {pharmacies.length}</span>
              <span>زيارات مرتبطة: {totalVisitCount(pharmacies)}</span>
            </div>
          </div>
          <div className="plans-table-card tight">
            <table>
              <thead>
                <tr>
                  <th>الصيدلية</th>
                  <th>المنطقة</th>
                  <th>أول بيع/زيارة</th>
                  <th>فواتير (= زيارات)</th>
                  <th>المندوب</th>
                </tr>
              </thead>
              <tbody>
                {pharmacies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="plans-empty">
                      لا صيدليات محققة بعد
                    </td>
                  </tr>
                ) : (
                  pharmacies.map((row) => (
                    <tr key={`${row.pharmacyId}-${row.repId}`}>
                      <td>
                        <strong>{row.pharmacyName}</strong>
                      </td>
                      <td>{row.regionLabel}</td>
                      <td>{row.firstVisitAt}</td>
                      <td>
                        <span className="badge ok">{row.visitCount}</span>
                      </td>
                      <td>{row.repName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!showVisits && !showSales && !showCollections && !showPharmacies ? (
        <p className="plans-sub">لا أهداف تفصيلية قابلة للعرض في هذه الخطة.</p>
      ) : null}
    </div>
  )
}
