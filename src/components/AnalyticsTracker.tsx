'use client';
// src/components/AnalyticsTracker.tsx
// FST-AN-001C: Thin client component injected into server-rendered pages.
// Fires a single page_view event on mount via useEffect.
// Zero UI output — renders nothing visible.

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

interface Props {
  routeKey?: string;
  ctaMap?:   Record<string, string>; // data-cta-id -> label, for future CTA wiring
}

export function AnalyticsTracker({ routeKey: _routeKey }: Props) {
  useEffect(() => {
    // Fire page_view once on mount
    track('page_view');
  }, []);

  return null;
}
