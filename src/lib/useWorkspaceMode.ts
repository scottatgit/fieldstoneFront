'use client';
import { useEffect, useState } from 'react';
import { isDemoMode } from './demoApi';

export type WorkspaceMode = 'intelligence' | 'operations';

export interface WorkspaceModeState {
  mode:        WorkspaceMode;
  opsEligible: boolean;
  loading:     boolean;
}

/**
 * MODE-004: Fetch workspace mode from GET /api/workspace/mode.
 * Returns { mode, opsEligible, loading }.
 *
 * Fail-open: any fetch error defaults to 'operations' so the UI
 * does not silently block users — server enforcement (MODE-003) is
 * the real gate.
 *
 * Demo mode: skips fetch, defaults to 'operations'.
 */
export function useWorkspaceMode(): WorkspaceModeState {
  const [state, setState] = useState<WorkspaceModeState>({
    mode:        'operations',
    opsEligible: false,
    loading:     true,
  });

  useEffect(() => {
    // Demo mode: no workspace context, default to operations
    if (isDemoMode()) {
      setState({ mode: 'operations', opsEligible: false, loading: false });
      return;
    }

    let cancelled = false;

    async function fetchMode() {
      try {
        const res = await fetch('/pm-api/api/workspace/mode', {
          method:      'GET',
          credentials: 'include',
          headers: {
            // Tenant slug injected by Next.js middleware via x-tenant-slug;
            // on localhost this header is absent and the API falls back to
            // the dev workspace — acceptable for local dev.
          },
        });

        if (!res.ok) {
          // Non-200: fail open to operations
          if (!cancelled) setState({ mode: 'operations', opsEligible: false, loading: false });
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setState({
            mode:        data.workspace_mode === 'intelligence' ? 'intelligence' : 'operations',
            opsEligible: Boolean(data.ops_mode_eligible),
            loading:     false,
          });
        }
      } catch {
        // Network error: fail open to operations
        if (!cancelled) setState({ mode: 'operations', opsEligible: false, loading: false });
      }
    }

    fetchMode();
    return () => { cancelled = true; };
  }, []);

  return state;
}
