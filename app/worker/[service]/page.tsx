'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CabBooking, QuickCommerceOrder, FoodOrder, ServiceBooking, LogisticsRequest } from '@/types';
import { FiMapPin, FiPhone, FiClock, FiDollarSign, FiPackage, FiNavigation, FiCheckCircle } from 'react-icons/fi';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

type WorkerTask = CabBooking | QuickCommerceOrder | FoodOrder | ServiceBooking | LogisticsRequest;

export default function WorkerDashboard() {
  const params = useParams();
  const { userData } = useAuth();
  const service = params.service as string;
  
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'assigned' | 'completed'>('assigned');

  useEffect(() => {
    if (userData) {
      fetchTasks();
    }
  }, [userData, service]);

  const fetchTasks = async () => {
    if (!userData) return;

    try {
      let collectionName = '';
      let workerIdField = '';
      
      switch (service) {
        case 'cab':
          collectionName = 'cabBookings';
          workerIdField = 'driverId';
          break;
        case 'quickcommerce':
          collectionName = 'quickCommerceOrders';
          workerIdField = 'deliveryPersonId';
          break;
        case 'food':
          collectionName = 'foodOrders';
          workerIdField = 'deliveryPersonId';
          break;
        case 'peoplerent':
          collectionName = 'serviceBookings';
          workerIdField = 'workerId';
          break;
        case 'logistics':
          collectionName = 'logisticsRequests';
          workerIdField = 'deliveryPersonId';
          break;
        default:
          toast.error('Invalid service type');
          return;
      }

      const tasksQuery = query(
        collection(db, collectionName),
        where(workerIdField, '==', userData.id)
      );
      
      const snapshot = await getDocs(tasksQuery);
      const tasksData: WorkerTask[] = [];
      
      snapshot.forEach((doc) => {
        tasksData.push({ ...doc.data(), id: doc.id } as WorkerTask);
      });
      
      setTasks(tasksData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      let collectionName = '';
      
      switch (service) {
        case 'cab':
          collectionName = 'cabBookings';
          break;
        case 'quickcommerce':
          collectionName = 'quickCommerceOrders';
          break;
        case 'food':
          collectionName = 'foodOrders';
          break;
        case 'peoplerent':
          collectionName = 'serviceBookings';
          break;
        case 'logistics':
          collectionName = 'logisticsRequests';
          break;
      }

      await updateDoc(doc(db, collectionName, taskId), {
        status,
        updatedAt: serverTimestamp(),
      });
      
      toast.success('Status updated successfully');
      fetchTasks();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getServiceTitle = () => {
    const titles: Record<string, string> = {
      cab: 'Cab Driver Dashboard',
      quickcommerce: 'Delivery Executive Dashboard',
      food: 'Food Delivery Dashboard',
      peoplerent: 'Service Professional Dashboard',
      logistics: 'Logistics Dashboard',
    };
    return titles[service] || 'Worker Dashboard';
  };

  const getTaskTitle = (task: any) => {
    switch (service) {
      case 'cab':
        return `Ride #${task.id.slice(-6)}`;
      case 'quickcommerce':
      case 'food':
        return `Order #${task.id.slice(-6)}`;
      case 'peoplerent':
        return task.serviceName || `Service #${task.id.slice(-6)}`;
      case 'logistics':
        return `Package #${task.id.slice(-6)}`;
      default:
        return `Task #${task.id.slice(-6)}`;
    }
  };

  const getTaskDetails = (task: any) => {
    switch (service) {
      case 'cab':
        return {
          pickup: task.pickupLocation.address,
          drop: task.dropLocation.address,
          amount: task.fare,
          distance: task.distance,
        };
      case 'quickcommerce':
      case 'food':
        return {
          items: task.items.length,
          amount: task.totalAmount,
          address: task.deliveryAddress.address,
        };
      case 'peoplerent':
        return {
          service: task.serviceName,
          date: formatDate(task.scheduledDate),
          time: task.scheduledTime,
          address: task.address.address,
          amount: task.totalAmount,
        };
      case 'logistics':
        return {
          type: task.type,
          pickup: task.pickupLocation.address,
          drop: task.dropLocation.address,
          packageType: task.packageType,
        };
      default:
        return {};
    }
  };

  const getStatusOptions = () => {
    switch (service) {
      case 'cab':
        return ['accepted', 'ongoing', 'completed'];
      case 'quickcommerce':
      case 'food':
        return ['accepted', 'delivering', 'delivered'];
      case 'peoplerent':
        return ['assigned', 'ongoing', 'completed'];
      case 'logistics':
        return ['assigned', 'pickedup', 'delivering', 'delivered'];
      default:
        return [];
    }
  };

  const activeTasks = tasks.filter(task => {
    const completedStatuses = ['completed', 'delivered'];
    return !completedStatuses.includes(task.status);
  });

  const completedTasks = tasks.filter(task => {
    const completedStatuses = ['completed', 'delivered'];
    return completedStatuses.includes(task.status);
  });

  const todayEarnings = completedTasks
    .filter(task => {
      const today = new Date();
      const taskDate = new Date(task.createdAt);
      return taskDate.toDateString() === today.toDateString();
    })
    .reduce((sum, task: any) => {
      if (service === 'cab') return sum + (task.fare || 0);
      if (service === 'quickcommerce' || service === 'food') return sum + (task.totalAmount || 0) * 0.1; // 10% commission
      if (service === 'peoplerent') return sum + (task.totalAmount || 0) * 0.8; // 80% to worker
      if (service === 'logistics') return sum + 50; // Fixed per delivery
      return sum;
    }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['worker']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{getServiceTitle()}</h1>
            <p className="text-gray-600 mt-2">Manage your assigned tasks and earnings</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3">
                  <FiPackage className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Tasks</p>
                  <p className="text-2xl font-semibold">{activeTasks.length}</p>
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
                  <p className="text-2xl font-semibold">
                    {completedTasks.filter(task => {
                      const today = new Date();
                      const taskDate = new Date(task.createdAt);
                      return taskDate.toDateString() === today.toDateString();
                    }).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3">
                  <FiClock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Completed</p>
                  <p className="text-2xl font-semibold">{completedTasks.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-indigo-100 rounded-full p-3">
                  <FiDollarSign className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Today's Earnings</p>
                  <p className="text-2xl font-semibold">{formatCurrency(todayEarnings)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setSelectedTab('assigned')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'assigned'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Assigned Tasks ({activeTasks.length})
                </button>
                <button
                  onClick={() => setSelectedTab('completed')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'completed'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Completed ({completedTasks.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {selectedTab === 'assigned' && (
                <div className="space-y-4">
                  {activeTasks.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No active tasks at the moment
                    </p>
                  ) : (
                    activeTasks.map((task) => {
                      const details = getTaskDetails(task);
                      return (
                        <div key={task.id} className="bg-gray-50 rounded-lg p-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold">{getTaskTitle(task)}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              task.status === 'accepted' || task.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'ongoing' || task.status === 'pickedup' ? 'bg-purple-100 text-purple-800' :
                              'bg-indigo-100 text-indigo-800'
                            }`}>
                              {task.status}
                            </span>
                          </div>

                          {/* Task-specific details */}
                          {service === 'cab' && (
                            <>
                              <div className="space-y-2">
                                <div className="flex items-start">
                                  <FiMapPin className="mr-2 mt-1 text-green-600 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm text-gray-600">Pickup</p>
                                    <p className="font-medium">{details.pickup}</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <FiNavigation className="mr-2 mt-1 text-red-600 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm text-gray-600">Drop</p>
                                    <p className="font-medium">{details.drop}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Distance: {details.distance} km</span>
                                <span className="font-semibold">Fare: {formatCurrency(details.amount)}</span>
                              </div>
                            </>
                          )}

                          {(service === 'quickcommerce' || service === 'food') && (
                            <>
                              <div className="space-y-2">
                                <div className="flex items-start">
                                  <FiPackage className="mr-2 mt-1 text-indigo-600 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm text-gray-600">Items</p>
                                    <p className="font-medium">{details.items} items</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <FiMapPin className="mr-2 mt-1 text-green-600 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm text-gray-600">Delivery Address</p>
                                    <p className="font-medium">{details.address}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Order Value: {formatCurrency(details.amount)}</span>
                                <span className="font-semibold">Commission: {formatCurrency(details.amount * 0.1)}</span>
                              </div>
                            </>
                          )}

                          {service === 'peoplerent' && (
                            <>
                              <div className="space-y-2">
                                <p className="font-medium">{details.service}</p>
                                <div className="flex items-center text-sm text-gray-600">
                                  <FiClock className="mr-2" />
                                  <span>{details.date} at {details.time}</span>
                                </div>
                                <div className="flex items-start">
                                  <FiMapPin className="mr-2 mt-1 text-green-600 flex-shrink-0" />
                                  <p className="text-sm">{details.address}</p>
                                </div>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Service Charge: {formatCurrency(details.amount)}</span>
                                <span className="font-semibold">Your Earnings: {formatCurrency(details.amount * 0.8)}</span>
                              </div>
                            </>
                          )}

                          {service === 'logistics' && (
                            <>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <FiPackage className="mr-2 text-indigo-600" />
                                  <span className="font-medium capitalize">{details.type} - {details.packageType}</span>
                                </div>
                                <div className="flex items-start">
                                  <FiMapPin className="mr-2 mt-1 text-green-600 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm text-gray-600">Pickup</p>
                                    <p className="font-medium">{details.pickup}</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <FiNavigation className="mr-2 mt-1 text-red-600 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm text-gray-600">Drop</p>
                                    <p className="font-medium">{details.drop}</p>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Status Update */}
                          <div className="flex items-center space-x-3 pt-3 border-t">
                            <label className="text-sm font-medium text-gray-700">Update Status:</label>
                            <select
                              value={task.status}
                              onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value={task.status}>{task.status}</option>
                              {getStatusOptions().filter(s => s !== task.status).map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {selectedTab === 'completed' && (
                <div className="space-y-4">
                  {completedTasks.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No completed tasks yet
                    </p>
                  ) : (
                    completedTasks.map((task) => {
                      const details = getTaskDetails(task);
                      return (
                        <div key={task.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{getTaskTitle(task)}</h4>
                            <span className="text-sm text-gray-500">
                              {formatDate(task.createdAt)} {formatTime(task.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {service === 'cab' && (
                              <p>Fare: {formatCurrency(details.amount)} • Distance: {details.distance} km</p>
                            )}
                            {(service === 'quickcommerce' || service === 'food') && (
                              <p>Order: {formatCurrency(details.amount)} • Commission: {formatCurrency(details.amount * 0.1)}</p>
                            )}
                            {service === 'peoplerent' && (
                              <p>Service: {details.service} • Earned: {formatCurrency(details.amount * 0.8)}</p>
                            )}
                            {service === 'logistics' && (
                              <p>Type: {details.type} • Earned: {formatCurrency(50)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}