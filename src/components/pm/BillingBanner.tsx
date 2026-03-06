'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { pmFetch } from '@/lib/demoApi';

const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

interface BillingStatus {
  tenant: string;
  plan: string;
  billing_status: string;
  trial_ends_at: string | null;
  days_remaining: number | null;
}

interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export default function BillingBanner() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  useEffect(() => {
    if (isDemo) return;
    pmFetch('/api/tenant/billing-status', PM_API)
      .then(data => { if (data) setStatus(data as BillingStatus); })
      .catch(() => {});
  }, [isDemo]);

  useEffect(() => {
    const billing = searchParams.get('billing');
    if (billing === 'success') {
      setToast('\u2705 Subscription activated \u2014 welcome to Fieldstone!');
      setTimeout(() => setToast(null), 5000);
    } else if (billing === 'cancel') {
      setToast('Checkout cancelled. Your trial is still active.');
      setTimeout(() => setToast(null), 4000);
    }
  }, [searchParams]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const data = await pmFetch(
        '/api/billing/create-checkout-session',
        PM_API,
        { method: 'POST' }
      ) as CheckoutResponse;
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setToast('Unable to start checkout. Please contact support.');
        setTimeout(() => setToast(null), 4000);
      }
    } catch {
      setToast('Network error. Please try again.');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setUpgrading(false);
    }
  };

  if (isDemo) return null;
  if (!status) return null;

  const isExempt = ['internal', 'demo', 'active'].includes(status.billing_status);
  const showBanner =
    status.billing_status === 'trial' &&
    status.days_remaining !== null &&
    status.days_remaining <= 5;
  const showExpired =
    status.billing_status === 'trial' &&
    status.days_remaining !== null &&
    status.days_remaining <= 0;
  const showPastDue   = status.billing_status === 'past_due';
  const showCancelled = status.billing_status === 'cancelled';

  if (isExempt && !toast) return null;

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-lg shadow-xl border border-gray-700">
          {toast}
        </div>
      )}

      {/* Trial expiry warning */}
      {(showBanner || showExpired) && (
        <div className={`w-full px-4 py-2 text-sm flex items-center justify-between gap-3 ${
          showExpired
            ? 'bg-red-900/80 text-red-100 border-b border-red-700'
            : 'bg-amber-900/70 text-amber-100 border-b border-amber-700'
        }`}>
          <span>
            {showExpired
              ? '\u26d4 Your trial has expired.'
              : `\u26a0\ufe0f Trial ends in ${status.days_remaining} day${
                  status.days_remaining === 1 ? '' : 's'
                }.`
            }{' '}
            Upgrade to keep using Fieldstone.
          </span>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="shrink-0 bg-white text-gray-900 font-semibold text-xs px-3 py-1.5 rounded hover:bg-gray-100 disabled:opacity-50 transition"
          >
            {upgrading ? 'Loading\u2026' : 'Upgrade \u2192'}
          </button>
        </div>
      )}

      {/* Past due */}
      {showPastDue && (
        <div className="w-full px-4 py-2 text-sm flex items-center justify-between gap-3 bg-red-900/80 text-red-100 border-b border-red-700">
          <span>\u26a0\ufe0f Payment failed \u2014 please update your billing to restore access.</span>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="shrink-0 bg-white text-gray-900 font-semibold text-xs px-3 py-1.5 rounded hover:bg-gray-100 disabled:opacity-50 transition"
          >
            {upgrading ? 'Loading\u2026' : 'Update Billing \u2192'}
          </button>
        </div>
      )}

      {/* Cancelled */}
      {showCancelled && (
        <div className="w-full px-4 py-2 text-sm flex items-center justify-between gap-3 bg-gray-800 text-gray-300 border-b border-gray-700">
          <span>Your subscription has been cancelled. Reactivate to continue using Fieldstone.</span>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="shrink-0 bg-white text-gray-900 font-semibold text-xs px-3 py-1.5 rounded hover:bg-gray-100 disabled:opacity-50 transition"
          >
            {upgrading ? 'Loading\u2026' : 'Reactivate \u2192'}
          </button>
        </div>
      )}
    </>
  );
}
