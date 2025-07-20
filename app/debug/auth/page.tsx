'use client';

import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

export default function AuthDebugPage() {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();

  const getDashboardLink = () => {
    if (!userData) return '/';
    
    switch (userData.role) {
      case 'admin':
        return `/admin/${userData.adminType || 'super'}`;
      case 'worker':
        return `/worker/${userData.workerService || 'cab'}`;
      case 'restaurant':
        return '/restaurant/dashboard';
      case 'homeowner':
        return '/homeowner/properties';
      default:
        return '/customer/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug Information</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Loading State</h2>
            <p className="text-gray-600">Loading: {loading ? 'Yes' : 'No'}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Firebase User</h2>
            {currentUser ? (
              <div className="space-y-1 text-sm">
                <p><strong>UID:</strong> {currentUser.uid}</p>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Display Name:</strong> {currentUser.displayName || 'Not set'}</p>
                <p><strong>Email Verified:</strong> {currentUser.emailVerified ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <p className="text-gray-600">No user logged in</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">User Data (from Firestore)</h2>
            {userData ? (
              <div className="space-y-1 text-sm">
                <p><strong>ID:</strong> {userData.id}</p>
                <p><strong>Name:</strong> {userData.name}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                <p><strong>Phone:</strong> {userData.phone}</p>
                <p><strong>Role:</strong> {userData.role}</p>
                {userData.adminType && <p><strong>Admin Type:</strong> {userData.adminType}</p>}
                {userData.workerService && <p><strong>Worker Service:</strong> {userData.workerService}</p>}
                <p><strong>Active:</strong> {userData.isActive ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {new Date(userData.createdAt).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-gray-600">No user data loaded</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Expected Dashboard</h2>
            {userData ? (
              <div>
                <p className="text-gray-600 mb-2">Based on your role, you should be redirected to:</p>
                <p className="font-mono bg-gray-100 p-2 rounded">{getDashboardLink()}</p>
                <button
                  onClick={() => router.push(getDashboardLink())}
                  className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <p className="text-gray-600">No user data to determine dashboard</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Troubleshooting Steps</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Make sure you're logged in (Firebase User should show data)</li>
              <li>Check if User Data is loaded from Firestore</li>
              <li>Verify your role is set correctly</li>
              <li>Try logging out and logging back in</li>
              <li>Check browser console for any errors</li>
              <li>Ensure Firestore rules allow reading user data</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}