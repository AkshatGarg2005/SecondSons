'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FoodOrder, Restaurant, Dish } from '@/types';
import { FiMapPin, FiClock, FiPhone, FiCheckCircle } from 'react-icons/fi';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function FoodOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<FoodOrder | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Record<string, Dish>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    // Subscribe to real-time updates for the order
    const unsubscribe = onSnapshot(
      doc(db, 'foodOrders', orderId),
      // This callback should NOT be async
      (orderSnapshot) => {
        if (orderSnapshot.exists()) {
          const orderData = { ...orderSnapshot.data(), id: orderSnapshot.id } as FoodOrder;
          setOrder(orderData);

          // Define an async function inside the listener to fetch related data
          const fetchRelatedData = async () => {
            try {
              // Create promises for the restaurant and all dishes
              const restaurantPromise = getDoc(doc(db, 'restaurants', orderData.restaurantId));
              const dishPromises = orderData.items.map(item => getDoc(doc(db, 'dishes', item.dishId)));

              // Fetch all data concurrently
              const [restaurantDoc, ...dishDocs] = await Promise.all([
                restaurantPromise,
                ...dishPromises,
              ]);

              // Process restaurant data
              if (restaurantDoc.exists()) {
                setRestaurant({ ...restaurantDoc.data(), id: restaurantDoc.id } as Restaurant);
              }

              // Process dishes data
              const dishesMap: Record<string, Dish> = {};
              dishDocs.forEach((dishDoc, index) => {
                if (dishDoc.exists()) {
                  const dishId = orderData.items[index].dishId;
                  dishesMap[dishId] = { ...dishDoc.data(), id: dishDoc.id } as Dish;
                }
              });
              setDishes(dishesMap);

            } catch (err) {
              console.error('Error fetching related order data:', err);
              toast.error('Failed to load restaurant or dish details.');
            } finally {
              setLoading(false);
            }
          };
          
          fetchRelatedData();

        } else {
          toast.error('Order not found');
          router.push('/customer/orders');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId, router]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-indigo-100 text-indigo-800',
      delivering: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusSteps = () => [
    { key: 'accepted', label: 'Order Confirmed' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready' },
    { key: 'delivering', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getCurrentStep = () => {
    const steps = getStatusSteps();
    const index = steps.findIndex(step => step.key === order?.status);
    return index >= 0 ? index : -1;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order || !restaurant) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-gray-600 mt-1">Order ID: #{order.id.slice(-6)}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            
            {/* Status Timeline */}
            {order.status !== 'pending' && order.status !== 'cancelled' && (
              <div className="mt-6">
                <div className="flex justify-between items-center">
                  {getStatusSteps().map((step, index) => {
                    const isActive = index <= getCurrentStep();
                    const isCompleted = index < getCurrentStep();
                    
                    return (
                      <div key={step.key} className="flex-1 relative">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-500' : isActive ? 'bg-indigo-600' : 'bg-gray-300'
                          }`}>
                            {isCompleted ? (
                              <FiCheckCircle className="w-5 h-5 text-white" />
                            ) : (
                              <span className="text-white font-semibold">{index + 1}</span>
                            )}
                          </div>
                          <p className={`text-xs mt-2 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            {step.label}
                          </p>
                        </div>
                        {index < getStatusSteps().length - 1 && (
                          <div className={`absolute top-5 left-1/2 w-full h-0.5 ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Restaurant Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Restaurant Details</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg">{restaurant.name}</h3>
                <p className="text-gray-600">{restaurant.cuisine.join(', ')}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {restaurant.address.street}, {restaurant.address.city}
                </p>
              </div>
              
              {(order.status === 'accepted' || order.status === 'preparing' || order.status === 'ready') && restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
                  <FiPhone className="mr-2" />
                  Call Restaurant
                </a>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            
            <div className="space-y-3">
              {order.items.map((item, index) => {
                const dish = dishes[item.dishId];
                return (
                  <div key={index} className="flex justify-between items-center py-2">
                    <div className="flex items-center">
                      {dish && (
                        <span className={`w-3 h-3 mr-3 border rounded-sm flex items-center justify-center ${
                          dish.isVeg ? 'border-green-600' : 'border-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            dish.isVeg ? 'bg-green-600' : 'bg-red-600'
                          }`}></span>
                        </span>
                      )}
                      <div>
                        <p className="font-medium">{dish?.name || 'Loading...'}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                );
              })}
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-xl font-bold text-indigo-600">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Delivery Details</h2>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <FiMapPin className="h-5 w-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Delivery Address</p>
                  <p className="font-medium">{order.deliveryAddress.address}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FiClock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Order Placed</p>
                  <p className="font-medium">{formatDate(order.createdAt)} at {formatTime(order.createdAt)}</p>
                </div>
              </div>
              
              {order.status === 'delivering' && order.deliveryPersonId && (
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-indigo-900 font-medium">
                    Your order is out for delivery!
                  </p>
                  <button className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                    Track Delivery Partner →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/customer/orders')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 font-medium"
            >
              Back to Orders
            </button>
            
            {order.status === 'delivered' && (
              <button
                onClick={() => router.push(`/services/food/${restaurant.id}`)}
                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 font-medium"
              >
                Order Again
              </button>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}