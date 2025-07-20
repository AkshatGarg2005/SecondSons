'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { uploadToCloudinary } from '@/lib/cloudinary/config';
import { Restaurant, Dish, FoodOrder } from '@/types';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiClock, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function RestaurantDashboard() {
  const { userData } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'dishes' | 'orders' | 'settings'>('dishes');
  const [showAddDish, setShowAddDish] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isVeg: true,
  });
  const [dishImage, setDishImage] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, [userData]);

  const fetchData = async () => {
    if (!userData) return;

    try {
      // Fetch restaurant
      const restaurantQuery = query(
        collection(db, 'restaurants'),
        where('ownerId', '==', userData.id)
      );
      const restaurantSnapshot = await getDocs(restaurantQuery);
      
      if (!restaurantSnapshot.empty) {
        const restaurantData = {
          ...restaurantSnapshot.docs[0].data(),
          id: restaurantSnapshot.docs[0].id
        } as Restaurant;
        setRestaurant(restaurantData);

        // Fetch dishes
        const dishesQuery = query(
          collection(db, 'dishes'),
          where('restaurantId', '==', restaurantData.id)
        );
        const dishesSnapshot = await getDocs(dishesQuery);
        const dishesData: Dish[] = [];
        dishesSnapshot.forEach((doc) => {
          dishesData.push({ ...doc.data(), id: doc.id } as Dish);
        });
        setDishes(dishesData);

        // Fetch orders
        const ordersQuery = query(
          collection(db, 'foodOrders'),
          where('restaurantId', '==', restaurantData.id)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData: FoodOrder[] = [];
        ordersSnapshot.forEach((doc) => {
          ordersData.push({ ...doc.data(), id: doc.id } as FoodOrder);
        });
        setOrders(ordersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant || !dishImage) {
      toast.error('Please fill all fields and select an image');
      return;
    }

    try {
      const imageUrl = await uploadToCloudinary(dishImage);
      
      const dishData = {
        restaurantId: restaurant.id,
        name: dishForm.name,
        description: dishForm.description,
        price: parseFloat(dishForm.price),
        category: dishForm.category,
        isVeg: dishForm.isVeg,
        imageUrl,
        isAvailable: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (editingDish) {
        await updateDoc(doc(db, 'dishes', editingDish.id), {
          ...dishData,
          updatedAt: serverTimestamp(),
        });
        toast.success('Dish updated successfully');
      } else {
        await addDoc(collection(db, 'dishes'), dishData);
        toast.success('Dish added successfully');
      }

      setShowAddDish(false);
      setEditingDish(null);
      setDishForm({
        name: '',
        description: '',
        price: '',
        category: '',
        isVeg: true,
      });
      setDishImage(null);
      fetchData();
    } catch (error) {
      console.error('Error saving dish:', error);
      toast.error('Failed to save dish');
    }
  };

  const handleDeleteDish = async (dishId: string) => {
    if (window.confirm('Are you sure you want to delete this dish?')) {
      try {
        await deleteDoc(doc(db, 'dishes', dishId));
        toast.success('Dish deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting dish:', error);
        toast.error('Failed to delete dish');
      }
    }
  };

  const toggleDishAvailability = async (dish: Dish) => {
    try {
      await updateDoc(doc(db, 'dishes', dish.id), {
        isAvailable: !dish.isAvailable,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Dish ${!dish.isAvailable ? 'enabled' : 'disabled'}`);
      fetchData();
    } catch (error) {
      console.error('Error updating dish:', error);
      toast.error('Failed to update dish');
    }
  };

  const toggleRestaurantStatus = async () => {
    if (!restaurant) return;

    try {
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        isOpen: !restaurant.isOpen,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Restaurant ${!restaurant.isOpen ? 'opened' : 'closed'}`);
      fetchData();
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error('Failed to update restaurant status');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: FoodOrder['status']) => {
    try {
      await updateDoc(doc(db, 'foodOrders', orderId), {
        status,
        updatedAt: serverTimestamp(),
      });
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const categories = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Snacks', 'Combos'];

  const stats = {
    totalDishes: dishes.length,
    activeDishes: dishes.filter(d => d.isAvailable).length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    todayRevenue: orders
      .filter(o => {
        const today = new Date();
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === today.toDateString() && o.status !== 'cancelled';
      })
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">No restaurant found</h2>
          <a href="/restaurant/setup" className="text-indigo-600 hover:underline">
            Setup your restaurant
          </a>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['restaurant']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
                <p className="text-gray-600 mt-1">{restaurant.cuisine.join(', ')}</p>
              </div>
              <button
                onClick={toggleRestaurantStatus}
                className={`px-4 py-2 rounded-md font-medium ${
                  restaurant.isOpen
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3">
                  <FiPlus className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Dishes</p>
                  <p className="text-2xl font-semibold">{stats.totalDishes}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3">
                  <FiToggleRight className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Dishes</p>
                  <p className="text-2xl font-semibold">{stats.activeDishes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3">
                  <FiClock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-semibold">{stats.totalOrders}</p>
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
                  <p className="text-2xl font-semibold">{stats.pendingOrders}</p>
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
                  onClick={() => setSelectedTab('dishes')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'dishes'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dishes
                </button>
                <button
                  onClick={() => setSelectedTab('orders')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'orders'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setSelectedTab('settings')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'settings'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Dishes Tab */}
              {selectedTab === 'dishes' && (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => setShowAddDish(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                    >
                      <FiPlus className="mr-2" />
                      Add Dish
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dishes.map((dish) => (
                      <div key={dish.id} className="bg-white border rounded-lg overflow-hidden">
                        <div className="relative">
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                            dish.isVeg 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {dish.isVeg ? 'Veg' : 'Non-Veg'}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg">{dish.name}</h3>
                          <p className="text-gray-600 text-sm">{dish.category}</p>
                          <p className="text-gray-500 text-sm mt-1">{dish.description}</p>
                          <div className="mt-3 flex justify-between items-center">
                            <span className="text-lg font-bold text-indigo-600">₹{dish.price}</span>
                            <button
                              onClick={() => toggleDishAvailability(dish)}
                              className={`px-3 py-1 rounded text-sm ${
                                dish.isAvailable 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {dish.isAvailable ? 'Available' : 'Unavailable'}
                            </button>
                          </div>
                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingDish(dish);
                                setDishForm({
                                  name: dish.name,
                                  description: dish.description,
                                  price: dish.price.toString(),
                                  category: dish.category,
                                  isVeg: dish.isVeg,
                                });
                                setShowAddDish(true);
                              }}
                              className="flex-1 bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                            >
                              <FiEdit2 className="inline mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDish(dish.id)}
                              className="flex-1 bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                            >
                              <FiTrash2 className="inline mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Orders Tab */}
              {selectedTab === 'orders' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
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
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.id.slice(-6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.items.length} items
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{order.totalAmount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'preparing' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'ready' ? 'bg-indigo-100 text-indigo-800' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as FoodOrder['status'])}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="accepted">Accepted</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
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

              {/* Settings Tab */}
              {selectedTab === 'settings' && (
                <div className="max-w-2xl">
                  <h3 className="text-lg font-semibold mb-4">Restaurant Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Operating Hours</label>
                      <div className="mt-1 flex space-x-4">
                        <p className="text-gray-600">
                          {restaurant.openingTime} - {restaurant.closingTime}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="mt-1 text-gray-600">
                        {restaurant.address.street}, {restaurant.address.city}, {restaurant.address.state} - {restaurant.address.pincode}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rating</label>
                      <p className="mt-1 text-gray-600">
                        {restaurant.rating ? `${restaurant.rating}/5` : 'No ratings yet'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add/Edit Dish Modal */}
          {showAddDish && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">
                  {editingDish ? 'Edit Dish' : 'Add New Dish'}
                </h2>
                
                <form onSubmit={handleAddDish}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        required
                        value={dishForm.name}
                        onChange={(e) => setDishForm({...dishForm, name: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        required
                        value={dishForm.description}
                        onChange={(e) => setDishForm({...dishForm, description: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={dishForm.price}
                        onChange={(e) => setDishForm({...dishForm, price: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        required
                        value={dishForm.category}
                        onChange={(e) => setDishForm({...dishForm, category: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={dishForm.isVeg}
                            onChange={() => setDishForm({...dishForm, isVeg: true})}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2">Vegetarian</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={!dishForm.isVeg}
                            onChange={() => setDishForm({...dishForm, isVeg: false})}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="ml-2">Non-Vegetarian</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setDishImage(e.target.files?.[0] || null)}
                        className="mt-1 block w-full"
                        required={!editingDish}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      {editingDish ? 'Update' : 'Add'} Dish
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddDish(false);
                        setEditingDish(null);
                        setDishForm({
                          name: '',
                          description: '',
                          price: '',
                          category: '',
                          isVeg: true,
                        });
                        setDishImage(null);
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