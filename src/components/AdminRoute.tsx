// src/components/AdminRoute.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../redux/hooks';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/'); // Redirect non-admin users
    }
  }, [isAuthenticated, user, router]);

  // Optionally, add a loading state
  if (!isAuthenticated || user?.role !== 'admin') {
    return null; // Or display a loading indicator
  }

  return <>{children}</>;
};

export default AdminRoute;
