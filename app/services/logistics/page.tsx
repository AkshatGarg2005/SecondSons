'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { LogisticsRequest } from '@/types';
import { FiPackage, FiMapPin, FiTruck, FiClock, FiDollarSign, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { calculateDistance } from '@/lib/utils';

export default function LogisticsPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    packageType: 'document' as 'document' | 'small' | 'medium' | 'large',
    pickupAddress: '',
    dropAddress: '',
    pickupPhone: '',
    dropPhone: '',
    packageDescription: '',
    preferredTime: 'now' as 'now' | 'scheduled',
    scheduledDate: '',
    scheduledTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const packageTypes = [
    { value: 'document', label: 'Documents', maxWeight: '500g', basePrice: 50 },
    { value: 'small', label: 'Small Package', maxWeight: '5kg', basePrice: 80 },
    { value: 'medium', label: 'Medium Package', maxWeight: '10kg', basePrice: 120 },
    { value: 'large', label: 'Large Package', maxWeight: '20kg', basePrice: 200 },
  ];

  const estimatePrice = () => {
    const packageType = packageTypes.find(p => p.value === formData.packageType);
    const basePrice = packageType?.basePrice || 50;
    
    // For demo, add random distance cost
    const distanceCost = Math.floor(Math.random() * 50) + 20;
    
    return basePrice + distanceCost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.preferredTime === 'scheduled' && (!formData.scheduledDate || !formData.scheduledTime)) {
      toast.error('Please select date and time for scheduled delivery');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const pickupCoords = {
        lat: 23.2599 + (Math.random() - 0.5) * 0.1,
        lng: 77.4126 + (Math.random() - 0.5) * 0.1,
      };
      
      const dropCoords = {
        lat: 23.2599 + (Math.random() - 0.5) * 0.1,
        lng: 77.4126 + (Math.random() - 0.5) * 0.1,
      };
      
      const requestData: Omit<LogisticsRequest, 'id'> = {
        type: 'package',
        relatedOrderId: `PKG${Date.now()}`, // Generate package ID
        pickupLocation: {
          address: formData.pickupAddress,
          lat: pickupCoords.lat,
          lng: pickupCoords.lng,
        },
        dropLocation: {
          address: formData.dropAddress,
          lat: dropCoords.lat,
          lng: dropCoords.lng,
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'logisticsRequests'), {
        ...requestData,
        customerId: userData!.id,
        packageType: formData.packageType,
        packageDescription: formData.packageDescription,
        pickupPhone: formData.pickupPhone,
        dropPhone: formData.dropPhone,
        preferredTime: formData.preferredTime,
        scheduledDate: formData.scheduledDate || null,
        scheduledTime: formData.scheduledTime || null,
        estimatedPrice: estimatePrice(),
        estimatedDistance: calculateDistance(pickupCoords.lat, pickupCoords.lng, dropCoords.lat, dropCoords.lng),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast.success('Delivery request created successfully!');
      router.push(`/customer/deliveries/${docRef.id}`);
    } catch (error) {
      console.error('Error creating delivery request:', error);
      toast.error('Failed to create delivery request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Send Package</h1>
            <p className="text-gray-600 mt-2">Fast and reliable local delivery service</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
                {/* Package Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Package Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {packageTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({...formData, packageType: type.value as any})}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          formData.packageType === type.value
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <FiPackage className={`h-8 w-8 mx-auto mb-2 ${
                          formData.packageType === type.value ? 'text-indigo-600' : 'text-gray-400'
                        }`} />
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-gray-500">Up to {type.maxWeight}</p>
                        <p className="text-sm font-semibold mt-1">₹{type.basePrice}+</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pickup Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Pickup Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup Address
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-3 text-gray-400" />
                      <textarea
                        required
                        value={formData.pickupAddress}
                        onChange={(e) => setFormData({...formData, pickupAddress: e.target.value})}
                        placeholder="Enter complete pickup address"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sender's Phone
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="[6-9]\d{9}"
                      value={formData.pickupPhone}
                      onChange={(e) => setFormData({...formData, pickupPhone: e.target.value})}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Drop Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Drop Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Drop Address
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-3 text-gray-400" />
                      <textarea
                        required
                        value={formData.dropAddress}
                        onChange={(e) => setFormData({...formData, dropAddress: e.target.value})}
                        placeholder="Enter complete delivery address"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Receiver's Phone
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="[6-9]\d{9}"
                      value={formData.dropPhone}
                      onChange={(e) => setFormData({...formData, dropPhone: e.target.value})}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Package Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Description
                  </label>
                  <textarea
                    value={formData.packageDescription}
                    onChange={(e) => setFormData({...formData, packageDescription: e.target.value})}
                    placeholder="What are you sending? (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                  />
                </div>

                {/* Delivery Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Delivery Time
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, preferredTime: 'now'})}
                      className={`p-3 rounded-lg border-2 text-center ${
                        formData.preferredTime === 'now'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <FiTruck className={`h-6 w-6 mx-auto mb-1 ${
                        formData.preferredTime === 'now' ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                      <p className="font-medium">Pickup Now</p>
                      <p className="text-xs text-gray-500">Within 60 mins</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, preferredTime: 'scheduled'})}
                      className={`p-3 rounded-lg border-2 text-center ${
                        formData.preferredTime === 'scheduled'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <FiClock className={`h-6 w-6 mx-auto mb-1 ${
                        formData.preferredTime === 'scheduled' ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                      <p className="font-medium">Schedule</p>
                      <p className="text-xs text-gray-500">Pick date & time</p>
                    </button>
                  </div>

                  {formData.preferredTime === 'scheduled' && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          required={formData.preferredTime === 'scheduled'}
                          min={getMinDate()}
                          value={formData.scheduledDate}
                          onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time
                        </label>
                        <input
                          type="time"
                          required={formData.preferredTime === 'scheduled'}
                          value={formData.scheduledTime}
                          onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Request...' : 'Request Pickup'}
                </button>
              </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Estimate */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-medium text-lg mb-4">Price Estimate</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price</span>
                    <span className="font-medium">
                      ₹{packageTypes.find(p => p.value === formData.packageType)?.basePrice || 50}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance Charge</span>
                    <span className="font-medium">₹20-70</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Estimated Total</span>
                      <span className="text-xl font-bold text-indigo-600">
                        ₹{estimatePrice()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  *Final price may vary based on actual distance
                </p>
              </div>

              {/* Features */}
              <div className="bg-indigo-50 rounded-lg p-6">
                <h3 className="font-medium text-lg mb-4">Why Choose Us?</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <FiTruck className="text-indigo-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Real-time Tracking</p>
                      <p className="text-sm text-gray-600">Track your package live</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiDollarSign className="text-indigo-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Transparent Pricing</p>
                      <p className="text-sm text-gray-600">No hidden charges</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiInfo className="text-indigo-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Insurance Coverage</p>
                      <p className="text-sm text-gray-600">Up to ₹10,000 protection</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guidelines */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Prohibited Items</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Cash or jewelry</li>
                  <li>• Hazardous materials</li>
                  <li>• Illegal substances</li>
                  <li>• Perishable food items</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}