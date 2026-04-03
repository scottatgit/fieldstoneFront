// src/lib/analytics.ts
// FST-AN-001: First-party analytics client.
// FST-AN-003A: Session-level deduplication for noisy mount-fired product events.
// Fire-and-forget. Never blocks user actions. Never stores PII.
//
// Anonymous ID:
//   A random UUID stored in localStorage under key 'sig_anon'.
//   Purely for funnel continuity. Not linked to email/identity.
//   Users can clear it by clearing site data. Fully removable.
//
// Deduplication (FST-AN-003A):
//   brief_viewed and intel_viewed fire on component mount and can overcount
//   if the user navigates back to the same surface within a session.
//   sessionStorage key ae_dedup_{event}_{workspaceId} prevents repeat fires
//   within the same browser tab session. Cleared automatically on tab close.
//   ticket_closed is action-gated — no dedup needed.
//
// Privacy guardrails (enforced here AND on the server):
//   - No email addresses
//   - No raw ticket content
//   - No session replay
//   - Properties stripped to known safe keys only

const API_BASE =
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'https://api.fieldstone.pro')
    : 'https://api.fieldstone.pro';

const ENDPOINT = `${API_BASE}/api/analytics/event`;

// Allowed event names — must match server-side allowlist
export type AnalyticsEvent =
  | 'page_view'
  | 'cta_clicked'
  | 'signup_started'
  | 'signup_completed'
  | 'login_viewed'
  | 'login_completed'
  | 'workspace_created'
  // FST-AN-002: product usage events (authenticated workspace surfaces)
  | 'brief_viewed'
  | 'intel_viewed'
  | 'ticket_closed';

// Allowed property keys — server strips anything not in this set
export interface AnalyticsProps {
  cta_label?:    string;
  cta_href?:     string;
  referrer?:     string;
  utm_source?:   string;
  utm_medium?:   string;
  utm_campaign?: string;
  device_type?:  string;
  path?:         string;
  // FST-AN-002: workspace context for authenticated product events
  // Safe to store — internal FK, not PII. Never sent to external services.
  workspace_id?: string;
  // FST-AN-003E: optional override for route_key — if omitted, derived from pathname
  route_key?: string;
}

// FST-AN-003A: Events that must fire at most once per browser tab session
// per (event_name, workspace_id). Prevents component-mount loops from
// inflating activation counts. Uses sessionStorage — cleared on tab close.
// Rollback: remove this set and the checkAndSetDedup call in track().
const SESSION_DEDUP_EVENTS = new Set<AnalyticsEvent>(['brief_viewed', 'intel_viewed']);

/**
 * FST-AN-003A: Check sessionStorage dedup guard before firing.
 * Returns true  → event should fire (not seen this session, guard now set).
 * Returns false → event already fired this session, suppress.
 * Never throws. Falls back to true (allow) on any sessionStorage error.
 */
function checkAndSetDedup(
  eventName: AnalyticsEvent,
  workspaceId: string | null | undefined,
): boolean {
  if (!SESSION_DEDUP_EVENTS.has(eventName)) return true;
  if (typeof window === 'undefined') return true;
  try {
    const key = `ae_dedup_${eventName}_${workspaceId ?? 'anon'}`;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true; // sessionStorage unavailable — fire, never block
  }
}

// Route key normalisation — maps raw pathnames to canonical route_key values.
function normaliseRouteKey(pathname: string): string {
  if (!pathname) return 'other';
  const p = pathname.split('?')[0].toLowerCase();
  if (p === '/' || p === '' || p.includes('signal-landing')) return 'landing';
  if (p.startsWith('/login'))       return 'login';
  if (p.startsWith('/signup'))      return 'signup';
  if (p.startsWith('/pm/onboard')) return 'onboarding';
  if (p.startsWith('/pm/intel'))   return 'intel';
  if (p.startsWith('/pm/setup'))   return 'setup';
  if (p.startsWith('/pm'))         return 'dispatch';
  if (p.startsWith('/redirect'))   return 'redirect';
  if (p.startsWith('/verify'))     return 'verify';
  if (p.startsWith('/demo'))       return 'demo';
  return 'other';
}

// Domain normalisation
function normaliseDomain(hostname: string): string {
  const h = (hostname || '').toLowerCase();
  if (h.includes('signal.fieldstone')) return 'signal.fieldstone.pro';
  if (h.includes('www.fieldstone') || h === 'fieldstone.pro') return 'www.fieldstone.pro';
  if (h.includes('localhost') || h.includes('127.0.0')) return 'localhost';
  return 'other';
}

// Get or create anonymous ID (localStorage, no cookies)
function getAnonymousId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let id = localStorage.getItem('sig_anon');
    if (!id) {
      id = crypto.randomUUID
        ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
      localStorage.setItem('sig_anon', id);
    }
    return id;
  } catch {
    return null;
  }
}

// Collect safe device hint — no fingerprinting, just broad category
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
}

/**
 * track() — fire-and-forget analytics event.
 *
 * Safe to call anywhere. Errors are silently swallowed.
 * Never awaited, never blocks user interaction.
 *
 * FST-AN-003A: brief_viewed and intel_viewed are deduplicated
 * per browser session per workspace via sessionStorage guard.
 */
export function track(
  eventName: AnalyticsEvent,
  props: AnalyticsProps = {},
): void {
  if (typeof window === 'undefined') return;

  try {
    // FST-AN-003A: session dedup — suppress if already fired this tab session
    if (!checkAndSetDedup(eventName, props.workspace_id)) return;

    const anonymousId = getAnonymousId();
    const hostname    = window.location.hostname;
    const pathname    = window.location.pathname;

    // Lift workspace_id out of properties into top-level field
    // (stored as a dedicated DB column, not in the JSON blob)
    const { workspace_id, route_key: routeKeyOverride, ...restProps } = props;

    const payload = {
      event_name:   eventName,
      domain:       normaliseDomain(hostname),
      route_key:    routeKeyOverride ?? normaliseRouteKey(pathname),
      anonymous_id: anonymousId,
      workspace_id: workspace_id || null,
      properties: {
        ...restProps,
        device_type: restProps.device_type || getDeviceType(),
        path:        restProps.path || pathname.split('?')[0].slice(0, 128),
      },
    };

    fetch(ENDPOINT, {
      method:    'POST',
      headers:   { 'Content-Type': 'application/json' },
      body:      JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // intentionally silent
    });
  } catch {
    // intentionally silent — analytics must never throw
  }
}

/**
 * clearDedupSession() — test/debug helper only.
 * Clears all analytics dedup keys from sessionStorage.
 * Not called in any production path.
 */
export function clearDedupSession(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith('ae_dedup_'))
      .forEach(k => sessionStorage.removeItem(k));
  } catch {
    // silent
  }
}
