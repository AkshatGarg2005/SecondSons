'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getDashboardRoute } from '@/lib/utils';

export default function TestPage() {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser && userData) {
      const dashboardRoute = getDashboardRoute(userData);
      console.log('Redirecting to:', dashboardRoute);
      router.push(dashboardRoute);
    }
  }, [currentUser, userData, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to your dashboard...</h1>
        <p className="text-gray-600">If you're not redirected, click the button below:</p>
        {userData && (
          <button
            onClick={() => {
              const dashboardRoute = getDashboardRoute(userData);
              router.push(dashboardRoute);
            }}
            className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}