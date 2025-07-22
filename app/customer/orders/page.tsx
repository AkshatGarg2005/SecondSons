'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FiPackage, FiMapPin, FiClock, FiTruck, FiHome, FiShoppingCart, FiUsers } from 'react-icons/fi';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  type: 'cab' | 'food' | 'commerce' | 'service' | 'logistics' | 'rental';
  status: string;
  amount?: number;
  createdAt: Date;
  details: any;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    if (userData) {
      fetchOrders();
    }
  }, [userData]);

  const fetchOrders = async () => {
    if (!userData) return;

    try {
      const allOrders: Order[] = [];

      // Fetch cab bookings
      const cabQuery = query(
        collection(db, 'cabBookings'),
        where('customerId', '==', userData.id)
      );
      const cabSnapshot = await getDocs(cabQuery);
      cabSnapshot.forEach((doc) => {
        const data = doc.data();
        allOrders.push({
          id: doc.id,
          type: 'cab',
          status: data.status,
          amount: data.fare,
          createdAt: data.createdAt.toDate(),
          details: data,
        });
      });

      // Fetch food orders
      const foodQuery = query(
        collection(db, 'foodOrders'),
        where('customerId', '==', userData.id)
      );
      const foodSnapshot = await getDocs(foodQuery);
      foodSnapshot.forEach((doc) => {
        const data = doc.data();
        allOrders.push({
          id: doc.id,
          type: 'food',
          status: data.status,
          amount: data.totalAmount,
          createdAt: data.createdAt.toDate(),
          details: data,
        });
      });

      // Fetch commerce orders
      const commerceQuery = query(
        collection(db, 'quickCommerceOrders'),
        where('customerId', '==', userData.id)
      );
      const commerceSnapshot = await getDocs(commerceQuery);
      commerceSnapshot.forEach((doc) => {
        const data = doc.data();
        allOrders.push({
          id: doc.id,
          type: 'commerce',
          status: data.status,
          amount: data.totalAmount,
          createdAt: data.createdAt.toDate(),
          details: data,
        });
      });

      // Fetch service bookings
      const serviceQuery = query(
        collection(db, 'serviceBookings'),
        where('customerId', '==', userData.id)
      );
      const serviceSnapshot = await getDocs(serviceQuery);
      serviceSnapshot.forEach((doc) => {
        const data = doc.data();
        allOrders.push({
          id: doc.id,
          type: 'service',
          status: data.status,
          amount: data.totalAmount,
          createdAt: data.createdAt.toDate(),
          details: data,
        });
      });

      // Fetch logistics requests
      const logisticsQuery = query(
        collection(db, 'logisticsRequests'),
        where('customerId', '==', userData.id)
      );
      const logisticsSnapshot = await getDocs(logisticsQuery);
      logisticsSnapshot.forEach((doc) => {
        const data = doc.data();
        allOrders.push({
          id: doc.id,
          type: 'logistics',
          status: data.status,
          amount: data.estimatedPrice,
          createdAt: data.createdAt.toDate(),
          details: data,
        });
      });

      // Fetch rental inquiries
      const rentalQuery = query(
        collection(db, 'rentalBookings'),
        where('tenantId', '==', userData.id)
      );
      const rentalSnapshot = await getDocs(rentalQuery);
      rentalSnapshot.forEach((doc) => {
        const data = doc.data();
        allOrders.push({
          id: doc.id,
          type: 'rental',
          status: data.status,
          amount: data.monthlyRent,
          createdAt: data.createdAt.toDate(),
          details: data,
        });
      });

      // Sort orders by date
      allOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getOrderIcon = (type: string) => {
    switch (type) {
      case 'cab':
        return <FiMapPin className="h-5 w-5" />;
      case 'food':
        return <FiTruck className="h-5 w-5" />;
      case 'commerce':
        return <FiShoppingCart className="h-5 w-5" />;
      case 'service':
        return <FiUsers className="h-5 w-5" />;
      case 'logistics':
        return <FiPackage className="h-5 w-5" />;
      case 'rental':
        return <FiHome className="h-5 w-5" />;
      default:
        return <FiPackage className="h-5 w-5" />;
    }
  };

  const getOrderTitle = (order: Order) => {
    switch (order.type) {
      case 'cab':
        return 'Cab Ride';
      case 'food':
        return 'Food Order';
      case 'commerce':
        return 'Grocery Order';
      case 'service':
        return order.details.serviceName || 'Service Booking';
      case 'logistics':
        return 'Package Delivery';
      case 'rental':
        return 'Property Inquiry';
      default:
        return 'Order';
    }
  };

  const getOrderDescription = (order: Order) => {
    switch (order.type) {
      case 'cab':
        return `From ${order.details.pickupLocation.address} to ${order.details.dropLocation.address}`;
      case 'food':
      case 'commerce':
        return `${order.details.items.length} items • ${order.details.deliveryAddress.address}`;
      case 'service':
        return `${formatDate(order.details.scheduledDate)} at ${order.details.scheduledTime}`;
      case 'logistics':
        return `${order.details.pickupLocation.address} to ${order.details.dropLocation.address}`;
      case 'rental':
        return `Property #${order.details.propertyId.slice(-6)}`;
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      assigned: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-purple-100 text-purple-800',
      preparing: 'bg-purple-100 text-purple-800',
      pickedup: 'bg-indigo-100 text-indigo-800',
      delivering: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      inquiry: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = selectedType === 'all' 
    ? orders 
    : orders.filter(order => order.type === selectedType);

  const orderTypes = ['all', 'cab', 'food', 'commerce', 'service', 'logistics', 'rental'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-2">Track all your bookings and orders in one place</p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {orderTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? 'All Orders' : type.charAt(0).toUpperCase() + type.slice(1)}
                  {type === 'all' && ` (${orders.length})`}
                  {type !== 'all' && ` (${orders.filter(o => o.type === type).length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FiPackage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h2>
              <p className="text-gray-600">
                {selectedType === 'all' 
                  ? "You haven't placed any orders yet"
                  : `No ${selectedType} orders found`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        order.type === 'cab' ? 'bg-blue-100 text-blue-600' :
                        order.type === 'food' ? 'bg-red-100 text-red-600' :
                        order.type === 'commerce' ? 'bg-green-100 text-green-600' :
                        order.type === 'service' ? 'bg-yellow-100 text-yellow-600' :
                        order.type === 'logistics' ? 'bg-purple-100 text-purple-600' :
                        'bg-indigo-100 text-indigo-600'
                      }`}>
                        {getOrderIcon(order.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getOrderTitle(order)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {getOrderDescription(order)}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <FiClock className="mr-1" />
                            {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                          </div>
                          {order.amount && (
                            <div className="flex items-center">
                              <span className="font-medium">{formatCurrency(order.amount)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <button
                        onClick={() => {
                          // Navigate to specific order detail page based on type
                          switch (order.type) {
                            case 'cab':
                              router.push(`/customer/bookings/cab/${order.id}`);
                              break;
                            case 'food':
                              router.push(`/customer/orders/food/${order.id}`);
                              break;
                            case 'commerce':
                              router.push(`/customer/orders/commerce/${order.id}`);
                              break;
                            case 'service':
                              router.push(`/customer/bookings/service/${order.id}`);
                              break;
                            case 'logistics':
                              router.push(`/customer/deliveries/${order.id}`);
                              break;
                            case 'rental':
                              router.push(`/customer/inquiries/${order.id}`);
                              break;
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}