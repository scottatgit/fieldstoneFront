import { ReactNode, Suspense } from 'react';
import { PMProviders } from '../../components/pm/PMProviders';
import BillingBanner from '../../components/pm/BillingBanner';

export const metadata = {
  title: 'Signal | Fieldstone',
  description: 'Signal — Operational Intelligence for Service Teams',
};

export default function PMLayout({ children }: { children: ReactNode }) {
  return (
    <PMProviders>
      <Suspense fallback={null}>
        <BillingBanner />
      </Suspense>
      {children}
    </PMProviders>
  );
}
