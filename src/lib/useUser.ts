/**
 * useUser — Signal custom auth hook.
 * Replaces Clerk's useAuth(). Calls /api/auth/me with credentials:include.
 * Cookie is HttpOnly and set by FastAPI — we just need to know if user is logged in.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SignalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string | null;
  slug: string | null;
  tenant_name: string | null;
  email_verified: boolean;
}

interface UseUserResult {
  user: SignalUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  refresh: () => Promise<void>;
}

let _cache: { user: SignalUser | null; ts: number } | null = null;
const CACHE_TTL_MS = 30_000; // 30 seconds

export function useUser(): UseUserResult {
  const [user, setUser]       = useState<SignalUser | null>(null);
  const [isLoaded, setLoaded] = useState(false);

  const fetchUser = useCallback(async () => {
    // Serve from cache if fresh
    if (_cache && Date.now() - _cache.ts < CACHE_TTL_MS) {
      setUser(_cache.user);
      setLoaded(true);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data: SignalUser = await res.json();
        // Normalize: email_verified defaults to true for legacy users
        if (data.email_verified === undefined) {
          (data as SignalUser).email_verified = true;
        }
        _cache = { user: data, ts: Date.now() };
        setUser(data);
      } else {
        _cache = { user: null, ts: Date.now() };
        setUser(null);
      }
    } catch {
      _cache = { user: null, ts: Date.now() };
      setUser(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { void fetchUser(); }, [fetchUser]);

  return {
    user,
    isLoaded,
    isSignedIn: user !== null,
    refresh: async () => {
      _cache = null; // bust cache
      await fetchUser();
    },
  };
}

/** Convenience: clear the in-memory cache (e.g. after logout). */
export function clearUserCache() {
  _cache = null;
}
