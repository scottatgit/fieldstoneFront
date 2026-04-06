/**
 * Tenant slug extraction utility.
 * Pure function — no Next.js server dependencies.
 * Exported separately so it can be unit-tested without loading next/server.
 * Ref: TBI-002
 */

// Align with middleware.ts RESERVED_SLUGS.
// 'app' is included here (was missing from original ingest-email/route.ts).
export const INGEST_RESERVED = new Set([
  'www', 'app', 'api', 'admin', 'signal', 'static', 'demo',
]);

const SUBDOMAIN_RE = /^([a-z0-9-]+)\.signal\.fieldstone\.pro$/;

/**
 * Extract and validate the tenant slug from a Host header value.
 *
 * Returns { slug } on success.
 * Returns { error } on failure — never falls back to a default tenant.
 * Ref: TBI-002 / fst-tbi-002
 */
export function extractTenantSlug(
  host: string
): { slug: string } | { error: string } {
  // Strip port — consistent with middleware.ts classifyHost behaviour.
  const hostname = host.split(':')[0];
  const match = hostname.match(SUBDOMAIN_RE);
  const candidate = match ? match[1] : null;
  if (!candidate) return { error: 'no_subdomain_match' };
  if (INGEST_RESERVED.has(candidate)) return { error: 'reserved_slug' };
  return { slug: candidate };
}
