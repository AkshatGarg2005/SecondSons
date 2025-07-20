'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { collection, getDocs, updateDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CabBooking, User } from '@/types';
import { FiMapPin, FiUser, FiDollarSign, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CabAdminDashboard() {
  const [bookings, setBookings] = useState<CabBooking[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'bookings' | 'drivers' | 'analytics'>('bookings');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch bookings
      const bookingsSnapshot = await getDocs(collection(db, 'cabBookings'));
      const bookingsData: CabBooking[] = [];
      bookingsSnapshot.forEach((doc) => {
        bookingsData.push({ ...doc.data(), id: doc.id } as CabBooking);
      });
      setBookings(bookingsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

      // Fetch drivers
      const driversQuery = query(
        collection(db, 'users'),
        where('role', '==', 'worker'),
        where('workerService', '==', 'cab')
      );
      const driversSnapshot = await getDocs(driversQuery);
      const driversData: User[] = [];
      driversSnapshot.forEach((doc) => {
        driversData.push({ ...doc.data(), id: doc.id } as User);
      });
      setDrivers(driversData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: CabBooking['status']) => {
    try {
      await updateDoc(doc(db, 'cabBookings', bookingId), {
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

  const handleAssignDriver = async (bookingId: string, driverId: string) => {
    try {
      await updateDoc(doc(db, 'cabBookings', bookingId), {
        driverId,
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
      toast.success('Driver assigned successfully');
      fetchData();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  const stats = {
    totalBookings: bookings.length,
    activeRides: bookings.filter(b => b.status === 'ongoing').length,
    completedToday: bookings.filter(b => {
      const today = new Date();
      const bookingDate = new Date(b.createdAt);
      return bookingDate.toDateString() === today.toDateString() && b.status === 'completed';
    }).length,
    todayRevenue: bookings
      .filter(b => {
        const today = new Date();
        const bookingDate = new Date(b.createdAt);
        return bookingDate.toDateString() === today.toDateString() && b.status === 'completed';
      })
      .reduce((sum, b) => sum + (b.fare || 0), 0),
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter(d => d.isActive).length,
  };

  const bookingStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <ProtectedRoute requireAdmin adminType="cab">
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Cab Service Admin</h1>
            <p className="text-gray-600 mt-2">Manage cab bookings and drivers</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3">
                  <FiMapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-semibold">{stats.totalBookings}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3">
                  <FiClock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Rides</p>
                  <p className="text-2xl font-semibold">{stats.activeRides}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3">
                  <FiCheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Completed Today</p>
                  <p className="text-2xl font-semibold">{stats.completedToday}</p>
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
                  <p className="text-2xl font-semibold">{formatCurrency(stats.todayRevenue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setSelectedTab('bookings')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'bookings'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Bookings ({stats.totalBookings})
                </button>
                <button
                  onClick={() => setSelectedTab('drivers')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'drivers'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Drivers ({stats.totalDrivers})
                </button>
                <button
                  onClick={() => setSelectedTab('analytics')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'analytics'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Analytics
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Bookings Tab */}
              {selectedTab === 'bookings' && (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="text-sm text-gray-600">
                      Showing {filteredBookings.length} bookings
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Booking ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Pickup
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Drop
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fare
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Driver
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredBookings.map((booking) => (
                            <tr key={booking.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{booking.id.slice(-6)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(booking.createdAt)}<br />
                                {formatTime(booking.createdAt)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <div className="max-w-xs truncate">
                                  {booking.pickupLocation.address}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <div className="max-w-xs truncate">
                                  {booking.dropLocation.address}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {booking.fare ? formatCurrency(booking.fare) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  bookingStatusColors[booking.status]
                                }`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {booking.driverId ? (
                                  <span>#{booking.driverId.slice(-6)}</span>
                                ) : booking.status === 'pending' ? (
                                  <select
                                    className="text-sm border rounded px-2 py-1"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleAssignDriver(booking.id, e.target.value);
                                      }
                                    }}
                                  >
                                    <option value="">Assign Driver</option>
                                    {drivers.filter(d => d.isActive).map(driver => (
                                      <option key={driver.id} value={driver.id}>
                                        {driver.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <select
                                  value={booking.status}
                                  onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value as CabBooking['status'])}
                                  className="text-sm border rounded px-2 py-1"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="accepted">Accepted</option>
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
                </>
              )}

              {/* Drivers Tab */}
              {selectedTab === 'drivers' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Drivers</p>
                          <p className="text-2xl font-semibold">{stats.totalDrivers}</p>
                        </div>
                        <FiUser className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Active Drivers</p>
                          <p className="text-2xl font-semibold text-green-600">{stats.activeDrivers}</p>
                        </div>
                        <FiCheckCircle className="h-8 w-8 text-green-400" />
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Inactive Drivers</p>
                          <p className="text-2xl font-semibold text-red-600">
                            {stats.totalDrivers - stats.activeDrivers}
                          </p>
                        </div>
                        <FiXCircle className="h-8 w-8 text-red-400" />
                      </div>
                    </div>
                  </div>

                  {drivers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No drivers registered yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {drivers.map((driver) => (
                        <div key={driver.id} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">{driver.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              driver.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {driver.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{driver.email}</p>
                          <p className="text-sm text-gray-600">Phone: {driver.phone}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Joined: {formatDate(driver.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {selectedTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Booking Status Distribution</h3>
                      <div className="space-y-3">
                        {Object.entries(
                          bookings.reduce((acc, booking) => {
                            acc[booking.status] = (acc[booking.status] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between">
                            <span className="capitalize">{status}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Today</span>
                          <span className="font-medium">{formatCurrency(stats.todayRevenue)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>This Week</span>
                          <span className="font-medium">
                            {formatCurrency(
                              bookings
                                .filter(b => {
                                  const bookingDate = new Date(b.createdAt);
                                  const weekAgo = new Date();
                                  weekAgo.setDate(weekAgo.getDate() - 7);
                                  return bookingDate >= weekAgo && b.status === 'completed';
                                })
                                .reduce((sum, b) => sum + (b.fare || 0), 0)
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>This Month</span>
                          <span className="font-medium">
                            {formatCurrency(
                              bookings
                                .filter(b => {
                                  const bookingDate = new Date(b.createdAt);
                                  const monthStart = new Date();
                                  monthStart.setDate(1);
                                  return bookingDate >= monthStart && b.status === 'completed';
                                })
                                .reduce((sum, b) => sum + (b.fare || 0), 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Average Ride Distance</p>
                        <p className="text-2xl font-semibold">
                          {(bookings.reduce((sum, b) => sum + (b.distance || 0), 0) / bookings.length || 0).toFixed(1)} km
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Average Fare</p>
                        <p className="text-2xl font-semibold">
                          {formatCurrency(
                            bookings.reduce((sum, b) => sum + (b.fare || 0), 0) / bookings.length || 0
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-semibold">
                          {((bookings.filter(b => b.status === 'completed').length / bookings.length) * 100 || 0).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}