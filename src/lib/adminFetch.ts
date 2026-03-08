'use client'
/**
 * Phase 36A: adminFetch — JWT-authenticated wrapper for /api/admin/* requests.
 *
 * Attaches a Clerk session JWT as Authorization: Bearer <token> so that
 * FastAPI can verify it via JWKS without trusting any custom headers.
 *
 * Usage:
 *   const data = await adminFetch('/api/admin/tenants')
 *   const data = await adminFetch('/api/admin/tenants', { method: 'POST', body: JSON.stringify({...}) })
 */
import { useAuth } from '@clerk/nextjs'

/**
 * React hook that returns a JWT-aware fetch wrapper.
 * Must be called inside a Client Component.
 */
export function useAdminFetch() {
  const { getToken } = useAuth()

  return async function adminFetch(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<unknown> {
    const token = await getToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw Object.assign(new Error(err.detail ?? 'admin_fetch_error'), { status: res.status })
    }

    return res.json()
  }
}

/**
 * Server-side / non-hook version for use in Server Components or utility files.
 * Accepts the token directly (obtained via `auth().getToken()` in a Server Component).
 */
export async function adminFetchWithToken(
  endpoint: string,
  token: string | null,
  options: RequestInit = {}
): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const baseUrl = process.env.NEXT_PUBLIC_PM_API_URL?.replace('/pm-api', '') ?? ''
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`

  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw Object.assign(new Error(err.detail ?? 'admin_fetch_error'), { status: res.status })
  }

  return res.json()
}
