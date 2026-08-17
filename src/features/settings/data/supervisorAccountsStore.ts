import type { AuthUser } from '../../auth/domain/user'

export type SupervisorAccount = {
  id: string
  name: string
  username: string
  password: string
  phone: string
  address: string
  avatarUrl: string | null
  createdAt: string
}

const STORAGE_KEY = 'supervisor_accounts_v1'

const DEFAULT_ACCOUNTS: SupervisorAccount[] = [
  {
    id: 'sup-1',
    name: 'المشرف الرئيسي',
    username: 'supervisor',
    password: '123456',
    phone: '0944000000',
    address: 'دمشق — المنطقة الصناعية',
    avatarUrl: null,
    createdAt: '2026-01-01T10:00:00',
  },
]

function readAll(): SupervisorAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS))
      return structuredClone(DEFAULT_ACCOUNTS)
    }
    const parsed = JSON.parse(raw) as SupervisorAccount[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS))
      return structuredClone(DEFAULT_ACCOUNTS)
    }
    return parsed
  } catch {
    return structuredClone(DEFAULT_ACCOUNTS)
  }
}

function writeAll(rows: SupervisorAccount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

export function listSupervisorAccounts(): SupervisorAccount[] {
  return readAll()
}

export function findSupervisorByLogin(
  username: string,
  password: string,
): SupervisorAccount | null {
  const u = username.trim().toLowerCase()
  const p = password.trim()
  return (
    readAll().find(
      (a) =>
        (a.username.toLowerCase() === u || a.phone === username.trim()) &&
        a.password === p,
    ) ?? null
  )
}

export function getSupervisorById(id: string): SupervisorAccount | null {
  return readAll().find((a) => a.id === id) ?? null
}

export function toAuthUser(account: SupervisorAccount): AuthUser {
  return {
    id: account.id,
    name: account.name,
    username: account.username,
    role: 'supervisor',
    phone: account.phone,
    address: account.address,
    avatarUrl: account.avatarUrl,
  }
}

export function updateSupervisorAccount(
  id: string,
  patch: Partial<
    Pick<
      SupervisorAccount,
      'name' | 'username' | 'password' | 'phone' | 'address' | 'avatarUrl'
    >
  >,
): SupervisorAccount {
  const rows = readAll()
  const idx = rows.findIndex((a) => a.id === id)
  if (idx < 0) throw new Error('حساب المشرف غير موجود')
  const next = { ...rows[idx]!, ...patch }
  if (patch.username) {
    const clash = rows.some(
      (a, i) =>
        i !== idx &&
        a.username.toLowerCase() === patch.username!.trim().toLowerCase(),
    )
    if (clash) throw new Error('اسم المستخدم مستخدم مسبقاً')
    next.username = patch.username.trim()
  }
  rows[idx] = next
  writeAll(rows)
  return next
}

export function createSupervisorAccount(input: {
  name: string
  username: string
  password: string
  phone: string
  address: string
}): SupervisorAccount {
  const name = input.name.trim()
  const username = input.username.trim()
  const password = input.password.trim()
  const phone = input.phone.trim()
  const address = input.address.trim()
  if (!name) throw new Error('الاسم مطلوب')
  if (!username) throw new Error('اسم المستخدم مطلوب')
  if (password.length < 4) throw new Error('كلمة المرور قصيرة جداً')
  if (!phone) throw new Error('رقم الهاتف مطلوب')
  if (!address) throw new Error('العنوان مطلوب')

  const rows = readAll()
  if (rows.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('اسم المستخدم مستخدم مسبقاً')
  }
  if (rows.some((a) => a.phone === phone)) {
    throw new Error('رقم الهاتف مستخدم مسبقاً')
  }

  const account: SupervisorAccount = {
    id: `sup-${Date.now().toString(36)}`,
    name,
    username,
    password,
    phone,
    address,
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  }
  rows.unshift(account)
  writeAll(rows)
  return account
}
