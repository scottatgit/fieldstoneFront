'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { PMProviders } from '../../../components/pm/PMProviders';
import { isDemoMode } from '../../../lib/demoApi';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Demo mode — allow admin UI for showcase purposes
    if (isDemoMode()) return;

    // Wait for Clerk to load
    if (!isLoaded) return;

    // Clerk active — check role claim
    const role = user?.publicMetadata?.role as string | undefined;
    if (role !== 'admin') {
      router.replace('/pm?error=admin_required');
    }
  }, [isLoaded, user, router]);

  return <PMProviders>{children}</PMProviders>;
}
