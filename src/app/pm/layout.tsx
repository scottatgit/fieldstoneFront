import { ReactNode, Suspense } from 'react';
import { PMProviders } from '../../components/pm/PMProviders';
import BillingBanner from '../../components/pm/BillingBanner';

export const metadata = {
  title: 'Fieldstone PM | SecondBrain',
  description: 'Fieldstone Field Service Intelligence Dashboard',
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
