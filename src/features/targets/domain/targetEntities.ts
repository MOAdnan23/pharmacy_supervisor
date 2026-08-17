export type RepTargetStatus = 'achieved' | 'in_progress' | 'not_achieved'

export type CompanyTargetStatus = 'active' | 'suspended' | 'archived'

/** سطر تارغت مندوب لشركة واحدة ضمن شهر */
export type RepCompanyLine = {
  companyName: string
  target: number
  achieved: number
}

/** تارغت مندوب شهري = مجموع تارغت الشركات */
export type RepTarget = {
  id: string
  repId: string
  repName: string
  month: string // YYYY-MM
  lines: RepCompanyLine[]
  /** مجموع تارغت الشركات */
  monthlyTarget: number
  /** مجموع المحقق */
  achieved: number
  status: RepTargetStatus
}

/** تارغت شركة عام شهري (UC-18 / UC-19) */
export type CompanyTarget = {
  id: string
  companyName: string
  amount: number
  startDate: string
  endDate: string
  status: CompanyTargetStatus
}

export type TargetsBoard = {
  repTargets: RepTarget[]
  companyTargets: CompanyTarget[]
  /** مندوبون + شركاتهم المرتبطة فقط */
  repOptions: { id: string; name: string; companies: string[] }[]
  companyOptions: string[]
}

export type SetRepTargetLineInput = {
  companyName: string
  target: number
}

export type SetRepTargetInput = {
  repId: string
  month: string
  lines: SetRepTargetLineInput[]
}

export type UpsertCompanyTargetInput = {
  id?: string
  companyName: string
  amount: number
  startDate: string
  endDate: string
  status?: CompanyTargetStatus
}
