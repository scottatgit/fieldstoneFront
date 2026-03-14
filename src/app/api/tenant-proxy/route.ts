import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fieldstone.pro';
const RESERVED = new Set(['www', 'api', 'admin', 'signal', 'static', 'demo']);

function extractSlug(host: string): string {
  // host: test1.signal.fieldstone.pro → test1
  const match = host.match(/^([a-z0-9-]+)\.signal\.fieldstone\.pro/);
  if (match && !RESERVED.has(match[1])) return match[1];
  return 'ipquest';
}

async function proxyRequest(req: NextRequest, endpoint: string) {
  const host = req.headers.get('host') || '';
  const slug = extractSlug(host);

  const headers = new Headers();
  headers.set('content-type', req.headers.get('content-type') || 'application/json');
  headers.set('x-tenant-slug', slug);
  // Forward auth cookie if present
  const cookie = req.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const auth = req.headers.get('authorization');
  if (auth) headers.set('authorization', auth);

  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? await req.text()
    : undefined;

  const upstream = await fetch(`${API_URL}/${endpoint}`, {
    method: req.method,
    headers,
    body,
  });

  const data = await upstream.text();
  return new NextResponse(data, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const endpoint = url.searchParams.get('endpoint') || '';
  return proxyRequest(req, endpoint);
}
