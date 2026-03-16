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
  // Runtime hostname detection — always wins over env vars on real domains
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.startsWith('demo.')) return true;   // demo.signal.fieldstone.pro or demo.fieldstone.pro = always demo
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';  // localhost respects env var
    }
    return false;  // any real subdomain (ipquest., acme., etc.) = NEVER demo
  }
  // SSR fallback — only true when explicitly set (used for demo subdomain SSR)
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
  // Match ticket LIST only — not subpaths like /work/pilot/chat, /context, /signals
  if (endpoint.includes('/api/tickets') && !endpoint.match(/\/api\/tickets\/.+/)) {
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
  // AI Signal Deduction mock
  if (endpoint.includes('/signals/deduce')) {
    return {
      signals: {
        readiness: 'Parts and remote access are confirmed. Ticket has all information needed for an on-site visit.',
        trust: 'Long-term client with consistent engagement. No friction or escalation history detected.',
        expectation: 'Client expects full resolution of the reported issue with verification before technician departure.',
        constraint: 'Office hours only (9 AM – 5 PM). Avoid patient chair-side disruptions during active procedures.',
        decision: 'Visit recommended — issue requires hands-on diagnosis and resolution on-site.',
      },
      risk_flags: [
        'Clinical workflow may be impacted if issue persists during patient hours',
        'Verify equipment and network access before arrival',
      ],
      confidence: { readiness: 0.82, trust: 0.88, expectation: 0.79, constraint: 0.71, decision: 0.85 },
      ai_used: ['readiness', 'trust', 'expectation', 'constraint', 'decision'],
      existing: { readiness: '', trust: '', expectation: '', constraint: '', decision: '' },
    };
  }

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

  // ── Phase 31: Admin tenant management ───────────────────────────────────────
  if (endpoint === '/api/admin/tenants' && method === 'GET') {
    return {
      tenants: [
        {
          id: 'ipquest', name: 'IPQuest', subdomain: 'ipquest',
          plan: 'internal', billing_status: 'internal',
          trial_ends_at: null,
          created_at: '2026-03-06T02:35:35.000Z',
          clerk_org_id: null, stripe_customer_id: null, stripe_subscription_id: null,
          suspension_reason: null, suspended_at: null, suspended_by: null,
        },
        {
          id: 'demo', name: 'Fieldstone Demo', subdomain: 'demo',
          plan: 'demo', billing_status: 'demo',
          trial_ends_at: null,
          created_at: '2026-03-06T02:52:19.000Z',
          clerk_org_id: null, stripe_customer_id: null, stripe_subscription_id: null,
          suspension_reason: null, suspended_at: null, suspended_by: null,
        },
        {
          id: 'tower', name: 'Fieldstone', subdomain: 'tower',
          plan: 'starter', billing_status: 'trial',
          trial_ends_at: '2026-03-20T19:43:04.000Z',
          created_at: '2026-03-06T19:43:04.000Z',
          clerk_org_id: 'org_tower_1772826183935', stripe_customer_id: null, stripe_subscription_id: null,
          suspension_reason: null, suspended_at: null, suspended_by: null,
        },
        {
          id: 'acmedental', name: 'Acme Dental Group', subdomain: 'acmedental',
          plan: 'pro', billing_status: 'active',
          trial_ends_at: null,
          created_at: '2026-02-15T10:00:00.000Z',
          clerk_org_id: 'org_acme_demo', stripe_customer_id: 'cus_demo_acme', stripe_subscription_id: 'sub_demo_acme_001',
          suspension_reason: null, suspended_at: null, suspended_by: null,
        },
        {
          id: 'brightsmiledds', name: 'BrightSmile DDS', subdomain: 'brightsmiledds',
          plan: 'starter', billing_status: 'suspended',
          trial_ends_at: '2026-02-28T00:00:00.000Z',
          created_at: '2026-02-01T08:00:00.000Z',
          clerk_org_id: null, stripe_customer_id: null, stripe_subscription_id: null,
          suspension_reason: 'Non-payment for 45 days', suspended_at: '2026-02-28T00:00:00.000Z', suspended_by: 'admin',
        },
      ],
    };
  }
  if (endpoint === '/api/admin/tenants' && method === 'POST') {
    const _b = (body ?? {}) as Record<string, string>;
    return { id: 'demo-new', name: _b['name'] ?? 'New', subdomain: _b['subdomain'] ?? 'new',
             plan: _b['plan'] ?? 'starter', billing_status: 'trial',
             trial_ends_at: '2026-03-21T00:00:00.000Z', created_at: new Date().toISOString() };
  }
  // ── Phase 35A: Admin Tenant Detail mocks ────────────────────────────────────
  if (endpoint === '/api/admin/tenants/acmedental' && method === 'GET') {
    return {
      id: 'acmedental', name: 'Acme Dental Group', subdomain: 'acmedental',
      plan: 'pro', billing_status: 'active',
      trial_starts_at: null, trial_ends_at: null,
      created_at: '2026-02-15T10:00:00.000Z',
      updated_at: '2026-03-01T14:22:00.000Z',
      clerk_org_id: 'org_acme_demo',
      stripe_customer_id: 'cus_demo_acme',
      stripe_subscription_id: 'sub_demo_acme_001',
      suspension_reason: null, suspended_at: null, suspended_by: null,
      setup: {
        has_org: true,
        imap_connected: true,
        ai_configured: true,
        notifications_configured: false,
        first_ingestion_at: '2026-02-16T09:15:00.000Z',
        activation_state: 'active' as const,
        setup_completion_pct: 80,
      },
    };
  }
  if (endpoint === '/api/admin/tenants/acmedental/users') {
    const now = Date.now();
    return {
      total_users: 4,
      active_last_30_days: 3,
      pilot_count: 1,
      billable_seat_candidate_count: 2,
      role_breakdown: { tenant_admin: 1, technician: 2, assistant: 1 },
      items: [
        {
          id: 'u-acme-1', name: 'Dr. Karen Acme', email: 'karen@acmedental.com',
          role: 'tenant_admin', assigned_to_alias: 'Karen',
          last_active_at: new Date(now - 2 * 3600000).toISOString(),
          has_clerk_user: true, active_last_30d: true,
        },
        {
          id: 'u-acme-2', name: 'James Wright', email: 'james@acmedental.com',
          role: 'technician', assigned_to_alias: 'James',
          last_active_at: new Date(now - 18 * 3600000).toISOString(),
          has_clerk_user: true, active_last_30d: true,
        },
        {
          id: 'u-acme-3', name: 'Maria Santos', email: 'maria@acmedental.com',
          role: 'technician', assigned_to_alias: 'Maria',
          last_active_at: new Date(now - 72 * 3600000).toISOString(),
          has_clerk_user: true, active_last_30d: true,
        },
        {
          id: 'u-acme-pilot', name: 'Pilot', email: null,
          role: 'assistant', assigned_to_alias: 'Pilot',
          last_active_at: new Date(now - 3600000).toISOString(),
          has_clerk_user: false, active_last_30d: true,
        },
      ],
    };
  }
  if (endpoint === '/api/admin/tenants/acmedental/usage') {
    return {
      ticket_count: 143,
      intel_count: 27,
      outbreak_count: 1,
      last_user_activity_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      last_ticket_created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      latest_ingestion_at: new Date(Date.now() - 6 * 3600000).toISOString(),
      tenant_state_summary: 'active' as const,
    };
  }
  if (endpoint === '/api/admin/tenants/acmedental/ingestion') {
    const base = Date.now();
    return {
      total: 5,
      items: [
        { ticket_id: 'TKT-8821', status: 'completed', error: null, started_at: new Date(base - 6*3600000).toISOString(), completed_at: new Date(base - 6*3600000 + 4200).toISOString(), created_at: new Date(base - 6*3600000).toISOString(), duration_ms: 4200 },
        { ticket_id: 'TKT-8820', status: 'completed', error: null, started_at: new Date(base - 12*3600000).toISOString(), completed_at: new Date(base - 12*3600000 + 3800).toISOString(), created_at: new Date(base - 12*3600000).toISOString(), duration_ms: 3800 },
        { ticket_id: 'TKT-8819', status: 'failed', error: '[ask_json] Empty response from AI (caller=ai_extract_structured:TKT-8819)', started_at: new Date(base - 18*3600000).toISOString(), completed_at: null, created_at: new Date(base - 18*3600000).toISOString(), duration_ms: null },
        { ticket_id: 'TKT-8818', status: 'completed', error: null, started_at: new Date(base - 24*3600000).toISOString(), completed_at: new Date(base - 24*3600000 + 5100).toISOString(), created_at: new Date(base - 24*3600000).toISOString(), duration_ms: 5100 },
        { ticket_id: 'TKT-8817', status: 'completed', error: null, started_at: new Date(base - 30*3600000).toISOString(), completed_at: new Date(base - 30*3600000 + 3200).toISOString(), created_at: new Date(base - 30*3600000).toISOString(), duration_ms: 3200 },
      ],
    };
  }
  if (endpoint === '/api/admin/tenants/acmedental' && method === 'PATCH') {
    return {
      id: 'acmedental', name: 'Acme Dental Group', subdomain: 'acmedental',
      plan: (body as Record<string,unknown>)?.plan ?? 'pro',
      billing_status: (body as Record<string,unknown>)?.billing_status ?? 'active',
      trial_ends_at: (body as Record<string,unknown>)?.trial_ends_at ?? null,
      stripe_customer_id: 'cus_demo_acme',
      stripe_subscription_id: 'sub_demo_acme_001',
      suspension_reason: null, suspended_at: null, suspended_by: null,
      updated_at: new Date().toISOString(),
    };
  }
  if (endpoint.match(/\/api\/admin\/tenants\/[^/]+\/suspend/)) {
    return { billing_status: 'suspended', message: 'Demo: tenant toggled.' };
  }

  // ── Phase 35B: Billing mocks ─────────────────────────────────────────────
  if (endpoint === '/api/billing/status') {
    return {
      tenant: 'demo', name: 'Demo Workspace', plan: 'pro',
      billing_status: 'active', trial_ends_at: null, days_remaining: null,
      stripe_customer_id: null, has_subscription: true,
      current_seat_count: 2, billable_seats: 2, total_active_seats: 3,
      stripe_configured: false,
    };
  }
  if (endpoint === '/api/billing/portal' && method === 'POST') {
    return { portal_url: 'https://billing.stripe.com/demo' };
  }
  // Phase 35C — Blocker 2: Recovery endpoint mock
  if (endpoint.includes('/billing/create-subscription') && method === 'POST') {
    const tid = endpoint.split('/api/admin/tenants/')[1]?.split('/')[0];
    return {
      status: 'already_configured',
      stripe_customer_id: 'cus_demo123',
      stripe_subscription_id: 'sub_demo456',
      tenant_id: tid ?? 'demo',
    };
  }
  if (endpoint === '/api/admin/tenants/acmedental/billing') {
    return {
      name: 'Acme Dental', plan: 'pro', billing_status: 'active',
      trial_ends_at: null, stripe_customer_id: 'cus_demo123',
      stripe_subscription_id: 'sub_demo456', current_seat_count: 2,
      last_seat_sync_at: new Date(Date.now() - 3600000).toISOString(),
      seats: {
        total_active: 3, admin_count: 1, technician_count: 2,
        free_seats: 1, billable_seats: 2,
        users: [
          { id: 'u1', name: 'Karen Admin', role: 'tenant_admin', last_active_at: new Date(Date.now() - 1800000).toISOString() },
          { id: 'u2', name: 'Mike Tech', role: 'technician', last_active_at: new Date(Date.now() - 7200000).toISOString() },
          { id: 'u3', name: 'Sara Tech', role: 'technician', last_active_at: new Date(Date.now() - 86400000).toISOString() },
        ],
      },
      recent_events: [
        { event_type: 'seat_sync', stripe_event_id: null, payload: JSON.stringify({ from: 1, to: 2 }), created_at: new Date(Date.now() - 3600000).toISOString() },
        { event_type: 'subscription_created', stripe_event_id: 'evt_demo1', payload: JSON.stringify({ billable_seats: 1 }), created_at: new Date(Date.now() - 86400000 * 14).toISOString() },
      ],
      stripe_configured: false,
    };
  }
  if (endpoint.match(/\/api\/admin\/tenants\/[^/]+/) && method === 'PATCH') {
    return { id: 'demo', ...(body as Record<string, unknown>) };
  }
  if (endpoint.match(/\/api\/admin\/tenants\/[^/]+/) && method === 'DELETE') {
    return { deleted: 'demo', message: 'Demo: tenant deleted.' };
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

  // ── Phase 33: Setup endpoints ─────────────────────────────────────────────
  if (endpoint === '/api/setup/status') {
    return {
      organization: true,
      imap_connected: false,
      ai_configured: true,
      first_ingestion_complete: true,
      first_ingestion_at: '2026-03-01T10:00:00',
      imap_config: {},
      ai_config: { provider: 'openai', model: 'gpt-4o-mini' },
      notification_config: {},
    };
  }
  if (endpoint === '/api/setup/imap/test' && method === 'POST') {
    return { status: 'ok', message: 'Connected to imap.gmail.com. INBOX has 142 messages.' };
  }
  if (endpoint === '/api/setup/imap/save' && method === 'POST') {
    return { status: 'ok', message: 'IMAP configuration saved.' };
  }
  if (endpoint === '/api/setup/ai/save' && method === 'POST') {
    return { status: 'ok', message: 'AI configuration saved.' };
  }
  if (endpoint === '/api/setup/notifications/save' && method === 'POST') {
    return { status: 'ok', message: 'Notification settings saved.' };
  }
  
  // Team members
  if (endpoint === '/api/tenant/users' && method === 'GET') {
    return {
      total_users: 5,
      active_last_30_days: 4,
      items: [
        { id: 'u1', tenant_id: 'demo', name: 'Mike Johnson', email: 'mike@ipquest.com', role: 'technician', assigned_to_alias: 'Mike', last_active_at: new Date(Date.now() - 2 * 3600000).toISOString(), created_at: '2025-01-15T09:00:00' },
        { id: 'u2', tenant_id: 'demo', name: 'Sara Patel', email: 'sara@ipquest.com', role: 'technician', assigned_to_alias: 'Sara', last_active_at: new Date(Date.now() - 26 * 3600000).toISOString(), created_at: '2025-02-01T09:00:00' },
        { id: 'u3', tenant_id: 'demo', name: 'John Rivera', email: 'john@ipquest.com', role: 'technician', assigned_to_alias: 'John', last_active_at: new Date(Date.now() - 72 * 3600000).toISOString(), created_at: '2025-03-10T09:00:00' },
        { id: 'u4', tenant_id: 'demo', name: 'Owner', email: 'owner@ipquest.com', role: 'tenant_admin', assigned_to_alias: 'Owner', last_active_at: new Date(Date.now() - 1800000).toISOString(), created_at: '2024-12-01T09:00:00' },
        { id: 'u-pilot', tenant_id: 'demo', name: 'Pilot', email: null, role: 'assistant', assigned_to_alias: 'Pilot', last_active_at: new Date().toISOString(), created_at: '2024-12-01T09:00:00' },
      ],
    };
  }
  if (endpoint.startsWith('/api/tenant/users/') && method === 'PATCH') {
    return { ok: true };
  }
  if (endpoint.startsWith('/api/tenant/users/') && method === 'DELETE') {
    return { ok: true };
  }
  if (endpoint === '/api/tenant/users' && method === 'POST') {
    return { id: 'u-new', tenant_id: 'demo', name: 'New Member', role: 'technician', created_at: new Date().toISOString() };
  }
if ((endpoint === '/api/ingest/run' || endpoint === '/api/ingest/email' || endpoint === '/api/ingest-email') && method === 'POST') {
    return { status: 'started', message: 'Demo mode: ingestion simulated. Check TODAY board in ~60 seconds.' };
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
  const BASE   = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
  const SIGNAL = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || ('signal.' + BASE);
  if (hostname === 'localhost' || hostname === '127.0.0.1') return DEFAULT_TENANT;
  // New: {tenant}.signal.fieldstone.pro
  if (hostname.endsWith('.' + SIGNAL)) {
    const sub = hostname.split('.')[0];
    if (['www', 'app', 'admin', 'signal', 'demo', 'api'].includes(sub)) return DEFAULT_TENANT;
    return sub;
  }
  // Legacy: {tenant}.fieldstone.pro
  if (hostname.endsWith('.' + BASE)) {
    const sub = hostname.replace('.' + BASE, '');
    if (['www', 'app', 'signal'].includes(sub)) return DEFAULT_TENANT;
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
    'x-tenant-slug': tenant,
    ...(options?.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${apiBase}${endpoint}`, { ...options, headers, credentials: 'include' });
  if (!res.ok) throw new Error(`PM API error: ${res.status} ${res.statusText}`);
  return res.json();
}
