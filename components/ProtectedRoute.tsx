'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import Loading from '@/components/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAdmin?: boolean;
  adminType?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requireAdmin,
  adminType 
}: ProtectedRouteProps) {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
      return;
    }

    if (!loading && currentUser && userData) {
      if (allowedRoles && !allowedRoles.includes(userData.role)) {
        router.push('/unauthorized');
        return;
      }

      if (requireAdmin && userData.role !== 'admin') {
        router.push('/unauthorized');
        return;
      }

      if (adminType && userData.role === 'admin' && userData.adminType !== adminType) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [currentUser, userData, loading, allowedRoles, requireAdmin, adminType, router]);

  if (loading) {
    return <Loading />;
  }

  if (!currentUser || !userData) {
    return <Loading />;
  }

  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    return <Loading />;
  }

  if (requireAdmin && userData.role !== 'admin') {
    return <Loading />;
  }

  if (adminType && userData.role === 'admin' && userData.adminType !== adminType) {
    return <Loading />;
  }

  return <>{children}</>;
}