import type {
  CreateMainRegionInput,
  CreateSubRegionInput,
  RegionsOverview,
  UpdateMainRegionInput,
  UpdateSubRegionInput,
} from '../domain/regionEntities'

export type RegionsDatasource = {
  getOverview(): Promise<RegionsOverview>
  createMainRegion(input: CreateMainRegionInput): Promise<void>
  updateMainRegion(input: UpdateMainRegionInput): Promise<void>
  createSubRegion(input: CreateSubRegionInput): Promise<void>
  updateSubRegion(input: UpdateSubRegionInput): Promise<void>
}
