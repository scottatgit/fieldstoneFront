/**
 * adminFetch — cookie-authenticated wrapper for /api/admin/* requests.
 * Signal auth: signal_token HttpOnly cookie sent automatically via credentials:'include'.
 * No Authorization header needed — FastAPI reads the cookie.
 */
'use client'

/**
 * React hook that returns a cookie-aware fetch wrapper.
 * Must be called inside a Client Component.
 */
export function useAdminFetch() {
  return async function adminFetch(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    const res = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include',  // sends signal_token cookie automatically
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw Object.assign(new Error(err.detail ?? 'admin_fetch_error'), { status: res.status });
    }

    return res.json();
  };
}

/**
 * Non-hook version for utility files.
 * Cookie is sent automatically via credentials:'include'.
 */
export async function adminFetchDirect(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const baseUrl = process.env.NEXT_PUBLIC_PM_API_URL?.replace('/pm-api', '') ?? '';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const res = await fetch(url, { ...options, headers, credentials: 'include' });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(err.detail ?? 'admin_fetch_error'), { status: res.status });
  }

  return res.json();
}

// Legacy alias — remove after full migration
export const adminFetchWithToken = adminFetchDirect;
