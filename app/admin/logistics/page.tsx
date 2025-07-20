'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { collection, getDocs, updateDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { LogisticsRequest, User } from '@/types';
import { FiPackage, FiTruck, FiClock, FiDollarSign, FiMapPin, FiUser } from 'react-icons/fi';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LogisticsAdminDashboard() {
  const [requests, setRequests] = useState<LogisticsRequest[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'requests' | 'delivery-persons' | 'analytics'>('requests');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch logistics requests
      const requestsSnapshot = await getDocs(collection(db, 'logisticsRequests'));
      const requestsData: LogisticsRequest[] = [];
      requestsSnapshot.forEach((doc) => {
        requestsData.push({ ...doc.data(), id: doc.id } as LogisticsRequest);
      });
      setRequests(requestsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

      // Fetch delivery persons
      const deliveryQuery = query(
        collection(db, 'users'),
        where('role', '==', 'worker'),
        where('workerService', '==', 'logistics')
      );
      const deliverySnapshot = await getDocs(deliveryQuery);
      const deliveryData: User[] = [];
      deliverySnapshot.forEach((doc) => {
        deliveryData.push({ ...doc.data(), id: doc.id } as User);
      });
      setDeliveryPersons(deliveryData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: LogisticsRequest['status']) => {
    try {
      await updateDoc(doc(db, 'logisticsRequests', requestId), {
        status,
        updatedAt: serverTimestamp(),
      });
      toast.success('Request status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request status');
    }
  };

  const handleAssignDeliveryPerson = async (requestId: string, deliveryPersonId: string) => {
    try {
      await updateDoc(doc(db, 'logisticsRequests', requestId), {
        deliveryPersonId,
        status: 'assigned',
        updatedAt: serverTimestamp(),
      });
      toast.success('Delivery person assigned successfully');
      fetchData();
    } catch (error) {
      console.error('Error assigning delivery person:', error);
      toast.error('Failed to assign delivery person');
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesType = filterType === 'all' || request.type === filterType;
    return matchesStatus && matchesType;
  });

  const stats = {
    totalRequests: requests.length,
    activeDeliveries: requests.filter(r => ['assigned', 'pickedup', 'delivering'].includes(r.status)).length,
    completedToday: requests.filter(r => {
      const today = new Date();
      const requestDate = new Date(r.createdAt);
      return requestDate.toDateString() === today.toDateString() && r.status === 'delivered';
    }).length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    totalDeliveryPersons: deliveryPersons.length,
    activeDeliveryPersons: deliveryPersons.filter(d => d.isActive).length,
    todayRevenue: requests
      .filter(r => {
        const today = new Date();
        const requestDate = new Date(r.createdAt);
        return requestDate.toDateString() === today.toDateString() && r.status === 'delivered';
      })
      .reduce((sum, r: any) => sum + (r.estimatedPrice || 0), 0),
  };

  const requestStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    pickedup: 'bg-purple-100 text-purple-800',
    delivering: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const requestTypeColors = {
    food: 'bg-red-50 text-red-700',
    package: 'bg-blue-50 text-blue-700',
    service: 'bg-green-50 text-green-700',
  };

  return (
    <ProtectedRoute requireAdmin adminType="logistics">
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Logistics Admin</h1>
            <p className="text-gray-600 mt-2">Manage delivery requests and personnel</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3">
                  <FiPackage className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-semibold">{stats.totalRequests}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3">
                  <FiTruck className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Deliveries</p>
                  <p className="text-2xl font-semibold">{stats.activeDeliveries}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3">
                  <FiUser className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Delivery Staff</p>
                  <p className="text-2xl font-semibold">{stats.activeDeliveryPersons}/{stats.totalDeliveryPersons}</p>
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
                  onClick={() => setSelectedTab('requests')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'requests'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Delivery Requests
                </button>
                <button
                  onClick={() => setSelectedTab('delivery-persons')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'delivery-persons'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Delivery Personnel
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
              {/* Requests Tab */}
              {selectedTab === 'requests' && (
                <>
                  <div className="mb-4 flex gap-4">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="pickedup">Picked Up</option>
                      <option value="delivering">Delivering</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">All Types</option>
                      <option value="package">Package</option>
                      <option value="food">Food</option>
                      <option value="service">Service</option>
                    </select>
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
                              Request ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
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
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Delivery Person
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredRequests.map((request: any) => (
                            <tr key={request.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{request.id.slice(-6)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  requestTypeColors[request.type]
                                }`}>
                                  {request.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(request.createdAt)}<br />
                                {formatTime(request.createdAt)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <div className="max-w-xs truncate">
                                  {request.pickupLocation.address}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <div className="max-w-xs truncate">
                                  {request.dropLocation.address}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  requestStatusColors[request.status]
                                }`}>
                                  {request.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {request.deliveryPersonId ? (
                                  <span>#{request.deliveryPersonId.slice(-6)}</span>
                                ) : request.status === 'pending' ? (
                                  <select
                                    className="text-sm border rounded px-2 py-1"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleAssignDeliveryPerson(request.id, e.target.value);
                                      }
                                    }}
                                  >
                                    <option value="">Assign</option>
                                    {deliveryPersons.filter(d => d.isActive).map(person => (
                                      <option key={person.id} value={person.id}>
                                        {person.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <select
                                  value={request.status}
                                  onChange={(e) => handleUpdateRequestStatus(request.id, e.target.value as LogisticsRequest['status'])}
                                  className="text-sm border rounded px-2 py-1"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="assigned">Assigned</option>
                                  <option value="pickedup">Picked Up</option>
                                  <option value="delivering">Delivering</option>
                                  <option value="delivered">Delivered</option>
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

              {/* Delivery Personnel Tab */}
              {selectedTab === 'delivery-persons' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Personnel</p>
                          <p className="text-2xl font-semibold">{stats.totalDeliveryPersons}</p>
                        </div>
                        <FiUser className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Active</p>
                          <p className="text-2xl font-semibold text-green-600">{stats.activeDeliveryPersons}</p>
                        </div>
                        <FiTruck className="h-8 w-8 text-green-400" />
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">On Delivery</p>
                          <p className="text-2xl font-semibold text-blue-600">
                            {requests.filter(r => r.deliveryPersonId && ['assigned', 'pickedup', 'delivering'].includes(r.status)).length}
                          </p>
                        </div>
                        <FiPackage className="h-8 w-8 text-blue-400" />
                      </div>
                    </div>
                  </div>

                  {deliveryPersons.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No delivery personnel registered yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deliveryPersons.map((person) => {
                        const activeDeliveries = requests.filter(
                          r => r.deliveryPersonId === person.id && 
                          ['assigned', 'pickedup', 'delivering'].includes(r.status)
                        ).length;

                        return (
                          <div key={person.id} className="bg-white border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-medium">{person.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                person.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {person.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{person.email}</p>
                            <p className="text-sm text-gray-600 mb-3">Phone: {person.phone}</p>
                            <div className="border-t pt-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Active Deliveries</span>
                                <span className="font-medium">{activeDeliveries}</span>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-500">Total Delivered</span>
                                <span className="font-medium">
                                  {requests.filter(r => r.deliveryPersonId === person.id && r.status === 'delivered').length}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {selectedTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Request Types</h3>
                      <div className="space-y-3">
                        {Object.entries(
                          requests.reduce((acc, req) => {
                            acc[req.type] = (acc[req.type] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="capitalize">{type}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
                      <div className="space-y-3">
                        {Object.entries(
                          requests.reduce((acc, req) => {
                            acc[req.status] = (acc[req.status] || 0) + 1;
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
                      <h3 className="text-lg font-semibold mb-4">Performance</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Delivery Rate</span>
                          <span className="font-medium">
                            {((requests.filter(r => r.status === 'delivered').length / requests.length) * 100 || 0).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Avg. Delivery Time</span>
                          <span className="font-medium">45 mins</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Today's Deliveries</span>
                          <span className="font-medium">{stats.completedToday}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Revenue Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Today's Revenue</p>
                        <p className="text-2xl font-semibold">{formatCurrency(stats.todayRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">This Week</p>
                        <p className="text-2xl font-semibold">
                          {formatCurrency(
                            requests
                              .filter((r: any) => {
                                const requestDate = new Date(r.createdAt);
                                const weekAgo = new Date();
                                weekAgo.setDate(weekAgo.getDate() - 7);
                                return requestDate >= weekAgo && r.status === 'delivered';
                              })
                              .reduce((sum, r: any) => sum + (r.estimatedPrice || 0), 0)
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">This Month</p>
                        <p className="text-2xl font-semibold">
                          {formatCurrency(
                            requests
                              .filter((r: any) => {
                                const requestDate = new Date(r.createdAt);
                                const monthStart = new Date();
                                monthStart.setDate(1);
                                return requestDate >= monthStart && r.status === 'delivered';
                              })
                              .reduce((sum, r: any) => sum + (r.estimatedPrice || 0), 0)
                          )}
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