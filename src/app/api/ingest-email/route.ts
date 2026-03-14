import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fieldstone.pro';
const RESERVED = new Set(['www', 'api', 'admin', 'signal', 'static', 'demo']);

export async function POST(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const match = host.match(/^([a-z0-9-]+)\.signal\.fieldstone\.pro/);
  const slug = (match && !RESERVED.has(match[1])) ? match[1] : 'ipquest';

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
