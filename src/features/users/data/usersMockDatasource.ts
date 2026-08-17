import type {
  CreateUserInput,
  ManagedUser,
  UpdateUserInput,
  UserStatus,
  UsersOverview,
  UsersSummary,
} from '../domain/userEntities'
import type { UsersDatasource } from './usersDatasource'

/** قائمة وهمية في الذاكرة — تتغير أثناء تشغيل التطبيق */
let users: ManagedUser[] = [
  {
    id: 'r1',
    name: 'ياسين العمودي',
    username: 'yassin',
    password: 'rep1234',
    phone: '0944111222',
    region: 'دمشق',
    governorate: 'دمشق',
    residence: 'المزة',
    role: 'rep',
    status: 'active',
    pharmacyCount: 14,
    companies: [
      'شركة دمشق فارما',
      'شركة حلب ميديكال',
      'شركة ابن سينا',
    ],
    monthlyTarget: 25000000,
    createdAt: '2026-01-10',
  },
  {
    id: 'r2',
    name: 'محمد الشهري',
    username: 'mohammad',
    password: 'rep5678',
    phone: '0933444555',
    region: 'حلب',
    governorate: 'حلب',
    residence: 'الجميلية',
    role: 'rep',
    status: 'active',
    pharmacyCount: 9,
    companies: ['شركة دمشق فارما', 'شركة الشام للدواء', 'شركة حلب ميديكال'],
    monthlyTarget: 18000000,
    createdAt: '2026-02-02',
  },
  {
    id: 'r3',
    name: 'سامر الحسن',
    username: 'samer',
    password: 'rep9999',
    phone: '0955666777',
    region: 'حمص',
    governorate: 'حمص',
    role: 'rep',
    status: 'suspended',
    pharmacyCount: 5,
    companies: ['شركة ابن سينا', 'شركة الشام للدواء'],
    monthlyTarget: 12000000,
    createdAt: '2025-11-20',
  },
  {
    id: 'i1',
    name: 'لينا مفوتر',
    username: 'lina_inv',
    password: 'inv1234',
    phone: '0999888777',
    region: 'المستودع',
    role: 'invoicer',
    status: 'active',
    pharmacyCount: 0,
    companies: [],
    monthlyTarget: 0,
    createdAt: '2026-01-05',
  },
  {
    id: 'i2',
    name: 'كريم مفوتر',
    username: 'karim_inv',
    password: 'inv5678',
    phone: '0988777666',
    region: 'المستودع',
    role: 'invoicer',
    status: 'active',
    pharmacyCount: 0,
    companies: [],
    monthlyTarget: 0,
    createdAt: '2026-03-01',
  },
]

let seq = 10

function buildSummary(list: ManagedUser[]): UsersSummary {
  const reps = list.filter((u) => u.role === 'rep')
  const invoicers = list.filter((u) => u.role === 'invoicer')
  return {
    repsTotal: reps.length,
    repsActive: reps.filter((u) => u.status === 'active').length,
    repsSuspended: reps.filter((u) => u.status === 'suspended').length,
    invoicersTotal: invoicers.length,
    usersTotal: list.length,
  }
}

function overview(): UsersOverview {
  return {
    summary: buildSummary(users),
    reps: users.filter((u) => u.role === 'rep'),
    invoicers: users.filter((u) => u.role === 'invoicer'),
  }
}

function assertUnique(username: string, phone: string, exceptId?: string) {
  const clash = users.find(
    (u) =>
      u.id !== exceptId &&
      (u.username.toLowerCase() === username.toLowerCase() || u.phone === phone),
  )
  if (clash) {
    throw new Error('اسم المستخدم أو رقم الهاتف مستخدم مسبقاً')
  }
}

/** قراءة المندوبين لاستخدامهم في تبويب التارغت */
export function listRepOptionsFromUsers(): {
  id: string
  name: string
  companies: string[]
}[] {
  return users
    .filter((u) => u.role === 'rep')
    .map((u) => ({ id: u.id, name: u.name, companies: [...u.companies] }))
}

/** مزامنة التارغت على بطاقة المندوب (جدول المندوبين) */
export function syncRepTargetsOnUser(
  repId: string,
  monthlyTarget: number,
): void {
  const index = users.findIndex((u) => u.id === repId && u.role === 'rep')
  if (index < 0) return
  users[index] = {
    ...users[index],
    monthlyTarget,
  }
}

export const usersMockDatasource: UsersDatasource = {
  async getOverview() {
    await delay(200)
    return overview()
  },

  async createUser(input: CreateUserInput) {
    await delay(250)
    const name = input.name.trim()
    const username = input.username.trim()
    const password = input.password.trim()
    const phone = input.phone.trim()
    const region = input.region.trim()

    if (!name || !username || !password || !phone || !region) {
      throw new Error('أكمل الحقول المطلوبة')
    }
    assertUnique(username, phone)

    const user: ManagedUser = {
      id: `${input.role === 'rep' ? 'r' : 'i'}${seq++}`,
      name,
      username,
      password,
      phone,
      region,
      governorate: input.governorate?.trim() || undefined,
      residence: input.residence?.trim() || undefined,
      role: input.role,
      status: input.status ?? 'active',
      pharmacyCount: 0,
      companies: [],
      monthlyTarget: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    users = [user, ...users]
  },

  async updateUser(id: string, input: UpdateUserInput) {
    await delay(250)
    const index = users.findIndex((u) => u.id === id)
    if (index < 0) throw new Error('المستخدم غير موجود')

    const name = input.name.trim()
    const username = input.username.trim()
    const password = input.password.trim()
    const phone = input.phone.trim()
    const region = input.region.trim()
    if (!name || !username || !password || !phone || !region) {
      throw new Error('أكمل الحقول المطلوبة')
    }
    assertUnique(username, phone, id)

    users[index] = {
      ...users[index],
      name,
      username,
      password,
      phone,
      region,
      governorate: input.governorate?.trim() || undefined,
      residence: input.residence?.trim() || undefined,
      status: input.status,
    }
  },

  async setStatus(id: string, status: UserStatus) {
    await delay(150)
    const index = users.findIndex((u) => u.id === id)
    if (index < 0) throw new Error('المستخدم غير موجود')
    users[index] = { ...users[index], status }
  },

  async deleteUser(id: string) {
    await delay(150)
    const exists = users.some((u) => u.id === id)
    if (!exists) throw new Error('المستخدم غير موجود')
    // soft delete مبسّط في Mock: إزالة من القائمة النشطة
    users = users.filter((u) => u.id !== id)
  },
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
