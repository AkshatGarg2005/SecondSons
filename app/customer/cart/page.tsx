'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { FiShoppingCart, FiTrash2, FiArrowRight } from 'react-icons/fi';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  type: 'food' | 'commerce';
  restaurantId?: string;
  restaurantName?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
}

export default function CartPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('userCart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem('userCart', JSON.stringify(updatedCart));
  };

  const updateQuantity = (cartIndex: number, itemIndex: number, delta: number) => {
    const updatedCart = [...cart];
    const newQuantity = updatedCart[cartIndex].items[itemIndex].quantity + delta;
    
    if (newQuantity > 0) {
      updatedCart[cartIndex].items[itemIndex].quantity = newQuantity;
    } else {
      updatedCart[cartIndex].items.splice(itemIndex, 1);
      if (updatedCart[cartIndex].items.length === 0) {
        updatedCart.splice(cartIndex, 1);
      }
    }
    
    saveCart(updatedCart);
  };

  const removeCart = (cartIndex: number) => {
    const updatedCart = cart.filter((_, index) => index !== cartIndex);
    saveCart(updatedCart);
    toast.success('Removed from cart');
  };

  const getTotalAmount = (cartItem: CartItem) => {
    return cartItem.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const proceedToCheckout = (cartItem: CartItem) => {
    if (cartItem.type === 'food' && cartItem.restaurantId) {
      router.push(`/services/food/${cartItem.restaurantId}`);
    } else if (cartItem.type === 'commerce') {
      router.push('/services/commerce');
    }
  };

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
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Cart</h1>
            <p className="text-gray-600 mt-2">Review your items before checkout</p>
          </div>

          {cart.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FiShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add items from restaurants or quick commerce to get started</p>
              <div className="space-x-4">
                <button
                  onClick={() => router.push('/services/food')}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                >
                  Order Food
                </button>
                <button
                  onClick={() => router.push('/services/commerce')}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
                >
                  Shop Groceries
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((cartItem, cartIndex) => (
                <div key={cartIndex} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {cartItem.type === 'food' ? cartItem.restaurantName : 'Quick Commerce'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {cartItem.items.length} items
                      </p>
                    </div>
                    <button
                      onClick={() => removeCart(cartIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {cartItem.items.map((item, itemIndex) => (
                      <div key={item.id} className="flex items-center space-x-4 pb-4 border-b last:border-0">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(cartIndex, itemIndex, -1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(cartIndex, itemIndex, 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-semibold">
                          Total: {formatCurrency(getTotalAmount(cartItem))}
                        </p>
                      </div>
                      <button
                        onClick={() => proceedToCheckout(cartItem)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                      >
                        Proceed to Checkout
                        <FiArrowRight className="ml-2" />
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