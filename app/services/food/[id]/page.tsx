'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Restaurant, Dish, FoodOrder } from '@/types';
import { FiClock, FiMapPin, FiStar, FiShoppingCart, FiPlus, FiMinus } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface CartItem {
  dish: Dish;
  quantity: number;
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const restaurantId = params.id as string;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    fetchRestaurantData();
  }, [restaurantId]);

  const fetchRestaurantData = async () => {
    try {
      // Fetch restaurant
      const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
      if (!restaurantDoc.exists()) {
        toast.error('Restaurant not found');
        router.push('/services/food');
        return;
      }
      
      const restaurantData = { ...restaurantDoc.data(), id: restaurantDoc.id } as Restaurant;
      setRestaurant(restaurantData);

      // Fetch dishes
      const dishesQuery = query(
        collection(db, 'dishes'),
        where('restaurantId', '==', restaurantId),
        where('isAvailable', '==', true)
      );
      const dishesSnapshot = await getDocs(dishesQuery);
      const dishesData: Dish[] = [];
      dishesSnapshot.forEach((doc) => {
        dishesData.push({ ...doc.data(), id: doc.id } as Dish);
      });
      setDishes(dishesData);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      toast.error('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(dishes.map(d => d.category))];
  
  const filteredDishes = dishes.filter(dish => 
    selectedCategory === 'all' || dish.category === selectedCategory
  );

  const vegDishes = filteredDishes.filter(d => d.isVeg);
  const nonVegDishes = filteredDishes.filter(d => !d.isVeg);

  const addToCart = (dish: Dish) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.dish.id === dish.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.dish.id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { dish, quantity: 1 }];
    });
    toast.success('Added to cart');
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.dish.id === dishId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.dish.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast.error('Please enter delivery address');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!restaurant?.isOpen) {
      toast.error('Restaurant is currently closed');
      return;
    }

    setIsOrdering(true);

    try {
      const orderData: Omit<FoodOrder, 'id'> = {
        customerId: userData!.id,
        restaurantId: restaurant.id,
        items: cart.map(item => ({
          dishId: item.dish.id,
          quantity: item.quantity,
          price: item.dish.price,
        })),
        totalAmount: getTotalAmount(),
        deliveryAddress: {
          address: deliveryAddress,
          lat: 23.2599 + (Math.random() - 0.5) * 0.1,
          lng: 77.4126 + (Math.random() - 0.5) * 0.1,
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'foodOrders'), {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Order placed successfully!');
      setCart([]);
      setShowCart(false);
      router.push(`/customer/orders/food/${docRef.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setIsOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Restaurant Header */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="relative h-64">
              <img
                src={restaurant.images[0]}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h1 className="text-3xl font-bold">{restaurant.name}</h1>
                <p className="text-lg mt-1">{restaurant.cuisine.join(', ')}</p>
              </div>
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
                restaurant.isOpen
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600">{restaurant.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <FiClock className="mr-2" />
                  <span>{restaurant.openingTime} - {restaurant.closingTime}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FiMapPin className="mr-2" />
                  <span>{restaurant.address.street}, {restaurant.address.city}</span>
                </div>
                {restaurant.rating && (
                  <div className="flex items-center text-yellow-600">
                    <FiStar className="mr-2 fill-current" />
                    <span>{restaurant.rating}/5</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  {category === 'all' ? 'All Items' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Menu */}
          <div className="space-y-8">
            {vegDishes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="w-5 h-5 mr-2 border-2 border-green-600 rounded flex items-center justify-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  </span>
                  Vegetarian
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vegDishes.map((dish) => (
                    <div key={dish.id} className="bg-white rounded-lg shadow-md p-4 flex">
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="ml-4 flex-1">
                        <h3 className="font-semibold">{dish.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{dish.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-lg font-bold text-indigo-600">₹{dish.price}</span>
                          <button
                            onClick={() => addToCart(dish)}
                            disabled={!restaurant.isOpen}
                            className="bg-indigo-600 text-white px-4 py-1 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                          >
                            <FiPlus className="mr-1" />
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nonVegDishes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="w-5 h-5 mr-2 border-2 border-red-600 rounded flex items-center justify-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  </span>
                  Non-Vegetarian
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nonVegDishes.map((dish) => (
                    <div key={dish.id} className="bg-white rounded-lg shadow-md p-4 flex">
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="ml-4 flex-1">
                        <h3 className="font-semibold">{dish.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{dish.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-lg font-bold text-indigo-600">₹{dish.price}</span>
                          <button
                            onClick={() => addToCart(dish)}
                            disabled={!restaurant.isOpen}
                            className="bg-indigo-600 text-white px-4 py-1 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                          >
                            <FiPlus className="mr-1" />
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cart Button */}
          {cart.length > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="fixed bottom-4 right-4 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 flex items-center"
            >
              <FiShoppingCart className="h-6 w-6" />
              <span className="ml-2 bg-white text-indigo-600 px-2 py-1 rounded-full text-sm font-semibold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </button>
          )}

          {/* Cart Sidebar */}
          {showCart && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50">
              <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Your Order</h2>
                    <button
                      onClick={() => setShowCart(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{restaurant.name}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.dish.id} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium flex items-center">
                            <span className={`w-3 h-3 mr-2 border rounded-sm flex items-center justify-center ${
                              item.dish.isVeg ? 'border-green-600' : 'border-red-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                item.dish.isVeg ? 'bg-green-600' : 'bg-red-600'
                              }`}></span>
                            </span>
                            {item.dish.name}
                          </h4>
                          <p className="text-gray-600">₹{item.dish.price}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.dish.id, -1)}
                            className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                          >
                            <FiMinus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.dish.id, 1)}
                            className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                          >
                            <FiPlus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>₹{getTotalAmount()}</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Address
                      </label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter your delivery address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                      />
                    </div>

                    <button
                      onClick={handlePlaceOrder}
                      disabled={isOrdering || !restaurant.isOpen}
                      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isOrdering ? 'Placing Order...' : restaurant.isOpen ? 'Place Order' : 'Restaurant Closed'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}