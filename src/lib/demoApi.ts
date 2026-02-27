import {
  DEMO_TICKETS,
  DEMO_CALENDAR_EVENTS,
  DEMO_SUMMARY,
  DEMO_OUTBREAKS,
  DEMO_TOOL_SCORES,
  DEMO_STATS,
} from './demoData';

/**
 * Returns true when NEXT_PUBLIC_DEMO_MODE=true is set.
 * Works in both browser and server-side Next.js contexts.
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Drop-in replacement for fetch(...).then(r => r.json())
 * Matches every PM API endpoint and returns pre-seeded demo data.
 * Adds a small simulated network delay so the UI feels live.
 */
export async function demoFetch(endpoint: string): Promise<unknown> {
  // Simulated network latency (makes spinners feel real)
  await new Promise(r => setTimeout(r, 120 + Math.random() * 180));

  // ── Tickets ──────────────────────────────────────────────────────────────
  if (endpoint.includes('/api/tickets')) {
    return { tickets: DEMO_TICKETS };
  }

  // ── Calendar ─────────────────────────────────────────────────────────────
  if (endpoint.includes('/api/calendar')) {
    return { events: DEMO_CALENDAR_EVENTS };
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  if (endpoint.includes('/api/summary')) {
    // Freshen the timestamp each call so it looks live
    return { ...DEMO_SUMMARY, last_updated: new Date().toISOString() };
  }

  // ── Intel: active outbreaks ───────────────────────────────────────────────
  if (endpoint.includes('/api/intel/outbreaks')) {
    return { events: DEMO_OUTBREAKS };
  }

  // ── Intel: run cycle (POST) — no-op in demo ────────────────────────────
  if (endpoint.includes('/api/intel/run')) {
    return { status: 'ok', message: 'Demo mode — intel cycle simulated.' };
  }

  // ── At-risk clients ───────────────────────────────────────────────────────
  if (endpoint.includes('/api/intel/atrisk')) {
    return {
      at_risk: [
        { client_name: 'Westside Pediatric Dental', tool_id: 'eaglesoft', reason: 'Same OS/Eaglesoft version as affected practices' },
        { client_name: 'Coastal Kids Dentistry',    tool_id: 'eaglesoft', reason: 'Eaglesoft 21.x + Windows 11 22H2 — patch not yet applied' },
      ],
    };
  }

  // ── Tool / node risk scores ───────────────────────────────────────────────
  if (endpoint.includes('/api/nodes/tools')) {
    return { tools: DEMO_TOOL_SCORES };
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  if (endpoint.includes('/api/stats')) {
    return DEMO_STATS;
  }

  // ── Prep brief (drawer) ───────────────────────────────────────────────────
  if (endpoint.includes('/api/prep-brief') || endpoint.includes('/api/brief')) {
    return {
      brief:
        '**Situation**: Active Eaglesoft outbreak affecting 3 practices. Root cause: KB5034441 ' +
        'conflicts with Patterson SQL Server 2019.\n\n' +
        '**Immediate Action**: Rollback KB5034441 on affected workstations. Restart Patterson SQL service.\n\n' +
        '**At-Risk**: Westside Pediatric + Coastal Kids — same environment. Proactive call recommended today.\n\n' +
        '**Client Mood**: Heritage Smiles trust declining — 2nd incident this month. Prioritize comms.\n\n' +
        '**Wins Today**: Resolved ransomware scare at Pinnacle Dental (false positive). Renewed Malwarebytes. Client relieved.',
    };
  }

  // ── Chat / AI (no-op in demo) ─────────────────────────────────────────────
  if (endpoint.includes('/api/chat') || endpoint.includes('/api/ai')) {
    return {
      response:
        '🎭 **Demo Mode** — In the live system, SecondBrain AI would answer your question here ' +
        'with full context from your ticket queue, client signals, and knowledge base.\n\n' +
        'Try the real thing at [fieldstone.pro](https://fieldstone.pro).',
    };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  console.warn('[demoApi] Unmatched endpoint:', endpoint);
  return {};
}

/**
 * Unified fetch wrapper — use this everywhere instead of raw fetch().
 * Automatically routes to demo data when NEXT_PUBLIC_DEMO_MODE=true.
 *
 * Usage:
 *   const data = await pmFetch('/api/tickets');
 */
export async function pmFetch(endpoint: string, apiBase: string): Promise<unknown> {
  if (isDemoMode()) {
    return demoFetch(endpoint);
  }
  const res = await fetch(`${apiBase}${endpoint}`);
  if (!res.ok) throw new Error(`PM API error: ${res.status} ${res.statusText}`);
  return res.json();
}
