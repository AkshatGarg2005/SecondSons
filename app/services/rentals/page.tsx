'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Property } from '@/types';
import { FiHome, FiMapPin, FiBed, FiBath, FiSquare, FiSearch, FiFilter } from 'react-icons/fi';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function HomeRentalsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>('all');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const propertiesQuery = query(
        collection(db, 'properties'),
        where('isAvailable', '==', true)
      );
      const snapshot = await getDocs(propertiesQuery);
      const propertiesData: Property[] = [];
      
      snapshot.forEach((doc) => {
        propertiesData.push({ ...doc.data(), id: doc.id } as Property);
      });
      
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = ['all', 'house', 'apartment', 'pg', 'room'];
  const bedroomOptions = ['all', '1', '2', '3', '4+'];

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.address.street.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || property.type === selectedType;
    
    const matchesPrice = (!priceRange.min || property.rent >= parseInt(priceRange.min)) &&
                        (!priceRange.max || property.rent <= parseInt(priceRange.max));
    
    const matchesBedrooms = selectedBedrooms === 'all' || 
                           (selectedBedrooms === '4+' && property.bedrooms && property.bedrooms >= 4) ||
                           (property.bedrooms?.toString() === selectedBedrooms);
    
    return matchesSearch && matchesType && matchesPrice && matchesBedrooms;
  });

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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Home Rentals</h1>
            <p className="text-gray-600 mt-2">Find your perfect home or PG accommodation</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by location, property name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Types' : getPropertyTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <select
                    value={selectedBedrooms}
                    onChange={(e) => setSelectedBedrooms(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {bedroomOptions.map(option => (
                      <option key={option} value={option}>
                        {option === 'all' ? 'Any' : option === '4+' ? '4 or more' : `${option} BHK`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Results Count */}
                <div className="flex items-end">
                  <p className="text-sm text-gray-600">
                    Showing {filteredProperties.length} of {properties.length} properties
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <FiHome className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No properties found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/services/rentals/${property.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="relative">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md text-xs font-medium">
                      {getPropertyTypeLabel(property.type)}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <FiMapPin className="mr-1 flex-shrink-0" />
                      <span className="truncate">{property.address.city}</span>
                    </div>
                    
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {property.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      {property.bedrooms && (
                        <div className="flex items-center">
                          <FiBed className="mr-1" />
                          <span>{property.bedrooms} Bed</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center">
                          <FiBath className="mr-1" />
                          <span>{property.bathrooms} Bath</span>
                        </div>
                      )}
                      {property.area && (
                        <div className="flex items-center">
                          <FiSquare className="mr-1" />
                          <span>{property.area} sqft</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-indigo-600">
                          {formatCurrency(property.rent)}
                        </span>
                        <span className="text-gray-600 text-sm">/month</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Deposit</p>
                        <p className="font-medium">{formatCurrency(property.deposit)}</p>
                      </div>
                    </div>
                    
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {property.amenities.slice(0, 3).map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{property.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Tips for Finding the Perfect Rental</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium mb-2">Set Your Budget</h3>
                <p className="text-sm text-gray-600">
                  Consider not just rent but also deposit, maintenance charges, and utility bills.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Check Amenities</h3>
                <p className="text-sm text-gray-600">
                  Look for essential amenities like parking, water supply, power backup, and security.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Visit the Property</h3>
                <p className="text-sm text-gray-600">
                  Always visit in person to check the actual condition and neighborhood before finalizing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}