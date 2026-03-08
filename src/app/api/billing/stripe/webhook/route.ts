import { NextRequest, NextResponse } from 'next/server'

// Stripe requires the raw body to verify the webhook signature.
// We must NOT let Next.js parse the body — read it as raw text and
// forward it as-is to the FastAPI backend.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const sig = req.headers.get('stripe-signature') ?? ''

    const apiUrl = process.env.NEXT_PUBLIC_PM_API_URL
      ? `${process.env.NEXT_PUBLIC_PM_API_URL.replace('/pm-api', '')}/api/billing/stripe/webhook`
      : 'https://api.brandie.cc/api/billing/stripe/webhook'

    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': sig,
      },
      body: rawBody,
    })

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error('[webhook] proxy error:', err)
    return NextResponse.json({ error: 'proxy_error' }, { status: 500 })
  }
}
