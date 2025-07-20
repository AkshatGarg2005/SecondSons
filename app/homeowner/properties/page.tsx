'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { uploadToCloudinary } from '@/lib/cloudinary/config';
import { Property, RentalBooking } from '@/types';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiHome, FiUsers, FiDollarSign, FiMapPin } from 'react-icons/fi';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function HomeOwnerPropertiesPage() {
  const { userData } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<RentalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [selectedTab, setSelectedTab] = useState<'properties' | 'inquiries'>('properties');
  const [propertyImages, setPropertyImages] = useState<File[]>([]);
  const [propertyForm, setPropertyForm] = useState({
    title: '',
    description: '',
    type: 'apartment' as Property['type'],
    address: {
      street: '',
      city: '',
      state: 'Madhya Pradesh',
      pincode: '',
    },
    rent: '',
    deposit: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    amenities: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, [userData]);

  const fetchData = async () => {
    if (!userData) return;

    try {
      // Fetch properties
      const propertiesQuery = query(
        collection(db, 'properties'),
        where('ownerId', '==', userData.id)
      );
      const propertiesSnapshot = await getDocs(propertiesQuery);
      const propertiesData: Property[] = [];
      propertiesSnapshot.forEach((doc) => {
        propertiesData.push({ ...doc.data(), id: doc.id } as Property);
      });
      setProperties(propertiesData);

      // Fetch inquiries
      const inquiriesQuery = query(
        collection(db, 'rentalBookings'),
        where('ownerId', '==', userData.id)
      );
      const inquiriesSnapshot = await getDocs(inquiriesQuery);
      const inquiriesData: RentalBooking[] = [];
      inquiriesSnapshot.forEach((doc) => {
        inquiriesData.push({ ...doc.data(), id: doc.id } as RentalBooking);
      });
      setInquiries(inquiriesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const amenitiesList = [
    'Parking',
    'Power Backup',
    'Water Supply',
    'Security',
    'Lift',
    'Wi-Fi',
    'AC',
    'Gym',
    'Swimming Pool',
    'Garden',
    'Balcony',
    'Furnished',
  ];

  const handleAmenityToggle = (amenity: string) => {
    setPropertyForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPropertyImages(prev => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setPropertyImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (propertyImages.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    try {
      // Upload images
      const imageUrls = await Promise.all(
        propertyImages.map(image => uploadToCloudinary(image))
      );

      const propertyData = {
        ownerId: userData!.id,
        title: propertyForm.title,
        description: propertyForm.description,
        type: propertyForm.type,
        address: {
          ...propertyForm.address,
          lat: 23.2599 + (Math.random() - 0.5) * 0.1,
          lng: 77.4126 + (Math.random() - 0.5) * 0.1,
        },
        rent: parseFloat(propertyForm.rent),
        deposit: parseFloat(propertyForm.deposit),
        amenities: propertyForm.amenities,
        images: imageUrls,
        isAvailable: true,
        bedrooms: propertyForm.bedrooms ? parseInt(propertyForm.bedrooms) : undefined,
        bathrooms: propertyForm.bathrooms ? parseInt(propertyForm.bathrooms) : undefined,
        area: propertyForm.area ? parseInt(propertyForm.area) : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (editingProperty) {
        await updateDoc(doc(db, 'properties', editingProperty.id), {
          ...propertyData,
          updatedAt: serverTimestamp(),
        });
        toast.success('Property updated successfully');
      } else {
        await addDoc(collection(db, 'properties'), propertyData);
        toast.success('Property added successfully');
      }

      setShowAddProperty(false);
      setEditingProperty(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error('Failed to save property');
    }
  };

  const resetForm = () => {
    setPropertyForm({
      title: '',
      description: '',
      type: 'apartment',
      address: {
        street: '',
        city: '',
        state: 'Madhya Pradesh',
        pincode: '',
      },
      rent: '',
      deposit: '',
      bedrooms: '',
      bathrooms: '',
      area: '',
      amenities: [],
    });
    setPropertyImages([]);
  };

  const togglePropertyAvailability = async (property: Property) => {
    try {
      await updateDoc(doc(db, 'properties', property.id), {
        isAvailable: !property.isAvailable,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Property ${!property.isAvailable ? 'marked as available' : 'marked as unavailable'}`);
      fetchData();
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await deleteDoc(doc(db, 'properties', propertyId));
        toast.success('Property deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting property:', error);
        toast.error('Failed to delete property');
      }
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, status: RentalBooking['status']) => {
    try {
      await updateDoc(doc(db, 'rentalBookings', inquiryId), {
        status,
        updatedAt: serverTimestamp(),
      });
      toast.success('Inquiry status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating inquiry:', error);
      toast.error('Failed to update inquiry status');
    }
  };

  const stats = {
    totalProperties: properties.length,
    availableProperties: properties.filter(p => p.isAvailable).length,
    totalInquiries: inquiries.length,
    pendingInquiries: inquiries.filter(i => i.status === 'inquiry').length,
    monthlyIncome: properties
      .filter(p => !p.isAvailable)
      .reduce((sum, p) => sum + p.rent, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['homeowner']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
            <p className="text-gray-600 mt-2">Manage your rental properties and inquiries</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3">
                  <FiHome className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Properties</p>
                  <p className="text-2xl font-semibold">{stats.totalProperties}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3">
                  <FiToggleRight className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-semibold">{stats.availableProperties}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3">
                  <FiUsers className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Inquiries</p>
                  <p className="text-2xl font-semibold">{stats.totalInquiries}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 rounded-full p-3">
                  <FiUsers className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-semibold">{stats.pendingInquiries}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-indigo-100 rounded-full p-3">
                  <FiDollarSign className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Monthly Income</p>
                  <p className="text-2xl font-semibold">₹{stats.monthlyIncome}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setSelectedTab('properties')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'properties'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Properties
                </button>
                <button
                  onClick={() => setSelectedTab('inquiries')}
                  className={`py-4 px-6 text-sm font-medium ${
                    selectedTab === 'inquiries'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Inquiries
                </button>
              </nav>
            </div>

            <div className="p-6">
              {selectedTab === 'properties' && (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => setShowAddProperty(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                    >
                      <FiPlus className="mr-2" />
                      Add Property
                    </button>
                  </div>

                  {properties.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No properties added yet. Click "Add Property" to get started.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {properties.map((property) => (
                        <div key={property.id} className="bg-white border rounded-lg overflow-hidden">
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <h3 className="font-semibold text-lg">{property.title}</h3>
                            <p className="text-gray-600 text-sm flex items-center mt-1">
                              <FiMapPin className="mr-1" />
                              {property.address.city}
                            </p>
                            <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                              {property.description}
                            </p>
                            <div className="mt-3 flex justify-between items-center">
                              <span className="text-lg font-bold text-indigo-600">
                                ₹{property.rent}/month
                              </span>
                              <button
                                onClick={() => togglePropertyAvailability(property)}
                                className={`px-3 py-1 rounded text-sm ${
                                  property.isAvailable 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {property.isAvailable ? 'Available' : 'Occupied'}
                              </button>
                            </div>
                            <div className="mt-3 flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingProperty(property);
                                  setPropertyForm({
                                    title: property.title,
                                    description: property.description,
                                    type: property.type,
                                    address: {
                                      street: property.address.street,
                                      city: property.address.city,
                                      state: property.address.state,
                                      pincode: property.address.pincode,
                                    },
                                    rent: property.rent.toString(),
                                    deposit: property.deposit.toString(),
                                    bedrooms: property.bedrooms?.toString() || '',
                                    bathrooms: property.bathrooms?.toString() || '',
                                    area: property.area?.toString() || '',
                                    amenities: property.amenities,
                                  });
                                  setShowAddProperty(true);
                                }}
                                className="flex-1 bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                              >
                                <FiEdit2 className="inline mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProperty(property.id)}
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
                  )}
                </>
              )}

              {selectedTab === 'inquiries' && (
                <div className="overflow-x-auto">
                  {inquiries.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No inquiries received yet.
                    </p>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Property
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tenant
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
                        {inquiries.map((inquiry) => {
                          const property = properties.find(p => p.id === inquiry.propertyId);
                          return (
                            <tr key={inquiry.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {property?.title || 'Unknown Property'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(inquiry.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {inquiry.tenantId.slice(-6)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  inquiry.status === 'inquiry' ? 'bg-yellow-100 text-yellow-800' :
                                  inquiry.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  inquiry.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {inquiry.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <select
                                  value={inquiry.status}
                                  onChange={(e) => handleUpdateInquiryStatus(inquiry.id, e.target.value as RentalBooking['status'])}
                                  className="text-sm border rounded px-2 py-1"
                                >
                                  <option value="inquiry">Inquiry</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="active">Active Tenant</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Add/Edit Property Modal */}
          {showAddProperty && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">
                  {editingProperty ? 'Edit Property' : 'Add New Property'}
                </h2>
                
                <form onSubmit={handleAddProperty}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        required
                        value={propertyForm.title}
                        onChange={(e) => setPropertyForm({...propertyForm, title: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="2BHK Apartment in City Center"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        required
                        value={propertyForm.description}
                        onChange={(e) => setPropertyForm({...propertyForm, description: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        rows={4}
                        placeholder="Describe your property..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Property Type</label>
                      <select
                        required
                        value={propertyForm.type}
                        onChange={(e) => setPropertyForm({...propertyForm, type: e.target.value as Property['type']})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="house">House</option>
                        <option value="apartment">Apartment</option>
                        <option value="pg">PG</option>
                        <option value="room">Room</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Monthly Rent (₹)</label>
                      <input
                        type="number"
                        required
                        value={propertyForm.rent}
                        onChange={(e) => setPropertyForm({...propertyForm, rent: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Security Deposit (₹)</label>
                      <input
                        type="number"
                        required
                        value={propertyForm.deposit}
                        onChange={(e) => setPropertyForm({...propertyForm, deposit: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                      <input
                        type="number"
                        value={propertyForm.bedrooms}
                        onChange={(e) => setPropertyForm({...propertyForm, bedrooms: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                      <input
                        type="number"
                        value={propertyForm.bathrooms}
                        onChange={(e) => setPropertyForm({...propertyForm, bathrooms: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Area (sqft)</label>
                      <input
                        type="number"
                        value={propertyForm.area}
                        onChange={(e) => setPropertyForm({...propertyForm, area: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Street Address</label>
                      <input
                        type="text"
                        required
                        value={propertyForm.address.street}
                        onChange={(e) => setPropertyForm({
                          ...propertyForm,
                          address: {...propertyForm.address, street: e.target.value}
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        required
                        value={propertyForm.address.city}
                        onChange={(e) => setPropertyForm({
                          ...propertyForm,
                          address: {...propertyForm.address, city: e.target.value}
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">PIN Code</label>
                      <input
                        type="text"
                        required
                        pattern="[0-9]{6}"
                        value={propertyForm.address.pincode}
                        onChange={(e) => setPropertyForm({
                          ...propertyForm,
                          address: {...propertyForm.address, pincode: e.target.value}
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {amenitiesList.map(amenity => (
                          <label key={amenity} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={propertyForm.amenities.includes(amenity)}
                              onChange={() => handleAmenityToggle(amenity)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm">{amenity}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full"
                        required={!editingProperty}
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload up to 5 images</p>
                      
                      {propertyImages.length > 0 && (
                        <div className="mt-2 grid grid-cols-5 gap-2">
                          {propertyImages.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-20 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      {editingProperty ? 'Update' : 'Add'} Property
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddProperty(false);
                        setEditingProperty(null);
                        resetForm();
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