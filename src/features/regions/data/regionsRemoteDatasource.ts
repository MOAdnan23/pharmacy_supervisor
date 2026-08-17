import { apiEndpoints } from '../../../core/api/apiEndpoints'
import { httpRequest } from '../../../core/api/httpClient'
import type {
  CreateMainRegionInput,
  CreateSubRegionInput,
  MainRegion,
  RegionStatus,
  RegionsOverview,
  SubRegion,
  UpdateMainRegionInput,
  UpdateSubRegionInput,
} from '../domain/regionEntities'
import type { RegionsDatasource } from './regionsDatasource'

type ApiSub = {
  id: string | number
  name: string
  status?: RegionStatus
  region_id?: string | number
}

type ApiRegion = {
  id: string | number
  name: string
  status?: RegionStatus
  sub_regions?: ApiSub[]
  subRegions?: ApiSub[]
}

function mapSub(mainId: string, s: ApiSub): SubRegion {
  return {
    id: String(s.id),
    name: s.name,
    mainRegionId: String(s.region_id ?? mainId),
    status: s.status === 'inactive' ? 'inactive' : 'active',
  }
}

function mapMain(r: ApiRegion): MainRegion {
  const id = String(r.id)
  const subs = r.sub_regions ?? r.subRegions ?? []
  return {
    id,
    name: r.name,
    status: r.status === 'inactive' ? 'inactive' : 'active',
    subRegions: subs.map((s) => mapSub(id, s)),
  }
}

function toOverview(list: MainRegion[]): RegionsOverview {
  return {
    regions: list,
    totalMain: list.length,
    totalSub: list.reduce((n, r) => n + r.subRegions.length, 0),
    activeMain: list.filter((r) => r.status === 'active').length,
  }
}

/**
 * Remote جاهز لاحقاً — لن يُستدعى ما دام useRemoteRegions = false.
 * مسارات الباك: GET/POST /regions ، PATCH /regions/{id} ،
 * POST /regions/{id}/sub-regions ، PATCH /sub-regions/{id}
 */
export const regionsRemoteDatasource: RegionsDatasource = {
  async getOverview() {
    const raw = await httpRequest<{
      data?: ApiRegion[]
    } & { regions?: ApiRegion[] }>(apiEndpoints.regions.list)

    const list = raw.data ?? raw.regions
    if (!Array.isArray(list)) {
      throw new Error('رد المناطق غير مفهوم')
    }
    return toOverview(list.map(mapMain))
  },

  async createMainRegion(input: CreateMainRegionInput) {
    await httpRequest(apiEndpoints.regions.list, {
      method: 'POST',
      body: { name: input.name.trim() },
    })
  },

  async updateMainRegion(input: UpdateMainRegionInput) {
    await httpRequest(apiEndpoints.regions.byId(input.id), {
      method: 'PATCH',
      body: { name: input.name.trim(), status: input.status },
    })
  },

  async createSubRegion(input: CreateSubRegionInput) {
    await httpRequest(apiEndpoints.regions.subRegions(input.mainRegionId), {
      method: 'POST',
      body: { name: input.name.trim() },
    })
  },

  async updateSubRegion(input: UpdateSubRegionInput) {
    await httpRequest(apiEndpoints.regions.subRegionById(input.id), {
      method: 'PATCH',
      body: { name: input.name.trim(), status: input.status },
    })
  },
}
