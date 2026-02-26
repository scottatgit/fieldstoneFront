import { ReactNode } from 'react';
import { PMProviders } from '../../components/pm/PMProviders';

export const metadata = {
  title: 'IPQuest PM | Second Brain',
  description: 'IPQuest Project Management Intelligence Dashboard',
};

export default function PMLayout({ children }: { children: ReactNode }) {
  return <PMProviders>{children}</PMProviders>;
}
