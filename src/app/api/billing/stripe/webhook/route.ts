import { NextRequest, NextResponse } from 'next/server'

// Stripe requires the raw body to verify the webhook signature.
// We must NOT let Next.js parse the body — read it as raw text and
// forward it as-is to the FastAPI backend.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const sig = req.headers.get('stripe-signature') ?? ''

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.fieldstone.pro'
    const apiUrl = `${apiBase}/api/billing/stripe/webhook`

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
