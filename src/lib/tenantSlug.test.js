/**
 * TBI-002: Tenant slug extraction gate — behavioural contract tests
 *
 * Plain JavaScript — no TypeScript transform required.
 * Logic mirrored exactly from src/lib/tenantSlug.ts (minus type annotations).
 * TypeScript type correctness is verified separately by `npm run build`.
 * Ref: fst-tbi-002
 */

// ── Mirror logic from tenantSlug.ts (no imports needed) ─────────────────────
const INGEST_RESERVED = new Set(['www', 'app', 'api', 'admin', 'signal', 'static', 'demo']);
const SUBDOMAIN_RE = /^([a-z0-9-]+)\.signal\.fieldstone\.pro$/;

function extractTenantSlug(host) {
  const hostname = host.split(':')[0];
  const match = hostname.match(SUBDOMAIN_RE);
  const candidate = match ? match[1] : null;
  if (!candidate) return { error: 'no_subdomain_match' };
  if (INGEST_RESERVED.has(candidate)) return { error: 'reserved_slug' };
  return { slug: candidate };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('extractTenantSlug — valid slugs', () => {
  it('extracts a standard tenant slug', () => {
    expect(extractTenantSlug('ipquest.signal.fieldstone.pro')).toEqual({ slug: 'ipquest' });
  });

  it('extracts an arbitrary tenant slug', () => {
    expect(extractTenantSlug('acme.signal.fieldstone.pro')).toEqual({ slug: 'acme' });
  });

  it('extracts a hyphenated tenant slug', () => {
    expect(extractTenantSlug('my-client.signal.fieldstone.pro')).toEqual({ slug: 'my-client' });
  });

  it('strips port before extraction', () => {
    expect(extractTenantSlug('ipquest.signal.fieldstone.pro:443')).toEqual({ slug: 'ipquest' });
  });

  it('extracts a numeric-prefixed slug', () => {
    expect(extractTenantSlug('test30.signal.fieldstone.pro')).toEqual({ slug: 'test30' });
  });
});

describe('extractTenantSlug — reserved slugs (must reject all)', () => {
  const cases = [
    ['www',    'www.signal.fieldstone.pro'],
    ['app',    'app.signal.fieldstone.pro'],
    ['api',    'api.signal.fieldstone.pro'],
    ['admin',  'admin.signal.fieldstone.pro'],
    ['signal', 'signal.signal.fieldstone.pro'],
    ['static', 'static.signal.fieldstone.pro'],
    ['demo',   'demo.signal.fieldstone.pro'],
  ];

  test.each(cases)('rejects reserved slug "%s"', (_slug, host) => {
    expect(extractTenantSlug(host)).toEqual({ error: 'reserved_slug' });
  });
});

describe('extractTenantSlug — invalid / missing host (must reject)', () => {
  it('rejects a bare apex domain', () => {
    expect(extractTenantSlug('signal.fieldstone.pro')).toEqual({ error: 'no_subdomain_match' });
  });

  it('rejects a non-signal subdomain', () => {
    expect(extractTenantSlug('ipquest.fieldstone.pro')).toEqual({ error: 'no_subdomain_match' });
  });

  it('rejects an empty host string', () => {
    expect(extractTenantSlug('')).toEqual({ error: 'no_subdomain_match' });
  });

  it('rejects uppercase letters in slug (not a valid pattern)', () => {
    expect(extractTenantSlug('IPQUEST.signal.fieldstone.pro')).toEqual({ error: 'no_subdomain_match' });
  });

  it('REGRESSION GUARD: does NOT fall back to ipquest on failure', () => {
    // The old code returned { slug: 'ipquest' } here. This must never happen again.
    const result = extractTenantSlug('bad-host.example.com');
    expect(result).not.toEqual({ slug: 'ipquest' });
    expect(result).toHaveProperty('error');
  });
});
