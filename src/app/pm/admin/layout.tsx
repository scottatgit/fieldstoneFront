'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import { PMProviders } from '../../../components/pm/PMProviders';
import { isDemoMode } from '../../../lib/demoApi';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isDemoMode()) return;
    if (!isLoaded) return;
    const role = user?.role;
    if (role !== 'admin') {
      router.replace('/pm?error=admin_required');
    }
  }, [isLoaded, user, router]);

  return <PMProviders>{children}</PMProviders>;
}
