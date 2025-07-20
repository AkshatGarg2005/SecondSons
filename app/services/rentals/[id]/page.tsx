'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Property, RentalBooking, User } from '@/types';
import { FiMapPin, FiBed, FiBath, FiSquare, FiPhone, FiMail, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [isContacting, setIsContacting] = useState(false);

  useEffect(() => {
    fetchPropertyData();
  }, [propertyId]);

  const fetchPropertyData = async () => {
    try {
      // Fetch property
      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      if (!propertyDoc.exists()) {
        toast.error('Property not found');
        router.push('/services/rentals');
        return;
      }
      
      const propertyData = { ...propertyDoc.data(), id: propertyDoc.id } as Property;
      setProperty(propertyData);

      // Fetch owner details
      const ownerDoc = await getDoc(doc(db, 'users', propertyData.ownerId));
      if (ownerDoc.exists()) {
        setOwner(ownerDoc.data() as User);
      }
    } catch (error) {
      console.error('Error fetching property data:', error);
      toast.error('Failed to load property data');
    } finally {
      setLoading(false);
    }
  };

  const handleContactOwner = async () => {
    if (!contactMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsContacting(true);

    try {
      const bookingData: Omit<RentalBooking, 'id'> = {
        propertyId: property!.id,
        tenantId: userData!.id,
        ownerId: property!.ownerId,
        checkIn: new Date(),
        status: 'inquiry',
        monthlyRent: property!.rent,
        deposit: property!.deposit,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'rentalBookings'), {
        ...bookingData,
        message: contactMessage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Inquiry sent successfully! The owner will contact you soon.');
      setShowContactForm(false);
      setContactMessage('');
    } catch (error) {
      console.error('Error sending inquiry:', error);
      toast.error('Failed to send inquiry');
    } finally {
      setIsContacting(false);
    }
  };

  const nextImage = () => {
    if (property && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property && property.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      house: 'House',
      apartment: 'Apartment',
      pg: 'PG',
      room: 'Room'
    };
    return labels[type] || type;
  };

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Image Gallery */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="relative h-96">
              <img
                src={property.images[currentImageIndex]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <FiChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <FiChevronRight className="h-6 w-6" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              
              <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-md font-medium">
                {getPropertyTypeLabel(property.type)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Property Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-4">{property.title}</h1>
                
                <div className="flex items-center text-gray-600 mb-4">
                  <FiMapPin className="mr-2" />
                  <span>{property.address.street}, {property.address.city}, {property.address.state} - {property.address.pincode}</span>
                </div>
                
                <div className="flex flex-wrap gap-6 mb-6">
                  {property.bedrooms && (
                    <div className="flex items-center">
                      <FiBed className="mr-2 text-gray-400" />
                      <span>{property.bedrooms} Bedrooms</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center">
                      <FiBath className="mr-2 text-gray-400" />
                      <span>{property.bathrooms} Bathrooms</span>
                    </div>
                  )}
                  {property.area && (
                    <div className="flex items-center">
                      <FiSquare className="mr-2 text-gray-400" />
                      <span>{property.area} sqft</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-6">
                  <h2 className="text-lg font-semibold mb-3">Description</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{property.description}</p>
                </div>
                
                {property.amenities && property.amenities.length > 0 && (
                  <div className="border-t pt-6">
                    <h2 className="text-lg font-semibold mb-3">Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {property.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center">
                          <FiCheck className="mr-2 text-green-500" />
                          <span className="text-gray-600">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing and Contact */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Pricing</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monthly Rent</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {formatCurrency(property.rent)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(property.deposit)}
                    </span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Move-in Cost</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(property.rent + property.deposit)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    property.isAvailable
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {property.isAvailable ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>

              {owner && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold mb-4">Property Owner</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 rounded-full p-3 mr-3">
                        <span className="text-indigo-600 font-semibold text-lg">
                          {owner.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{owner.name}</p>
                        <p className="text-sm text-gray-600">Property Owner</p>
                      </div>
                    </div>
                    
                    <div className="pt-3">
                      <p className="text-sm text-gray-600 mb-3">
                        Listed on {formatDate(property.createdAt)}
                      </p>
                      
                      {!showContactForm ? (
                        <button
                          onClick={() => setShowContactForm(true)}
                          disabled={!property.isAvailable}
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Contact Owner
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <textarea
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            placeholder="Hi, I'm interested in this property..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            rows={4}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={handleContactOwner}
                              disabled={isContacting}
                              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {isContacting ? 'Sending...' : 'Send Inquiry'}
                            </button>
                            <button
                              onClick={() => {
                                setShowContactForm(false);
                                setContactMessage('');
                              }}
                              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Safety Tips */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">Safety Tips</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Always visit the property before making any payment</li>
                  <li>• Verify all documents and ownership details</li>
                  <li>• Don't transfer money without proper agreement</li>
                  <li>• Check for any pending dues or legal issues</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}