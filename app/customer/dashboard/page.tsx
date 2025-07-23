'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { formatDate, formatTime } from '@/lib/utils';
import { FiTruck, FiShoppingCart, FiHome, FiUsers, FiPackage, FiMapPin, FiClock, FiDollarSign, FiList } from 'react-icons/fi';

const services = [
  {
    title: 'Book a Cab',
    description: 'Get a ride anywhere in the city',
    icon: FiMapPin,
    href: '/services/cab',
    color: 'bg-blue-500',
    stats: { label: 'Avg. wait time', value: '5 mins' },
  },
  {
    title: 'Quick Commerce',
    description: 'Order groceries and essentials',
    icon: FiShoppingCart,
    href: '/services/commerce',
    color: 'bg-green-500',
    stats: { label: 'Delivery time', value: '30 mins' },
  },
  {
    title: 'Find Rentals',
    description: 'Search for homes and PGs',
    icon: FiHome,
    href: '/services/rentals',
    color: 'bg-purple-500',
    stats: { label: 'Properties', value: '500+' },
  },
  {
    title: 'Food Delivery',
    description: 'Order from local restaurants',
    icon: FiTruck,
    href: '/services/food',
    color: 'bg-red-500',
    stats: { label: 'Restaurants', value: '200+' },
  },
  {
    title: 'Book Services',
    description: 'Plumbers, electricians & more',
    icon: FiUsers,
    href: '/services/people',
    color: 'bg-yellow-500',
    stats: { label: 'Service pros', value: '1000+' },
  },
  {
    title: 'Send Package',
    description: 'Local delivery service',
    icon: FiPackage,
    href: '/services/logistics',
    color: 'bg-indigo-500',
    stats: { label: 'Same day', value: '99%' },
  },
];

export default function CustomerDashboard() {
  const { userData } = useAuth();
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    if (userData) {
      fetchRecentActivities();
    }
  }, [userData]);

  const fetchRecentActivities = async () => {
    if (!userData) return;
  
    try {
      const activities: any[] = [];
      
      // Fetch recent cab bookings
      const cabQuery = query(
        collection(db, 'cabBookings'),
        where('customerId', '==', userData.id),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const cabSnapshot = await getDocs(cabQuery);
      cabSnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          type: 'cab',
          title: 'Cab Ride',
          status: doc.data().status,
          createdAt: doc.data().createdAt.toDate(),
        });
      });
      
      // Fetch recent food orders
      const foodQuery = query(
        collection(db, 'foodOrders'),
        where('customerId', '==', userData.id),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const foodSnapshot = await getDocs(foodQuery);
      foodSnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          type: 'food',
          title: 'Food Order',
          status: doc.data().status,
          createdAt: doc.data().createdAt.toDate(),
        });
      });
      
      // Sort by date and take latest 5
      activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome back, {userData?.name}!
                </h1>
                <p className="text-gray-600">
                  What would you like to do today?
                </p>
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/customer/cart"
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center"
                >
                  <FiShoppingCart className="mr-2" />
                  My Cart
                </Link>
                <Link
                  href="/customer/orders"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                >
                  <FiList className="mr-2" />
                  My Orders
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3">
                  <FiMapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Rides</p>
                  <p className="text-xl font-semibold">0</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3">
                  <FiShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Orders</p>
                  <p className="text-xl font-semibold">0</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3">
                  <FiClock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Bookings</p>
                  <p className="text-xl font-semibold">0</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-yellow-100 rounded-full p-3">
                  <FiDollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-xl font-semibold">₹0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${service.color} w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{service.stats.label}</p>
                        <p className="text-sm font-semibold text-gray-900">{service.stats.value}</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {service.description}
                    </p>
                  </div>
                  <div className={`h-1 ${service.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
                </Link>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <Link href="/customer/orders" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                View all →
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              {activitiesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : recentActivities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No recent activity. Start using our services to see your history here.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          activity.type === 'cab' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'food' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {activity.type === 'cab' ? <FiMapPin className="h-5 w-5" /> : <FiTruck className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(activity.createdAt)} at {formatTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'completed' || activity.status === 'delivered' 
                          ? 'bg-green-100 text-green-800' 
                          : activity.status === 'cancelled' 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}