'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ServiceCategory, ServiceBooking, ServiceOffering } from '@/types';
import { FiPlus, FiEdit2, FiTrash2, FiTool, FiUsers, FiDollarSign, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function PeopleRentAdminDashboard() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'categories' | 'bookings'>('categories');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
  });
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    basePrice: '',
    duration: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // For demo, using static data for categories
      const demoCategories: ServiceCategory[] = [
        {
          id: '0',
          name: 'Plumbing',
          description: 'Tap repair, pipe fixing, bathroom fittings',
          icon: 'FiDroplet',
          services: [
            { id: '1', categoryId: '0', name: 'Tap Repair', description: 'Fix leaking or broken taps', basePrice: 200, duration: 30 },
            { id: '2', categoryId: '0', name: 'Pipe Fixing', description: 'Repair or replace damaged pipes', basePrice: 500, duration: 60 },
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
            { id: '3', categoryId: '1', name: 'Switch Repair', description: 'Fix or replace switches', basePrice: 150, duration: 20 },
            { id: '4', categoryId: '1', name: 'Wiring Work', description: 'New wiring or repairs', basePrice: 800, duration: 120 },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      setCategories(demoCategories);

      // Fetch bookings
      const bookingsSnapshot = await getDocs(collection(db, 'serviceBookings'));
      const bookingsData: ServiceBooking[] = [];
      bookingsSnapshot.forEach((doc) => {
        bookingsData.push({ ...doc.data(), id: doc.id } as ServiceBooking);
      });
      setBookings(bookingsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCategory: ServiceCategory = {
        id: Date.now().toString(),
        name: categoryForm.name,
        description: categoryForm.description,
        icon: categoryForm.icon || 'FiTool',
        services: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setCategories([...categories, newCategory]);
      toast.success('Category added successfully');
      setShowAddCategory(false);
      setCategoryForm({ name: '', description: '', icon: '' });
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    try {
      const newService: ServiceOffering = {
        id: Date.now().toString(),
        categoryId: selectedCategory.id,
        name: serviceForm.name,
        description: serviceForm.description,
        basePrice: parseFloat(serviceForm.basePrice),
        duration: parseInt(serviceForm.duration),
      };

      const updatedCategories = categories.map(cat => {
        if (cat.id === selectedCategory.id) {
          return {
            ...cat,
            services: [...cat.services, newService],
          };
        }
        return cat;
      });

      setCategories(updatedCategories);
      toast.success('Service added successfully');
      setShowAddService(false);
      setServiceForm({ name: '', description: '', basePrice: '', duration: '' });
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    }
  };

  const handleDeleteService = (categoryId: string, serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      const updatedCategories = categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            services: cat.services.filter(s => s.id !== serviceId),
          };
        }
        return cat;
      });
      setCategories(updatedCategories);
      toast.success('Service deleted successfully');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: ServiceBooking['status']) => {
    try {
      await updateDoc(doc(db, 'serviceBookings', bookingId), {
        status,
        updatedAt: serverTimestamp(),
      });
      toast.success('Booking status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking status');
    }
  };

  const stats = {
    totalCategories: categories.length,
    totalServices: categories.reduce((sum, cat) => sum + cat.services.length, 0),
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    todayRevenue: bookings
      .filter(b => {
        const today = new Date();
        const bookingDate = new Date(b.createdAt);
        return bookingDate.toDateString() === today.toDateString() && b.status === 'completed';
      })
      .reduce((sum, b) => sum + b.totalAmount, 0),
  };

  return (
    <ProtectedRoute requireAdmin adminType="peoplerent">
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">People on Rent Admin</h1>
            <p className="text-gray-600 mt-2">Manage service categories and bookings</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3">
                  <FiTool className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-2xl font-semibold">{stats.totalCategories}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3">
                  <FiTool className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Services</p>
                  <p className="text-2xl font-semibold">{stats.totalServices}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3">
                  <FiUsers className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Bookings</p>
                  <p className="text-2xl font-semibold">{stats.totalBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 rounded-full p-3">
                  <FiClock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-semibold">{stats.pendingBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-indigo-100 rounded-full p-3">
                  <FiDollarSign className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-semibold">₹{stats.todayRevenue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setSelectedTab('categories')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'categories'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Categories & Services
                </button>
                <button
                  onClick={() => setSelectedTab('bookings')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'bookings'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Bookings
                </button>
              </nav>
            </div>

            <div className="p-6">
              {selectedTab === 'categories' && (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => setShowAddCategory(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                    >
                      <FiPlus className="mr-2" />
                      Add Category
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {categories.map((category) => (
                        <div key={category.id} className="bg-gray-50 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-semibold">{category.name}</h3>
                              <p className="text-gray-600">{category.description}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedCategory(category);
                                setShowAddService(true);
                              }}
                              className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm"
                            >
                              Add Service
                            </button>
                          </div>

                          {category.services.length > 0 ? (
                            <div className="space-y-3">
                              {category.services.map((service) => (
                                <div key={service.id} className="bg-white rounded-lg p-4 flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium">{service.name}</h4>
                                    <p className="text-sm text-gray-600">{service.description}</p>
                                    <div className="mt-1 text-sm">
                                      <span className="text-indigo-600 font-medium">₹{service.basePrice}</span>
                                      <span className="text-gray-500"> • {service.duration} mins</span>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button className="text-gray-600 hover:text-gray-900">
                                      <FiEdit2 className="h-5 w-5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteService(category.id, service.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <FiTrash2 className="h-5 w-5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">
                              No services added yet
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {selectedTab === 'bookings' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Booking ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking: any) => (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{booking.id.slice(-6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.serviceName || 'Service'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(booking.scheduledDate).toLocaleDateString()} {booking.scheduledTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.customerId.slice(-6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{booking.totalAmount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                              booking.status === 'ongoing' ? 'bg-purple-100 text-purple-800' :
                              booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <select
                              value={booking.status}
                              onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value as ServiceBooking['status'])}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="assigned">Assigned</option>
                              <option value="ongoing">Ongoing</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Add Category Modal */}
          {showAddCategory && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
                
                <form onSubmit={handleAddCategory}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        required
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        required
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Add Category
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(false);
                        setCategoryForm({ name: '', description: '', icon: '' });
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

          {/* Add Service Modal */}
          {showAddService && selectedCategory && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">
                  Add Service to {selectedCategory.name}
                </h2>
                
                <form onSubmit={handleAddService}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service Name</label>
                      <input
                        type="text"
                        required
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        required
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Base Price (₹)</label>
                        <input
                          type="number"
                          required
                          value={serviceForm.basePrice}
                          onChange={(e) => setServiceForm({...serviceForm, basePrice: e.target.value})}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Duration (mins)</label>
                        <input
                          type="number"
                          required
                          value={serviceForm.duration}
                          onChange={(e) => setServiceForm({...serviceForm, duration: e.target.value})}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Add Service
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddService(false);
                        setSelectedCategory(null);
                        setServiceForm({ name: '', description: '', basePrice: '', duration: '' });
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