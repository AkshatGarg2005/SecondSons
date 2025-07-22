'use client';

import Link from 'next/link';
import { FiLock } from 'react-icons/fi';

export default function AdminAccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center mb-6">
          <FiLock className="h-12 w-12 text-indigo-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-6">Admin Access</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            This page is for development purposes only. In production, admin accounts should be created through secure channels.
          </p>
        </div>
        
        <Link
          href="/admin/register"
          className="block w-full text-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Create Admin Account
        </Link>
        
        <div className="mt-6 text-sm text-gray-600">
          <p className="font-medium mb-2">Admin Types:</p>
          <ul className="space-y-1">
            <li>• Super Admin - Full system access</li>
            <li>• Cab Admin - Manage cab services</li>
            <li>• Commerce Admin - Manage deliveries</li>
            <li>• Service Admin - Manage home services</li>
            <li>• Logistics Admin - Manage logistics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}