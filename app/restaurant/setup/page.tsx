'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { uploadToCloudinary } from '@/lib/cloudinary/config';
import { Restaurant } from '@/types';
import { FiUpload, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function RestaurantSetupPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine: [] as string[],
    address: {
      street: '',
      city: '',
      state: 'Madhya Pradesh',
      pincode: '',
    },
    openingTime: '09:00',
    closingTime: '22:00',
  });

  const cuisineOptions = [
    'North Indian',
    'South Indian',
    'Chinese',
    'Continental',
    'Italian',
    'Mexican',
    'Thai',
    'Japanese',
    'Fast Food',
    'Desserts',
    'Beverages',
  ];

  const handleCuisineToggle = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisine: prev.cuisine.includes(cuisine)
        ? prev.cuisine.filter(c => c !== cuisine)
        : [...prev.cuisine, cuisine]
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 images
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    if (formData.cuisine.length === 0) {
      toast.error('Please select at least one cuisine type');
      return;
    }

    setLoading(true);

    try {
      // Upload images
      const imageUrls = await Promise.all(
        images.map(image => uploadToCloudinary(image))
      );

      // Create restaurant document
      const restaurantData: Omit<Restaurant, 'id'> = {
        ownerId: userData!.id,
        name: formData.name,
        description: formData.description,
        cuisine: formData.cuisine,
        address: {
          ...formData.address,
          lat: 23.2599 + (Math.random() - 0.5) * 0.1, // Random coords near Bhopal
          lng: 77.4126 + (Math.random() - 0.5) * 0.1,
        },
        images: imageUrls,
        isOpen: true,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        rating: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'restaurants'), {
        ...restaurantData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Restaurant registered successfully!');
      router.push('/restaurant/dashboard');
    } catch (error) {
      console.error('Error setting up restaurant:', error);
      toast.error('Failed to setup restaurant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['restaurant']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Setup Your Restaurant</h1>
            <p className="text-gray-600 mt-2">Tell us about your restaurant to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter your restaurant name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Tell customers what makes your restaurant special"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Cuisine Types</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {cuisineOptions.map(cuisine => (
                      <label key={cuisine} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.cuisine.includes(cuisine)}
                          onChange={() => handleCuisineToggle(cuisine)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{cuisine}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Address</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Street Address</label>
                  <input
                    type="text"
                    required
                    value={formData.address.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: {...formData.address, street: e.target.value}
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    required
                    value={formData.address.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: {...formData.address, city: e.target.value}
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Bhopal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">PIN Code</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    value={formData.address.pincode}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: {...formData.address, pincode: e.target.value}
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="462001"
                  />
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Operating Hours</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Opening Time</label>
                  <input
                    type="time"
                    required
                    value={formData.openingTime}
                    onChange={(e) => setFormData({...formData, openingTime: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Closing Time</label>
                  <input
                    type="time"
                    required
                    value={formData.closingTime}
                    onChange={(e) => setFormData({...formData, closingTime: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Restaurant Images</h2>
              <p className="text-sm text-gray-600 mb-4">Upload up to 5 images of your restaurant</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Restaurant ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-32 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400">
                    <FiUpload className="h-8 w-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-600">Upload Image</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}