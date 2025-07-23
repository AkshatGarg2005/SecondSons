'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CabBooking } from '@/types';
import { FiMapPin, FiNavigation, FiClock, FiDollarSign, FiPhone, FiUser } from 'react-icons/fi';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CabBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<CabBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      doc(db, 'cabBookings', bookingId),
      (doc) => {
        if (doc.exists()) {
          setBooking({ ...doc.data(), id: doc.id } as CabBooking);
        } else {
          toast.error('Booking not found');
          router.push('/customer/orders');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching booking:', error);
        toast.error('Failed to load booking details');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bookingId, router]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusMessage = (status: string) => {
    const messages: Record<string, string> = {
      pending: 'Looking for a driver...',
      accepted: 'Driver assigned! They are on the way to pick you up.',
      ongoing: 'Your ride is in progress.',
      completed: 'Your ride has been completed.',
      cancelled: 'This ride has been cancelled.',
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

  if (!booking) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ride Details</h1>
                <p className="text-gray-600 mt-1">Booking ID: #{booking.id.slice(-6)}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
            
            <p className="text-gray-700">{getStatusMessage(booking.status)}</p>
          </div>

          {/* Trip Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Trip Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <FiMapPin className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Pickup Location</p>
                  <p className="font-medium">{booking.pickupLocation.address}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiNavigation className="h-5 w-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Drop Location</p>
                  <p className="font-medium">{booking.dropLocation.address}</p>
                </div>
              </div>

              {booking.distance && (
                <div className="flex items-center">
                  <FiMapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Distance</p>
                    <p className="font-medium">{booking.distance} km</p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <FiClock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Booking Time</p>
                  <p className="font-medium">{formatDate(booking.createdAt)} at {formatTime(booking.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Details */}
          {booking.driverId && booking.status !== 'pending' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Driver Details</h2>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-indigo-100 rounded-full p-3 mr-4">
                    <FiUser className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium">Driver ID: #{booking.driverId.slice(-6)}</p>
                    <p className="text-sm text-gray-600">Verified Driver</p>
                  </div>
                </div>
                
                {booking.status === 'accepted' || booking.status === 'ongoing' ? (
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
                    <FiPhone className="mr-2" />
                    Call Driver
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* Fare Details */}
          {booking.fare && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Fare Details</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Fare</span>
                  <span className="font-medium">₹50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance Charges</span>
                  <span className="font-medium">₹{booking.fare - 50}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Fare</span>
                    <span className="text-xl font-bold text-indigo-600">{formatCurrency(booking.fare)}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-3">
                Payment method: Cash
              </p>
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
            
            {booking.status === 'pending' && (
              <button className="flex-1 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 font-medium">
                Cancel Ride
              </button>
            )}
            
            {booking.status === 'completed' && (
              <button className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 font-medium">
                Book Again
              </button>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}