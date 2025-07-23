'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { LogisticsRequest } from '@/types';
import { FiMapPin, FiNavigation, FiClock, FiPackage, FiPhone } from 'react-icons/fi';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LogisticsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.id as string;
  
  const [delivery, setDelivery] = useState<LogisticsRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deliveryId) return;

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      doc(db, 'logisticsRequests', deliveryId),
      (doc) => {
        if (doc.exists()) {
          setDelivery({ ...doc.data(), id: doc.id } as LogisticsRequest);
        } else {
          toast.error('Delivery request not found');
          router.push('/customer/orders');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching delivery:', error);
        toast.error('Failed to load delivery details');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [deliveryId, router]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      pickedup: 'bg-purple-100 text-purple-800',
      delivering: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusMessage = (status: string) => {
    const messages: Record<string, string> = {
      pending: 'Looking for a delivery partner...',
      assigned: 'Delivery partner assigned!',
      pickedup: 'Package has been picked up.',
      delivering: 'Package is on the way.',
      delivered: 'Package has been delivered.',
      cancelled: 'Delivery has been cancelled.',
    };
    return messages[status] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!delivery) {
    return null;
  }

  const deliveryData = delivery as any;

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Delivery Details</h1>
                <p className="text-gray-600 mt-1">Tracking ID: #{delivery.relatedOrderId}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
              </span>
            </div>
            
            <p className="text-gray-700">{getStatusMessage(delivery.status)}</p>
          </div>

          {/* Package Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Package Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <FiPackage className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Package Type</p>
                  <p className="font-medium capitalize">{deliveryData.packageType || delivery.type}</p>
                </div>
              </div>

              {deliveryData.packageDescription && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-medium">{deliveryData.packageDescription}</p>
                </div>
              )}

              <div className="flex items-start">
                <FiMapPin className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Pickup Location</p>
                  <p className="font-medium">{delivery.pickupLocation.address}</p>
                  {deliveryData.pickupPhone && (
                    <p className="text-sm text-gray-500 mt-1">Contact: {deliveryData.pickupPhone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <FiNavigation className="h-5 w-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Drop Location</p>
                  <p className="font-medium">{delivery.dropLocation.address}</p>
                  {deliveryData.dropPhone && (
                    <p className="text-sm text-gray-500 mt-1">Contact: {deliveryData.dropPhone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <FiClock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Request Time</p>
                  <p className="font-medium">{formatDate(delivery.createdAt)} at {formatTime(delivery.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Partner Details */}
          {delivery.deliveryPersonId && delivery.status !== 'pending' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Delivery Partner</h2>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Partner ID: #{delivery.deliveryPersonId.slice(-6)}</p>
                  <p className="text-sm text-gray-600">Verified Delivery Partner</p>
                </div>
                
                {(delivery.status === 'assigned' || delivery.status === 'pickedup' || delivery.status === 'delivering') && (
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
                    <FiPhone className="mr-2" />
                    Call Partner
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tracking Timeline */}
          {delivery.status !== 'pending' && delivery.status !== 'cancelled' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Tracking Timeline</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    ['assigned', 'pickedup', 'delivering', 'delivered'].includes(delivery.status)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}>
                    <span className="text-white">1</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Package Assigned</p>
                    <p className="text-sm text-gray-600">Delivery partner assigned to pick up your package</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    ['pickedup', 'delivering', 'delivered'].includes(delivery.status)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}>
                    <span className="text-white">2</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Package Picked Up</p>
                    <p className="text-sm text-gray-600">Your package has been collected</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    ['delivering', 'delivered'].includes(delivery.status)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}>
                    <span className="text-white">3</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Out for Delivery</p>
                    <p className="text-sm text-gray-600">Package is on the way to destination</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    delivery.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <span className="text-white">4</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Delivered</p>
                    <p className="text-sm text-gray-600">Package delivered successfully</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/customer/orders')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 font-medium"
            >
              Back to Orders
            </button>
            
            {delivery.status === 'delivered' && (
              <button
                onClick={() => router.push('/services/logistics')}
                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 font-medium"
              >
                Send Another Package
              </button>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}