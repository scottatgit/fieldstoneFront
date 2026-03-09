import { ReactNode, Suspense } from 'react';
import { PMProviders } from '../../components/pm/PMProviders';
import BillingBanner from '../../components/pm/BillingBanner';
import { WorkspaceGuard } from '../../components/pm/WorkspaceGuard';

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
      <WorkspaceGuard>
        {children}
      </WorkspaceGuard>
    </PMProviders>
  );
}
