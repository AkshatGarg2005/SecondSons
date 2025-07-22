'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone, FiCheck, FiChevronRight } from 'react-icons/fi';
import { UserRole, ServiceType } from '@/types';

// Define role configurations
const roleConfigs = {
  customer: {
    title: 'Customer',
    description: 'Book services, order food, rent properties',
    icon: '🛍️',
    color: 'bg-blue-500',
  },
  worker: {
    title: 'Service Provider',
    description: 'Provide services and earn money',
    icon: '👷',
    color: 'bg-green-500',
    subtypes: [
      { value: 'cab', label: 'Cab Driver', icon: '🚗' },
      { value: 'quickcommerce', label: 'Delivery Partner', icon: '📦' },
      { value: 'food', label: 'Food Delivery', icon: '🍕' },
      { value: 'peoplerent', label: 'Home Services', icon: '🔧' },
      { value: 'logistics', label: 'Logistics Partner', icon: '🚚' },
    ],
  },
  restaurant: {
    title: 'Restaurant Owner',
    description: 'List your restaurant and manage orders',
    icon: '🍽️',
    color: 'bg-orange-500',
  },
  homeowner: {
    title: 'Property Owner',
    description: 'List properties for rent',
    icon: '🏠',
    color: 'bg-purple-500',
  },
};

const baseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms'),
});

const registerSchema = baseSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, currentUser, userData } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedWorkerType, setSelectedWorkerType] = useState<ServiceType>('cab');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser && userData) {
      redirectToDashboard();
    }
  }, [currentUser, userData]);

  const redirectToDashboard = () => {
    if (!userData) return;
    
    switch (userData.role) {
      case 'worker':
        router.push(`/worker/${userData.workerService || 'cab'}`);
        break;
      case 'restaurant':
        router.push('/restaurant/setup');
        break;
      case 'homeowner':
        router.push('/homeowner/properties');
        break;
      default:
        router.push('/customer/dashboard');
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!selectedRole) {
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(
        data.email, 
        data.password, 
        data.name, 
        data.phone, 
        selectedRole,
        selectedRole === 'worker' ? selectedWorkerType : undefined
      );
      
      // Wait a moment for the auth state to update
      setTimeout(() => {
        router.push('/test');
      }, 500);
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'worker') {
      setStep(2); // Show worker type selection
    } else {
      setStep(3); // Go to form
    }
  };

  const handleWorkerTypeSelect = (type: ServiceType) => {
    setSelectedWorkerType(type);
    setStep(3); // Go to form
  };

  const handleBack = () => {
    if (step === 3 && selectedRole === 'worker') {
      setStep(2);
    } else if (step > 1) {
      setStep(1);
      setSelectedRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl space-y-8">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {/* Step 1: Choose Role */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Join SecondSons</h2>
                <p className="mt-2 text-gray-600">Choose how you want to use our platform</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(roleConfigs).map(([role, config]) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role as UserRole)}
                    className="relative group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500 text-left"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`${config.color} bg-opacity-10 p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                        <span className="text-3xl">{config.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {config.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {config.description}
                        </p>
                      </div>
                      <FiChevronRight className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Choose Worker Type (if worker selected) */}
          {step === 2 && selectedRole === 'worker' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Select Your Service</h2>
                <p className="mt-2 text-gray-600">What type of service will you provide?</p>
              </div>

              <div className="space-y-3">
                {roleConfigs.worker.subtypes?.map((subtype) => (
                  <button
                    key={subtype.value}
                    onClick={() => handleWorkerTypeSelect(subtype.value as ServiceType)}
                    className="w-full group bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-indigo-500 text-left flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{subtype.icon}</span>
                      <span className="font-medium text-gray-900">{subtype.label}</span>
                    </div>
                    <FiChevronRight className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))}
              </div>

              <button
                onClick={handleBack}
                className="w-full text-center text-gray-600 hover:text-gray-900"
              >
                ← Back to role selection
              </button>
            </div>
          )}

          {/* Step 3: Registration Form */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
                <p className="mt-2 text-gray-600">
                  {selectedRole === 'worker' 
                    ? `Registering as ${roleConfigs.worker.subtypes?.find(s => s.value === selectedWorkerType)?.label}`
                    : `Registering as ${roleConfigs[selectedRole!]?.title}`
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('name')}
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('phone')}
                        type="tel"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="9876543210"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <FiEyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <FiEye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <FiEyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <FiEye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    {...register('acceptTerms')}
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </button>
                </div>
              </form>

              {/* Additional Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {selectedRole === 'worker' && (
                    <>
                      <li>• Your account will be verified within 24 hours</li>
                      <li>• You'll receive training materials via email</li>
                      <li>• Start accepting jobs once approved</li>
                    </>
                  )}
                  {selectedRole === 'restaurant' && (
                    <>
                      <li>• Complete your restaurant profile</li>
                      <li>• Add your menu and dishes</li>
                      <li>• Start receiving orders immediately</li>
                    </>
                  )}
                  {selectedRole === 'homeowner' && (
                    <>
                      <li>• Add your property details</li>
                      <li>• Upload property photos</li>
                      <li>• Start receiving tenant inquiries</li>
                    </>
                  )}
                  {selectedRole === 'customer' && (
                    <>
                      <li>• Browse all available services</li>
                      <li>• Book services instantly</li>
                      <li>• Track your orders in real-time</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}