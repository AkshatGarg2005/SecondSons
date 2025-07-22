'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ServiceCategory, ServiceOffering, ServiceBooking } from '@/types';
import { FiClock, FiCalendar, FiMapPin, FiCheck } from 'react-icons/fi';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ServiceCategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const categoryId = params.categoryId as string;
  
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceOffering | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '',
    address: '',
    notes: '',
  });
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetchCategory();
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      // For demo purposes, using static data
      const categories = [
        {
          id: '0',
          name: 'Plumbing',
          description: 'Tap repair, pipe fixing, bathroom fittings',
          icon: 'FiDroplet',
          services: [
            { id: '1', categoryId: '0', name: 'Tap Repair', description: 'Fix leaking or broken taps', basePrice: 200, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400' },
            { id: '2', categoryId: '0', name: 'Pipe Fixing', description: 'Repair or replace damaged pipes', basePrice: 500, duration: 60, imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee67df4c9e87?w=400' },
            { id: '3', categoryId: '0', name: 'Toilet Repair', description: 'Fix toilet issues including flush problems', basePrice: 400, duration: 45, imageUrl: 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=400' },
            { id: '4', categoryId: '0', name: 'Water Tank Cleaning', description: 'Clean and sanitize water tanks', basePrice: 1500, duration: 120, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '1',
          name: 'Electrical',
          description: 'Wiring, switch repair, appliance installation',
          icon: 'FiZap',
          services: [
            { id: '5', categoryId: '1', name: 'Switch Repair', description: 'Fix or replace switches and sockets', basePrice: 150, duration: 20, imageUrl: 'https://images.unsplash.com/photo-1565608087341-404b25492fee?w=400' },
            { id: '6', categoryId: '1', name: 'Wiring Work', description: 'New wiring installation or repairs', basePrice: 800, duration: 120, imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400' },
            { id: '7', categoryId: '1', name: 'Fan Installation', description: 'Install ceiling or wall mounted fans', basePrice: 300, duration: 45, imageUrl: 'https://images.unsplash.com/photo-1565636152586-e91c6e428c07?w=400' },
            { id: '8', categoryId: '1', name: 'MCB & Fuse Work', description: 'Install or repair MCB and fuses', basePrice: 400, duration: 30, imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=400' },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      const foundCategory = categories.find(cat => cat.id === categoryId);
      if (!foundCategory) {
        toast.error('Service category not found');
        router.push('/services/people');
        return;
      }
      
      setCategory(foundCategory);
    } catch (error) {
      console.error('Error fetching category:', error);
      toast.error('Failed to load category data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !category) return;
    
    const bookingDate = new Date(bookingForm.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      toast.error('Please select a future date');
      return;
    }
    
    setIsBooking(true);
    
    try {
      const bookingData: Omit<ServiceBooking, 'id'> = {
        customerId: userData!.id,
        serviceId: selectedService.id,
        scheduledDate: bookingDate,
        scheduledTime: bookingForm.time,
        address: {
          address: bookingForm.address,
          lat: 23.2599 + (Math.random() - 0.5) * 0.1,
          lng: 77.4126 + (Math.random() - 0.5) * 0.1,
        },
        status: 'pending',
        totalAmount: selectedService.basePrice,
        notes: bookingForm.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'serviceBookings'), {
        ...bookingData,
        categoryName: category.name,
        serviceName: selectedService.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast.success('Service booked successfully!');
      router.push(`/customer/bookings/service/${docRef.id}`);
    } catch (error) {
      console.error('Error booking service:', error);
      toast.error('Failed to book service');
    } finally {
      setIsBooking(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Next day
    return today.toISOString().split('T')[0];
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 18) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{category.name} Services</h1>
            <p className="text-gray-600 mt-2">{category.description}</p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {category.services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {service.imageUrl && (
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <FiClock className="mr-2" />
                    <span>Duration: {service.duration} mins</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-indigo-600">
                      {formatCurrency(service.basePrice)}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedService(service);
                        setShowBookingForm(true);
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Service Includes */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">What's Included</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <FiCheck className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Verified Professionals</h4>
                  <p className="text-sm text-gray-600">Background checked and trained service providers</p>
                </div>
              </div>
              <div className="flex items-start">
                <FiCheck className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">30-Day Service Warranty</h4>
                  <p className="text-sm text-gray-600">Free re-service if you face the same issue</p>
                </div>
              </div>
              <div className="flex items-start">
                <FiCheck className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Transparent Pricing</h4>
                  <p className="text-sm text-gray-600">No hidden charges, pay only what's shown</p>
                </div>
              </div>
              <div className="flex items-start">
                <FiCheck className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Safety Protocols</h4>
                  <p className="text-sm text-gray-600">All safety measures followed by professionals</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">How soon can I book a service?</h4>
                <p className="text-sm text-gray-600">
                  You can book a service for as early as tomorrow. Same-day services are subject to availability.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">What if I need to reschedule?</h4>
                <p className="text-sm text-gray-600">
                  You can reschedule your booking up to 2 hours before the scheduled time without any charges.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Are the prices fixed?</h4>
                <p className="text-sm text-gray-600">
                  Yes, the prices shown are fixed. Additional charges apply only for extra work or materials if required.
                </p>
              </div>
            </div>
          </div>

          {/* Booking Form Modal */}
          {showBookingForm && selectedService && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Book {selectedService.name}</h2>
                
                <form onSubmit={handleBookService}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Date
                      </label>
                      <div className="relative">
                        <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          required
                          min={getMinDate()}
                          value={bookingForm.date}
                          onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Time
                      </label>
                      <select
                        required
                        value={bookingForm.time}
                        onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select time slot</option>
                        {getTimeSlots().map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Address
                      </label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3 top-3 text-gray-400" />
                        <textarea
                          required
                          value={bookingForm.address}
                          onChange={(e) => setBookingForm({...bookingForm, address: e.target.value})}
                          placeholder="Enter your complete address"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={bookingForm.notes}
                        onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                        placeholder="Any specific requirements or instructions"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Service Charge</span>
                        <span className="font-medium">{formatCurrency(selectedService.basePrice)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium">{selectedService.duration} mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      type="submit"
                      disabled={isBooking}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isBooking ? 'Booking...' : 'Confirm Booking'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingForm(false);
                        setSelectedService(null);
                        setBookingForm({
                          date: '',
                          time: '',
                          address: '',
                          notes: '',
                        });
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}