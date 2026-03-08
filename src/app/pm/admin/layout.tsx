'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PMProviders } from '../../../components/pm/PMProviders';
import { getActiveTenant } from '../../../lib/demoApi';

const ADMIN_TENANT = 'ipquest';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Client-side guard — belt-and-suspenders alongside middleware
    try {
      const tenant = getActiveTenant();
      if (tenant !== ADMIN_TENANT) {
        router.replace('/pm?error=admin_required');
      }
    } catch {
      // window not available during SSR — middleware handles server-side
    }
  }, [router]);

  return <PMProviders>{children}</PMProviders>;
}
