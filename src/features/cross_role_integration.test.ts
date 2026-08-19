import { describe, expect, it } from 'vitest'

import { getOffersDatasource } from './offers/data'
import { getPlansDatasource } from './plans/data'
import { getRatesDatasource } from './rates/data'
import { getCompensationDatasource } from './compensation/data'
import { getUsersDatasource } from './users/data'
import { getTargetsDatasource } from './targets/data'
import { getRegionsDatasource } from './regions/data'

/**
 * Cross-role contract checks from the supervisor side.
 * True shared DB is Remote; in Mock we verify conceptual readiness.
 */
describe('Cross-role integration contracts (supervisor side)', () => {
  it('supervisor can manage reps and invoicers used by other apps', async () => {
    const users = await getUsersDatasource().getOverview()
    expect(users.reps.some((r) => r.status === 'active')).toBe(true)
    expect(users.invoicers.some((i) => i.status === 'active')).toBe(true)
  })

  it('offers/baskets exist for rep consumption', async () => {
    const board = await getOffersDatasource().getBoard()
    expect(board.baskets.length).toBeGreaterThan(0)
    expect(board.repOptions.length).toBeGreaterThan(0)
  })

  it('commission rates exist for invoicer payroll calculation', async () => {
    const board = await getRatesDatasource().getBoard()
    expect(board.companyRates.some((r) => r.status === 'active')).toBe(true)
  })

  it('fixed salaries/bonuses exist for invoicer payroll sheets', async () => {
    const board = await getCompensationDatasource().getBoard()
    expect(board).toBeTruthy()
  })

  it('work plans can be assigned to reps', async () => {
    const board = await getPlansDatasource().getBoard()
    expect(board.repOptions.length).toBeGreaterThan(0)
    expect(board.plans.length).toBeGreaterThan(0)
  })

  it('targets are defined per rep/company', async () => {
    const board = await getTargetsDatasource().getBoard()
    expect(board.repOptions.length).toBeGreaterThan(0)
  })

  it('regions tree is available for distribution alignment', async () => {
    const overview = await getRegionsDatasource().getOverview()
    expect(overview.regions.some((r) => r.subRegions.length > 0)).toBe(true)
  })
})
