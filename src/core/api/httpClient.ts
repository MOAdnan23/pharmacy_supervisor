/**
 * عميل HTTP — يستخرج رسائل الباكند للعرض، بدون أرقام حالة أو روابط.
 */
import { appConfig } from '../config'
import {
  fallbackHttpMessage,
  networkErrorMessage,
  pickApiMessage,
} from './apiMessages'

export class HttpError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string | null
}

async function readBody(response: Response): Promise<unknown> {
  const raw = await response.text()
  if (!raw.trim()) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export async function httpRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  let response: Response
  try {
    response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new HttpError(networkErrorMessage())
  }

  const payload = await readBody(response)

  if (!response.ok) {
    const fromBackend = pickApiMessage(payload)
    throw new HttpError(
      fromBackend ?? fallbackHttpMessage(response.status),
      response.status,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (payload ?? undefined) as T
}

/** رسالة نجاح من رد الباكند إن وُجدت، وإلا النص الاحتياطي */
export function successMessageFrom(
  payload: unknown,
  fallback: string,
): string {
  return pickApiMessage(payload, fallback) ?? fallback
}
