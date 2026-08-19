import { describe, expect, it } from 'vitest'

import { getAuthDatasource } from './auth/data'
import { getUsersDatasource } from './users/data'
import { getPermissionsDatasource } from './permissions/data'
import { getTargetsDatasource } from './targets/data'
import { getOffersDatasource } from './offers/data'
import { getRatesDatasource } from './rates/data'
import { getPlansDatasource } from './plans/data'
import { getEvaluationDatasource } from './evaluation/data'
import { getFinanceDatasource } from './finance/data'
import { getCompensationDatasource } from './compensation/data'
import { getWarehouseDatasource } from './warehouse/data'
import { getNotificationsDatasource } from './notifications/data'
import { getReportsDatasource } from './reports/data'
import { getRegionsDatasource } from './regions/data'
import { getDashboardDatasource } from './dashboard/data'

/**
 * Smoke coverage for supervisor UC packages from Desktop use-case docs.
 * Ignores later custom extras.
 */
describe('Supervisor UC smoke', () => {
  it('UC-01/02 login', async () => {
    const session = await getAuthDatasource().login('supervisor', '123456')
    expect(session.user.name).toBeTruthy()
    expect(session.message).toContain('نجاح')
  })

  it('UC-09..19 users / permissions / targets', async () => {
    const users = await getUsersDatasource().getOverview()
    expect(users.reps.length).toBeGreaterThan(0)
    expect(users.invoicers.length).toBeGreaterThan(0)

    const permissions = await getPermissionsDatasource().getMatrix()
    expect(permissions.roles.length).toBeGreaterThan(0)

    const targets = await getTargetsDatasource().getBoard()
    expect(targets.repOptions.length).toBeGreaterThan(0)
  })

  it('UC-20..33 offers / baskets', async () => {
    const board = await getOffersDatasource().getBoard()
    expect(board.baskets.length).toBeGreaterThan(0)
  })

  it('UC-55..70 finance board', async () => {
    const board = await getFinanceDatasource().getBoard()
    expect(board).toBeTruthy()
  })

  it('UC-72..83 evaluation', async () => {
    const board = await getEvaluationDatasource().getBoard({
      repId: '',
      from: '2026-08-01',
      to: '2026-08-31',
      mainRegionId: null,
      subRegionId: null,
    })
    expect(board.mainRegionOptions.length).toBeGreaterThan(0)
  })

  it('UC-84..96 company/product rates', async () => {
    const board = await getRatesDatasource().getBoard()
    expect(board.companyRates.length).toBeGreaterThan(0)
  })

  it('UC-97..113 work plans', async () => {
    const board = await getPlansDatasource().getBoard()
    expect(board.plans.length).toBeGreaterThan(0)
  })

  it('UC-114..123 warehouse', async () => {
    const board = await getWarehouseDatasource().getBoard()
    expect(board).toBeTruthy()
  })

  it('UC-124..134 notifications + reports', async () => {
    const feed = await getNotificationsDatasource().getFeed()
    expect(feed.items.length).toBeGreaterThan(0)

    const reports = await getReportsDatasource().getBoard()
    expect(reports).toBeTruthy()
  })

  it('UC-135..141 compensation', async () => {
    const board = await getCompensationDatasource().getBoard()
    expect(board).toBeTruthy()
  })

  it('regions + dashboard load', async () => {
    const regions = await getRegionsDatasource().getOverview()
    expect(regions.regions.length).toBeGreaterThan(0)

    const dash = await getDashboardDatasource().getOverview()
    expect(dash).toBeTruthy()
  })
})
