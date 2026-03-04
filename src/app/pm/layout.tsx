import { ReactNode } from 'react';
import { PMProviders } from '../../components/pm/PMProviders';

export const metadata = {
  title: 'Fieldstone PM | SecondBrain',
  description: 'Fieldstone Field Service Intelligence Dashboard',
};

export default function PMLayout({ children }: { children: ReactNode }) {
  return <PMProviders>{children}</PMProviders>;
}
