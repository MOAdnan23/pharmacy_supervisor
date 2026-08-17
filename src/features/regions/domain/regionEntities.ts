/** حالة المنطقة / الفرعية — مطابقة للباك RegionStatus */
export type RegionStatus = 'active' | 'inactive'

export type SubRegion = {
  id: string
  name: string
  mainRegionId: string
  status: RegionStatus
}

/** منطقة رئيسية + فروعها (مثل اختيار الصيدلية في المفوتر) */
export type MainRegion = {
  id: string
  name: string
  status: RegionStatus
  subRegions: SubRegion[]
}

export type RegionsOverview = {
  regions: MainRegion[]
  totalMain: number
  totalSub: number
  activeMain: number
  activeSub: number
}

export type CreateMainRegionInput = {
  name: string
}

export type UpdateMainRegionInput = {
  id: string
  name: string
  status: RegionStatus
}

export type CreateSubRegionInput = {
  mainRegionId: string
  name: string
}

export type UpdateSubRegionInput = {
  id: string
  name: string
  status: RegionStatus
}
