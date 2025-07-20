'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { FiMapPin, FiNavigation, FiClock, FiDollarSign } from 'react-icons/fi';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import toast from 'react-hot-toast';
import { CabBooking } from '@/types';

export default function CabBookingPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const calculateFare = () => {
    // Simple fare calculation (would be more complex in production)
    const baseFare = 50;
    const perKmRate = 15;
    const estimatedDistance = Math.random() * 20 + 5; // Random distance for demo
    return Math.round(baseFare + (perKmRate * estimatedDistance));
  };

  const handleBookCab = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pickup || !dropoff) {
      toast.error('Please enter both pickup and drop locations');
      return;
    }

    setIsBooking(true);
    
    try {
      const bookingData = {
        customerId: userData?.id,
        pickupLocation: {
          address: pickup,
          lat: 23.2599 + (Math.random() - 0.5) * 0.1, // Random coords near Bhopal
          lng: 77.4126 + (Math.random() - 0.5) * 0.1,
        },
        dropLocation: {
          address: dropoff,
          lat: 23.2599 + (Math.random() - 0.5) * 0.1,
          lng: 77.4126 + (Math.random() - 0.5) * 0.1,
        },
        status: 'pending',
        fare: calculateFare(),
        distance: Math.round((Math.random() * 20 + 5) * 10) / 10,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'cabBookings'), bookingData);
      
      toast.success('Cab booked successfully! Finding a driver...');
      router.push(`/customer/bookings/cab/${docRef.id}`);
    } catch (error) {
      console.error('Error booking cab:', error);
      toast.error('Failed to book cab. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Book a Cab</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Booking Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Where would you like to go?</h2>
              
              <form onSubmit={handleBookCab} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="Enter pickup location"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drop Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiNavigation className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                      placeholder="Enter drop location"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isBooking}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBooking ? 'Booking...' : 'Book Now'}
                  </button>
                </div>
              </form>
            </div>

            {/* Fare Estimate */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Fare Estimate</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FiDollarSign className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">Base Fare</span>
                    </div>
                    <span className="font-medium">₹50</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FiMapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">Per KM Rate</span>
                    </div>
                    <span className="font-medium">₹15/km</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FiClock className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">Estimated Time</span>
                    </div>
                    <span className="font-medium">15-25 mins</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Estimated Total</span>
                      <span className="text-lg font-semibold text-indigo-600">₹200-350</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Available Cab Types</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Sedan - Comfortable for 4 passengers</li>
                  <li>• SUV - Spacious for 6-7 passengers</li>
                  <li>• Hatchback - Economical for 4 passengers</li>
                </ul>
              </div>

              <div className="bg-gray-100 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Safety Features</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ Driver verification and background checks</li>
                  <li>✓ Real-time GPS tracking</li>
                  <li>✓ Emergency contact button</li>
                  <li>✓ Trip details shared with contacts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}