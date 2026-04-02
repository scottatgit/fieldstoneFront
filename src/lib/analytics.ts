// src/lib/analytics.ts
// FST-AN-001: First-party analytics client.
// Fire-and-forget. Never blocks user actions. Never stores PII.
//
// Anonymous ID:
//   A random UUID stored in localStorage under key 'sig_anon'.
//   Purely for funnel continuity. Not linked to email/identity.
//   Users can clear it by clearing site data. Fully removable.
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
}

// Route key normalisation
// Maps raw pathnames to canonical route_key values.
function normaliseRouteKey(pathname: string): string {
  if (!pathname) return 'other';
  const p = pathname.split('?')[0].toLowerCase();
  if (p === '/' || p === '' || p.includes('signal-landing')) return 'landing';
  if (p.startsWith('/login'))       return 'login';
  if (p.startsWith('/signup'))      return 'signup';
  if (p.startsWith('/pm/onboard')) return 'onboarding';
  if (p.startsWith('/pm/intel'))  return 'intel';
  if (p.startsWith('/pm/setup'))  return 'setup';
  if (p.startsWith('/pm'))        return 'dispatch';
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
      // Generate a random UUID-like token
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
 */
export function track(
  eventName: AnalyticsEvent,
  props: AnalyticsProps = {},
): void {
  if (typeof window === 'undefined') return;

  try {
    const anonymousId = getAnonymousId();
    const hostname    = window.location.hostname;
    const pathname    = window.location.pathname;

    // Lift workspace_id out of properties into top-level field
    // (stored as a dedicated column, not in the JSON blob)
    const { workspace_id, ...restProps } = props;

    const payload = {
      event_name:   eventName,
      domain:       normaliseDomain(hostname),
      route_key:    normaliseRouteKey(pathname),
      anonymous_id: anonymousId,
      workspace_id: workspace_id || null,
      properties: {
        ...restProps,
        device_type: restProps.device_type || getDeviceType(),
        path:        restProps.path || pathname.split('?')[0].slice(0, 128),
      },
    };

    // fire-and-forget with keepalive so it survives page transitions
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
