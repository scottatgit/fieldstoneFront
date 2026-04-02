'use client';
// src/components/AnalyticsTracker.tsx
// FST-AN-001C: Thin client component injected into server-rendered pages.
// Fires a single page_view event on mount via useEffect.
// Zero UI output — renders nothing visible.
// FST-AN-003E: routeKey prop now wired through to track() as route_key override.
//   If omitted, route_key is derived automatically from window.location.pathname.

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

interface Props {
  routeKey?: string;
  ctaMap?:   Record<string, string>; // data-cta-id -> label, for future CTA wiring
}

export function AnalyticsTracker({ routeKey }: Props) {
  useEffect(() => {
    // Fire page_view once on mount.
    // Pass routeKey as override if provided; otherwise track() derives from pathname.
    track('page_view', routeKey ? { route_key: routeKey } : {});
  }, [routeKey]);

  return null;
}
