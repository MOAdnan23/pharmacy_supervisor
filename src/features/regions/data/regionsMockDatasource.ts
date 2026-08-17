import type {
  CreateMainRegionInput,
  CreateSubRegionInput,
  MainRegion,
  RegionsOverview,
  UpdateMainRegionInput,
  UpdateSubRegionInput,
} from '../domain/regionEntities'
import type { RegionsDatasource } from './regionsDatasource'

/** نفس هيكل mock المفوتر (regions.json) كنقطة بداية */
let regions: MainRegion[] = [
  {
    id: 'damascus',
    name: 'دمشق',
    status: 'active',
    subRegions: [
      { id: 'mazzeh', name: 'المزة', mainRegionId: 'damascus', status: 'active' },
      {
        id: 'kafrsouseh',
        name: 'كفرسوسة',
        mainRegionId: 'damascus',
        status: 'active',
      },
      { id: 'malki', name: 'المالكي', mainRegionId: 'damascus', status: 'active' },
    ],
  },
  {
    id: 'rif-dimashq',
    name: 'ريف دمشق',
    status: 'active',
    subRegions: [
      {
        id: 'jaramana',
        name: 'جرمانا',
        mainRegionId: 'rif-dimashq',
        status: 'active',
      },
      {
        id: 'qadsaya',
        name: 'قدسيا',
        mainRegionId: 'rif-dimashq',
        status: 'active',
      },
    ],
  },
  {
    id: 'aleppo',
    name: 'حلب',
    status: 'active',
    subRegions: [
      {
        id: 'aziziyah',
        name: 'العزيزية',
        mainRegionId: 'aleppo',
        status: 'active',
      },
      {
        id: 'salahuddin',
        name: 'صلاح الدين',
        mainRegionId: 'aleppo',
        status: 'active',
      },
    ],
  },
]

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`
}

function overview(): RegionsOverview {
  const totalSub = regions.reduce((s, r) => s + r.subRegions.length, 0)
  const activeSub = regions.reduce(
    (s, r) =>
      s +
      (r.status === 'active'
        ? r.subRegions.filter((x) => x.status === 'active').length
        : 0),
    0,
  )
  return {
    regions: regions.map((r) => ({
      ...r,
      subRegions: [...r.subRegions],
    })),
    totalMain: regions.length,
    totalSub,
    activeMain: regions.filter((r) => r.status === 'active').length,
    activeSub,
  }
}

function assertUniqueMainName(name: string, ignoreId?: string) {
  const exists = regions.some(
    (r) => r.name === name && r.id !== ignoreId,
  )
  if (exists) throw new Error('اسم المنطقة الرئيسية مستخدم مسبقاً')
}

function assertUniqueSubName(
  mainRegionId: string,
  name: string,
  ignoreId?: string,
) {
  const main = regions.find((r) => r.id === mainRegionId)
  if (!main) throw new Error('المنطقة الرئيسية غير موجودة')
  const exists = main.subRegions.some(
    (s) => s.name === name && s.id !== ignoreId,
  )
  if (exists) throw new Error('اسم المنطقة الفرعية مستخدم ضمن هذه المنطقة')
}

export const regionsMockDatasource: RegionsDatasource = {
  async getOverview() {
    return overview()
  },

  async createMainRegion(input: CreateMainRegionInput) {
    const name = input.name.trim()
    if (!name) throw new Error('اسم المنطقة مطلوب')
    assertUniqueMainName(name)
    regions = [
      ...regions,
      {
        id: nextId('region'),
        name,
        status: 'active',
        subRegions: [],
      },
    ]
  },

  async updateMainRegion(input: UpdateMainRegionInput) {
    const name = input.name.trim()
    if (!name) throw new Error('اسم المنطقة مطلوب')
    assertUniqueMainName(name, input.id)
    const idx = regions.findIndex((r) => r.id === input.id)
    if (idx < 0) throw new Error('المنطقة غير موجودة')
    const current = regions[idx]
    const nextSubs =
      input.status === 'inactive'
        ? current.subRegions.map((s) => ({ ...s, status: 'inactive' as const }))
        : current.subRegions
    regions = [
      ...regions.slice(0, idx),
      { ...current, name, status: input.status, subRegions: nextSubs },
      ...regions.slice(idx + 1),
    ]
  },

  async createSubRegion(input: CreateSubRegionInput) {
    const name = input.name.trim()
    if (!name) throw new Error('اسم المنطقة الفرعية مطلوب')
    assertUniqueSubName(input.mainRegionId, name)
    regions = regions.map((r) => {
      if (r.id !== input.mainRegionId) return r
      return {
        ...r,
        subRegions: [
          ...r.subRegions,
          {
            id: nextId('sub'),
            name,
            mainRegionId: r.id,
            status: 'active' as const,
          },
        ],
      }
    })
  },

  async updateSubRegion(input: UpdateSubRegionInput) {
    const name = input.name.trim()
    if (!name) throw new Error('اسم المنطقة الفرعية مطلوب')
    const parent = regions.find((r) =>
      r.subRegions.some((s) => s.id === input.id),
    )
    if (!parent) throw new Error('المنطقة الفرعية غير موجودة')
    assertUniqueSubName(parent.id, name, input.id)
    regions = regions.map((r) => {
      if (r.id !== parent.id) return r
      return {
        ...r,
        subRegions: r.subRegions.map((s) =>
          s.id === input.id ? { ...s, name, status: input.status } : s,
        ),
      }
    })
  },
}
