'use client';
import { useEffect, useState } from 'react';
import { pmFetch } from '@/lib/demoApi';

const PM_API = '/pm-api'; // relative proxy — consistent with PM page convention

interface SetupStatus {
  connection_status?: string;
  imap_config?: { provider?: string; mailbox?: string; host?: string };
  imap_connected?: boolean;
}

/**
 * EmailHealthBanner
 * Renders a sticky top banner when email sync auth has failed.
 * Mirrors BillingBanner placement — mounted in PM layout above WorkspaceGuard.
 * States handled: auth_error | needs_reconnect
 * Dismissable per session (sessionStorage key: email_health_dismissed_at)
 */
export default function EmailHealthBanner() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  useEffect(() => {
    if (isDemo) return;

    // Check session dismissal — re-show after 1 hour so persistent failures stay visible
    const dismissedAt = sessionStorage.getItem('email_health_dismissed_at');
    if (dismissedAt && Date.now() - Number(dismissedAt) < 60 * 60 * 1000) {
      setDismissed(true);
      return;
    }

    // Fetch connection status
    pmFetch('/api/setup/status', PM_API)
      .then(data => { if (data) setStatus(data as SetupStatus); })
      .catch(() => {});

    // Fetch tenant slug for Microsoft reconnect URL
    pmFetch('/api/auth/me', PM_API)
      .then((d: unknown) => {
        const data = d as Record<string, unknown>;
        if (data?.slug) setTenantSlug(data.slug as string);
      })
      .catch(() => {});
  }, [isDemo]);

  const handleDismiss = () => {
    sessionStorage.setItem('email_health_dismissed_at', String(Date.now()));
    setDismissed(true);
  };

  const handleReconnect = async () => {
    const provider = status?.imap_config?.provider;
    if (provider === 'microsoft_graph') {
      if (!tenantSlug) return;
      setReconnecting(true);
      try {
        const data = await pmFetch(
          `/api/auth/microsoft/start?tenant_slug=${encodeURIComponent(tenantSlug)}`,
          PM_API
        ) as { auth_url?: string };
        if (data?.auth_url) {
          window.location.href = data.auth_url;
        }
      } catch { /* noop */ } finally {
        setReconnecting(false);
      }
    } else {
      // IMAP providers — send to Setup page
      window.location.href = '/pm/setup';
    }
  };

  if (isDemo) return null;
  if (dismissed) return null;
  if (!status) return null;

  const connStatus = status.connection_status;
  const isAuthError     = connStatus === 'auth_error';
  const isNeedsReconnect = connStatus === 'needs_reconnect';

  if (!isAuthError && !isNeedsReconnect) return null;

  const provider   = status?.imap_config?.provider;
  const mailbox    = status?.imap_config?.mailbox || '';
  const isMicrosoft = provider === 'microsoft_graph';

  const bannerBg  = 'bg-orange-900/80';
  const borderClr = 'border-orange-700';
  const textClr   = 'text-orange-100';

  const label = isNeedsReconnect
    ? 'Email sync paused — token expired'
    : 'Email sync paused — reauthorization required';

  const detail = isMicrosoft
    ? `Microsoft${mailbox ? ` · ${mailbox}` : ''} connection needs to be re-authorized`
    : 'Check your email settings and reconnect your inbox';

  const ctaLabel = reconnecting
    ? 'Redirecting…'
    : isMicrosoft ? 'Reconnect Microsoft →' : 'Go to Setup →';

  return (
    <div className={`w-full px-4 py-2 text-sm flex items-center justify-between gap-3 ${bannerBg} ${textClr} border-b ${borderClr}`}>
      <span className="flex items-center gap-2 min-w-0">
        <span className="shrink-0">⚠️</span>
        <span className="truncate">
          <strong>{label}</strong>
          {detail ? <span className="opacity-75"> — {detail}</span> : null}
        </span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleReconnect}
          disabled={reconnecting}
          className="bg-white text-gray-900 font-semibold text-xs px-3 py-1.5 rounded hover:bg-gray-100 disabled:opacity-50 transition whitespace-nowrap"
        >
          {ctaLabel}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss email health warning"
          className="text-orange-300 hover:text-white transition text-base leading-none px-1"
        >
          ✕
        </button>
      </span>
    </div>
  );
}
