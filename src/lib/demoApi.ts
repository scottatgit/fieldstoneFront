import type { Ticket } from '../components/pm/types';
import {
  DEMO_TICKETS,
  DEMO_CALENDAR_EVENTS,
  DEMO_SUMMARY,
  DEMO_OUTBREAKS,
  DEMO_TOOL_SCORES,
  DEMO_STATS,
  DEMO_BRIEFS,
  DEMO_INTEL_ENTRIES,
  DEMO_FILTER_OPTIONS,
  DEMO_CONTEXT,
  DEMO_SIGNALS,
} from './demoData';

/**
 * Returns true when NEXT_PUBLIC_DEMO_MODE=true is set.
 * Works in both browser and server-side Next.js contexts.
 */
export function isDemoMode(): boolean {
  // Runtime hostname detection — works without build-time env vars
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.startsWith('demo.')) return true;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    }
  }
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Drop-in replacement for fetch(...).then(r => r.json())
 * Matches every PM API endpoint and returns pre-seeded demo data.
 * Adds a small simulated network delay so the UI feels live.
 */

/** Default tenant identifier until multi-tenant migration is complete. */
export const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'ipquest';

export async function demoFetch(endpoint: string, method = 'GET', body?: unknown): Promise<unknown> {
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

  // ── Prep brief (drawer) — ticket-specific ────────────────────────────────
  if (endpoint.includes('/api/prep-brief') || endpoint.includes('/api/brief')) {
    // Extract ticket key from endpoint e.g. /api/brief/TKT-2891
    const keyMatch = endpoint.match(/\/(TKT-\d+)/);
    const ticketKey = keyMatch ? keyMatch[1] : '';
    const brief = (DEMO_BRIEFS as Record<string, string>)[ticketKey] ||
      `# Prep Brief — ${ticketKey}\n\n` +
      `## SITUATION\nThis ticket is in the demo system. In the live SecondBrain, ` +
      `an AI-generated prep brief would appear here with full client history, ` +
      `signal analysis, resolution steps, and risk flags.\n\n` +
      `## DEMO NOTE\n> 🎭 This is example data. The live system generates briefs ` +
      `automatically from your ticket queue and client knowledge base.`;
    return { brief };
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


  // -- Phase 6.5: Expectation signal GET -----------------------------------
  if (endpoint.match(/\/signals\/expectation$/) && !endpoint.includes('/input')) {
    const keyMatch = endpoint.match(/tickets\/([^/]+)/);
    const key = keyMatch ? keyMatch[1] : '';
    return {
      ticket_key: key,
      auto_value: 'Client expects full system restoration during this visit.',
      effective_value: 'Client expects full system restoration during this visit.',
      confidence_state: 'medium',
      human_inputs: [],
    };
  }

  // -- Phase 6.5: Expectation signal POST (confirm/escalate/weaken) ----------
  if (endpoint.includes('/signals/expectation/input')) {
    return { status: 'ok', message: 'Demo mode — expectation input recorded.' };
  }

  // -- Phase 6.5: Close draft GET -------------------------------------------
  if (endpoint.includes('/close-draft')) {
    const keyMatch = endpoint.match(/tickets\/([^/]+)/);
    const key = keyMatch ? keyMatch[1] : '';
    return {
      ticket_key: key,
      close_draft: {
        work_performed: 'Our technician completed the on-site assessment and performed the necessary remediation steps during this visit. All affected systems were reviewed and primary issues were addressed.',
        outcome: 'The reported issue has been resolved and systems were verified operational before departure. Client was briefed on findings and any remaining items have been documented for follow-up.',
        recommendations: [
          'Schedule a follow-up check-in within 5 business days to confirm continued stability.',
          'We recommend a proactive review of related systems to prevent recurrence.',
        ],
      },
    };
  }

  // -- Phase 6.5: Checklist POST --------------------------------------------
  if (endpoint.includes('/checklist')) {
    return { status: 'ok', message: 'Demo mode — checklist saved.' };
  }

  // -- Phase 6.5: Visit datetime PATCH ---------------------------------------
  if (endpoint.includes('/visit-datetime')) {
    return { status: 'ok', message: 'Demo mode — visit datetime saved.' };
  }

  // -- Phase 6.5: Notes POST ------------------------------------------------
  if (endpoint.includes('/notes')) {
    return { status: 'ok', message: 'Demo mode — note saved.' };
  }


  // ── Intel: filter options ─────────────────────────────────────────────────
  if (endpoint.includes('/api/intel/filter-options')) {
    return DEMO_FILTER_OPTIONS;
  }

  // ── Intel: by-ticket ─────────────────────────────────────────────────────
  if (endpoint.includes('/api/intel/by-ticket')) {
    const keyMatch = endpoint.match(/by-ticket\/([^?]+)/);
    const key = keyMatch ? keyMatch[1] : '';
    // Return site intel for first demo ticket, tool intel for eaglesoft tickets
    const siteIntel = DEMO_INTEL_ENTRIES.filter((e) =>
      e.client_key === DEMO_TICKETS.find((t: Ticket) => t.ticket_key === key)?.client_key
    ).slice(0, 5);
    const toolIntel = DEMO_INTEL_ENTRIES.filter((e) => e.tool_id && !e.client_key).slice(0, 5);
    return {
      client_intel: siteIntel.length > 0 ? siteIntel : DEMO_INTEL_ENTRIES.slice(0, 2),
      tool_intel:   toolIntel.length > 0 ? toolIntel : DEMO_INTEL_ENTRIES.slice(2, 4),
      client_count: siteIntel.length,
      tool_count:   toolIntel.length,
    };
  }

  // ── Intel: entries list (GET /api/intel) ──────────────────────────────────
  if (endpoint.includes('/api/intel') && !endpoint.includes('/run') && !endpoint.includes('/outbreaks') && !endpoint.includes('/atrisk')) {
    let items = [...DEMO_INTEL_ENTRIES];
    if (endpoint.includes('client_key=')) {
      const m = endpoint.match(/client_key=([^&]+)/);
      if (m) items = items.filter((e: Record<string,unknown>) => e.client_key === m[1]);
    }
    if (endpoint.includes('tool_id=')) {
      const m = endpoint.match(/tool_id=([^&]+)/);
      if (m) items = items.filter((e: Record<string,unknown>) => e.tool_id === m[1]);
    }
    if (endpoint.includes('confidence=')) {
      const m = endpoint.match(/confidence=([^&]+)/);
      if (m) items = items.filter((e: Record<string,unknown>) => e.confidence === m[1]);
    }
    return { total: items.length, items };
  }

  // ── POST /api/intel — confirm intel candidate ────────────────────────────
  if (method === 'POST' && endpoint.endsWith('/api/intel')) {
    return { id: 'demo-' + Date.now(), status: 'created', message: 'Demo mode — intel entry recorded.' };
  }

  // ── PATCH /api/intel/{id}/kb-status — 13B ────────────────────────────────
  if (method === 'PATCH' && endpoint.includes('/api/intel/') && endpoint.includes('/kb-status')) {
    const match = endpoint.match(/\/api\/intel\/([^/]+)\/kb-status/);
    const id = match ? match[1] : '';
    const kb_status = (body as Record<string,string>)?.kb_status || 'proposed';
    return { id, kb_status, updated_at: new Date().toISOString() };
  }

  // ── GET /api/intel/similar — 13E duplicate detection ─────────────────────
  if (endpoint.includes('/api/intel/similar')) {
    // Return empty in demo — no duplicates to warn about
    return { similar: [] };
  }

  // ── Ticket context ─────────────────────────────────────────────────────────
  if (endpoint.match(/\/api\/tickets\/[^/]+\/context/)) {
    const keyMatch = endpoint.match(/tickets\/([^/]+)/);
    const key = keyMatch ? keyMatch[1] : '';
    const ticket = DEMO_TICKETS.find((t: Ticket) => t.ticket_key === key);
    return { ...DEMO_CONTEXT, ticket_key: key, client_key: ticket?.client_key ?? 'demo-client', situation: ticket?.situation ?? 'System Issue' };
  }

  // ── Ticket signals ────────────────────────────────────────────────────────
  if (endpoint.match(/\/api\/tickets\/[^/]+\/signals/)) {
    return DEMO_SIGNALS;
  }

  // ── Pilot chat ────────────────────────────────────────────────────────────
  if (endpoint.includes('/work/pilot/chat')) {
    return {
      response: `## ✈️ Pilot — Demo Mode

I can see the context for this ticket.

**Based on prior intel and the current situation:**

1. Start with a visual check of all affected hardware and network gear
2. Verify the Eaglesoft service is running — check Windows Services
3. Confirm UPS status — prior intel flags recurring battery failures at this site

> In the live system, I would have access to full client history, real-time signals, and KB entries from past visits.`,
      intel_candidate: null,
    };
  }

  // ── Ticket ingest status ──────────────────────────────────────────────────
  if (endpoint.includes('/ingest/status')) {
    return { status: 'idle', last_run: new Date().toISOString() };
  }

  // ── Settings: pilot persona ───────────────────────────────────────────────
  if (endpoint.includes('/api/settings/pilot-persona')) {
    return { pilot_system_description: 'You are Pilot, a field technician copilot for dental IT environments. Be concise, practical, and step-oriented. Assume the technician is onsite and time-pressured.' };
  }

  // ── Phase 30: Ticket risk intelligence ──────────────────────────────────────
  if (endpoint.match(/\/api\/tickets\/[^/]+\/risk/)) {
    const keyMatch = endpoint.match(/tickets\/([^/]+)/);
    const key = keyMatch ? keyMatch[1] : '';
    // Simulate risk for Eaglesoft-related tickets
    const eaglesoftTickets = ['4114075', '4270854', '4198231'];
    const watchTickets     = ['4301122', '4088900'];
    if (eaglesoftTickets.includes(key)) {
      return {
        ticket_key:  key,
        risk_score:  72,
        risk_level:  'high',
        tool_ids:    ['eaglesoft'],
        patterns: [
          {
            pattern:      'eaglesoft service crash after power event',
            tool_id:      'eaglesoft',
            trend_status: 'emerging',
            occurrences:  7,
            clients:      4,
            last_seen:    '2026-03-05',
          },
        ],
      };
    }
    if (watchTickets.includes(key)) {
      return {
        ticket_key:  key,
        risk_score:  38,
        risk_level:  'watch',
        tool_ids:    ['windows'],
        patterns: [
          {
            pattern:      'windows update breaks workstation connectivity',
            tool_id:      'windows',
            trend_status: 'emerging',
            occurrences:  4,
            clients:      3,
            last_seen:    '2026-03-03',
          },
        ],
      };
    }
    return { ticket_key: key, risk_score: 0, risk_level: 'normal', tool_ids: [], patterns: [] };
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
/**
 * Extract the active tenant from the current hostname at runtime.
 * ipquest.fieldstone.pro → 'ipquest'
 * demo.fieldstone.pro    → 'demo'
 * localhost              → DEFAULT_TENANT
 */
export function getActiveTenant(): string {
  if (typeof window === 'undefined') return DEFAULT_TENANT;
  const hostname = window.location.hostname;
  const BASE = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'fieldstone.pro';
  if (hostname === 'localhost' || hostname === '127.0.0.1') return DEFAULT_TENANT;
  if (hostname.endsWith(`.${BASE}`)) {
    const sub = hostname.replace(`.${BASE}`, '');
    if (['www', 'app'].includes(sub)) return DEFAULT_TENANT;
    return sub;
  }
  return DEFAULT_TENANT;
}

export async function pmFetch(endpoint: string, apiBase: string, options?: RequestInit): Promise<unknown> {
  if (isDemoMode()) {
    const method = options?.method || 'GET';
    let parsedBody: unknown = undefined;
    if (options?.body && typeof options.body === 'string') {
      try { parsedBody = JSON.parse(options.body); } catch { parsedBody = options.body; }
    }
    return demoFetch(endpoint, method, parsedBody);
  }
  const tenant = getActiveTenant();
  const headers: Record<string, string> = {
    'x-tenant-id': tenant,
    ...(options?.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${apiBase}${endpoint}`, { ...options, headers });
  if (!res.ok) throw new Error(`PM API error: ${res.status} ${res.statusText}`);
  return res.json();
}
