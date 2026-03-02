import { ReactNode } from 'react';
import { PMProviders } from '../../../components/pm/PMProviders';

export const metadata = {
  title: 'Admin | IPQuest PM',
  description: 'System vitality and operational metrics',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <PMProviders>{children}</PMProviders>;
}
