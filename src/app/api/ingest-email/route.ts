import { NextRequest, NextResponse } from 'next/server';
import { extractTenantSlug } from '@/lib/tenantSlug';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fieldstone.pro';

export async function POST(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const result = extractTenantSlug(host);

  // Fail safe: reject if the tenant slug cannot be cleanly resolved.
  // Never silently route to a default tenant. Ref: TBI-002 / fst-tbi-002.
  if ('error' in result) {
    console.warn(
      '[ingest-email] REJECTED host=%s error=%s ref=TBI-002',
      host,
      result.error
    );
    return NextResponse.json(
      {
        error: 'tenant_unresolvable',
        message: 'Tenant slug could not be extracted from request host.',
        host,
        ref: 'TBI-002',
      },
      { status: 400 }
    );
  }

  const { slug } = result;
  console.log('[ingest-email] host=%s slug=%s', host, slug);

  const headers = new Headers();
  headers.set('x-tenant-slug', slug);
  headers.set('content-type', 'application/json');
  const cookie = req.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);

  const upstream = await fetch(`${API_URL}/api/ingest/email`, {
    method: 'POST',
    headers,
  });

  const data = await upstream.text();
  return new NextResponse(data, {
    status: upstream.status,
    headers: { 'content-type': 'application/json' },
  });
}
