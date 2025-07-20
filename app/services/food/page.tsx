'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Restaurant, Dish } from '@/types';
import { FiClock, FiMapPin, FiStar, FiSearch, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function FoodDeliveryPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [onlyOpen, setOnlyOpen] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const restaurantsQuery = query(collection(db, 'restaurants'));
      const snapshot = await getDocs(restaurantsQuery);
      const restaurantsData: Restaurant[] = [];
      
      snapshot.forEach((doc) => {
        restaurantsData.push({ ...doc.data(), id: doc.id } as Restaurant);
      });
      
      setRestaurants(restaurantsData);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const cuisines = ['all', ...new Set(restaurants.flatMap(r => r.cuisine))];

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCuisine = selectedCuisine === 'all' || restaurant.cuisine.includes(selectedCuisine);
    const matchesOpen = !onlyOpen || restaurant.isOpen;
    return matchesSearch && matchesCuisine && matchesOpen;
  });

  const isRestaurantOpen = (restaurant: Restaurant) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [openHour, openMin] = restaurant.openingTime.split(':').map(Number);
    const [closeHour, closeMin] = restaurant.closingTime.split(':').map(Number);
    
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    return currentTime >= openTime && currentTime <= closeTime && restaurant.isOpen;
  };

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Food Delivery</h1>
            <p className="text-gray-600 mt-2">Order from your favorite local restaurants</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search restaurants or cuisines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setOnlyOpen(!onlyOpen)}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  onlyOpen 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <FiFilter className="mr-2" />
                {onlyOpen ? 'Open Now' : 'All'}
              </button>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2">
              {cuisines.map(cuisine => (
                <button
                  key={cuisine}
                  onClick={() => setSelectedCuisine(cuisine)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap ${
                    selectedCuisine === cuisine
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  {cuisine === 'all' ? 'All Cuisines' : cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* Restaurants Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No restaurants found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => {
                const isOpen = isRestaurantOpen(restaurant);
                return (
                  <Link
                    key={restaurant.id}
                    href={`/services/food/${restaurant.id}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative">
                      <img
                        src={restaurant.images[0]}
                        alt={restaurant.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium ${
                        isOpen
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isOpen ? 'Open' : 'Closed'}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{restaurant.cuisine.join(', ')}</p>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{restaurant.description}</p>
                      
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <FiClock className="mr-1" />
                          <span>30-45 min</span>
                        </div>
                        
                        {restaurant.rating && (
                          <div className="flex items-center text-yellow-600">
                            <FiStar className="mr-1 fill-current" />
                            <span>{restaurant.rating}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 flex items-center text-gray-500 text-sm">
                        <FiMapPin className="mr-1 flex-shrink-0" />
                        <span className="truncate">{restaurant.address.city}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">How Food Delivery Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-indigo-600 font-semibold">1</span>
                </div>
                <h3 className="font-medium mb-1">Browse</h3>
                <p className="text-sm text-gray-600">Explore restaurants and their menus</p>
              </div>
              
              <div className="text-center">
                <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-indigo-600 font-semibold">2</span>
                </div>
                <h3 className="font-medium mb-1">Order</h3>
                <p className="text-sm text-gray-600">Select dishes and place your order</p>
              </div>
              
              <div className="text-center">
                <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-indigo-600 font-semibold">3</span>
                </div>
                <h3 className="font-medium mb-1">Track</h3>
                <p className="text-sm text-gray-600">Monitor your order in real-time</p>
              </div>
              
              <div className="text-center">
                <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-indigo-600 font-semibold">4</span>
                </div>
                <h3 className="font-medium mb-1">Enjoy</h3>
                <p className="text-sm text-gray-600">Receive your food at your doorstep</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}