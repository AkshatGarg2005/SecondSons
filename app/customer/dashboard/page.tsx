'use client';

import React from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { FiTruck, FiShoppingCart, FiHome, FiUsers, FiPackage, FiMapPin, FiClock, FiDollarSign } from 'react-icons/fi';

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

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {userData?.name}!
            </h1>
            <p className="text-gray-600">
              What would you like to do today?
            </p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-center py-8">
                No recent activity. Start using our services to see your history here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}