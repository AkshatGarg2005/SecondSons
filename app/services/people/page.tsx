'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ServiceCategory } from '@/types';
import { FiTool, FiDroplet, FiZap, FiWind, FiHome, FiShield, FiMonitor, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';

const iconMap: Record<string, any> = {
  'Plumbing': FiDroplet,
  'Electrical': FiZap,
  'AC Repair': FiWind,
  'Carpentry': FiTool,
  'Painting': FiHome,
  'Pest Control': FiShield,
  'Appliance Repair': FiMonitor,
  'Moving': FiPackage,
};

export default function ServicesOnDemandPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesQuery = query(collection(db, 'serviceCategories'));
      const snapshot = await getDocs(categoriesQuery);
      const categoriesData: ServiceCategory[] = [];
      
      snapshot.forEach((doc) => {
        categoriesData.push({ ...doc.data(), id: doc.id } as ServiceCategory);
      });
      
      // If no categories exist, create default ones
      if (categoriesData.length === 0) {
        const defaultCategories = [
          {
            name: 'Plumbing',
            description: 'Tap repair, pipe fixing, bathroom fittings',
            icon: 'FiDroplet',
            services: [
              { id: '1', categoryId: '', name: 'Tap Repair', description: 'Fix leaking or broken taps', basePrice: 200, duration: 30 },
              { id: '2', categoryId: '', name: 'Pipe Fixing', description: 'Repair or replace damaged pipes', basePrice: 500, duration: 60 },
              { id: '3', categoryId: '', name: 'Toilet Repair', description: 'Fix toilet issues', basePrice: 400, duration: 45 },
            ]
          },
          {
            name: 'Electrical',
            description: 'Wiring, switch repair, appliance installation',
            icon: 'FiZap',
            services: [
              { id: '4', categoryId: '', name: 'Switch Repair', description: 'Fix or replace switches', basePrice: 150, duration: 20 },
              { id: '5', categoryId: '', name: 'Wiring Work', description: 'New wiring or repairs', basePrice: 800, duration: 120 },
              { id: '6', categoryId: '', name: 'Fan Installation', description: 'Install ceiling or wall fans', basePrice: 300, duration: 45 },
            ]
          },
          {
            name: 'AC Repair',
            description: 'AC service, repair, and installation',
            icon: 'FiWind',
            services: [
              { id: '7', categoryId: '', name: 'AC Service', description: 'Regular AC maintenance', basePrice: 500, duration: 60 },
              { id: '8', categoryId: '', name: 'Gas Filling', description: 'AC gas refilling', basePrice: 2000, duration: 90 },
              { id: '9', categoryId: '', name: 'AC Installation', description: 'New AC installation', basePrice: 1500, duration: 180 },
            ]
          },
          {
            name: 'Carpentry',
            description: 'Furniture repair, door fixing, woodwork',
            icon: 'FiTool',
            services: [
              { id: '10', categoryId: '', name: 'Furniture Repair', description: 'Fix broken furniture', basePrice: 400, duration: 60 },
              { id: '11', categoryId: '', name: 'Door Repair', description: 'Fix door issues', basePrice: 300, duration: 45 },
              { id: '12', categoryId: '', name: 'Cabinet Work', description: 'Install or repair cabinets', basePrice: 1000, duration: 120 },
            ]
          },
          {
            name: 'Painting',
            description: 'Wall painting, texture work, polishing',
            icon: 'FiHome',
            services: [
              { id: '13', categoryId: '', name: 'Room Painting', description: 'Paint a single room', basePrice: 3000, duration: 480 },
              { id: '14', categoryId: '', name: 'Wall Texture', description: 'Texture work on walls', basePrice: 100, duration: 60 },
              { id: '15', categoryId: '', name: 'Wood Polish', description: 'Polish wooden furniture', basePrice: 500, duration: 120 },
            ]
          },
          {
            name: 'Appliance Repair',
            description: 'Washing machine, refrigerator, microwave repair',
            icon: 'FiMonitor',
            services: [
              { id: '16', categoryId: '', name: 'Washing Machine', description: 'Repair washing machines', basePrice: 500, duration: 60 },
              { id: '17', categoryId: '', name: 'Refrigerator', description: 'Fix refrigerator issues', basePrice: 600, duration: 90 },
              { id: '18', categoryId: '', name: 'Microwave', description: 'Repair microwave ovens', basePrice: 400, duration: 45 },
            ]
          },
        ];
        
        // For demo purposes, use the default data
        setCategories(defaultCategories.map((cat, index) => ({
          id: index.toString(),
          ...cat,
          createdAt: new Date(),
          updatedAt: new Date(),
        })));
        return;
      }
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load service categories');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Services on Demand</h1>
            <p className="text-gray-600 mt-2">Book trusted professionals for all your home service needs</p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <FiTool className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Service Categories */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => {
                const Icon = iconMap[category.name] || FiTool;
                return (
                  <Link
                    key={category.id}
                    href={`/services/people/${category.id}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                          <Icon className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                          <p className="text-sm text-gray-600">{category.services.length} services</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{category.description}</p>
                      
                      <div className="space-y-2">
                        {category.services.slice(0, 3).map((service) => (
                          <div key={service.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{service.name}</span>
                            <span className="text-indigo-600 font-medium">₹{service.basePrice}</span>
                          </div>
                        ))}
                        {category.services.length > 3 && (
                          <p className="text-sm text-indigo-600 font-medium">
                            +{category.services.length - 3} more services
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 px-6 py-3 border-t">
                      <span className="text-indigo-600 font-medium text-sm group-hover:text-indigo-700">
                        View all services →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* How It Works */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-600">1</span>
                </div>
                <h3 className="font-medium mb-2">Select Service</h3>
                <p className="text-sm text-gray-600">Choose the service you need from our categories</p>
              </div>
              
              <div className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-600">2</span>
                </div>
                <h3 className="font-medium mb-2">Book Slot</h3>
                <p className="text-sm text-gray-600">Select your preferred date and time</p>
              </div>
              
              <div className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-600">3</span>
                </div>
                <h3 className="font-medium mb-2">Professional Arrives</h3>
                <p className="text-sm text-gray-600">Our verified professional visits your location</p>
              </div>
              
              <div className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-600">4</span>
                </div>
                <h3 className="font-medium mb-2">Service Complete</h3>
                <p className="text-sm text-gray-600">Pay after service completion</p>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 bg-indigo-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <h3 className="font-semibold text-indigo-900 mb-1">Verified Professionals</h3>
                <p className="text-sm text-indigo-700">All service providers are background checked</p>
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900 mb-1">Fixed Pricing</h3>
                <p className="text-sm text-indigo-700">No hidden charges, transparent pricing</p>
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900 mb-1">Service Guarantee</h3>
                <p className="text-sm text-indigo-700">30-day service warranty on all work</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}