'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone, FiCheck, FiChevronRight, FiInfo } from 'react-icons/fi';
import { UserRole, ServiceType } from '@/types';
import toast from 'react-hot-toast';

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

const homeServiceSpecialties = [
  { category: 'Plumbing', services: ['Tap Repair', 'Pipe Fixing', 'Toilet Repair', 'Water Tank Cleaning'] },
  { category: 'Electrical', services: ['Switch Repair', 'Wiring Work', 'Fan Installation', 'MCB & Fuse Work'] },
  { category: 'AC Repair', services: ['AC Service', 'Gas Filling', 'AC Installation', 'AC Repair'] },
  { category: 'Carpentry', services: ['Furniture Repair', 'Door Repair', 'Cabinet Work', 'Window Repair'] },
  { category: 'Painting', services: ['Room Painting', 'Wall Texture', 'Wood Polish', 'Waterproofing'] },
  { category: 'Appliance Repair', services: ['Washing Machine', 'Refrigerator', 'Microwave', 'Geyser'] },
];

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
  const [currentStep, setCurrentStep] = useState('role'); // 'role', 'workerType', 'specialties', 'form'
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedWorkerType, setSelectedWorkerType] = useState<ServiceType>('cab');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

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

    if (selectedRole === 'worker' && selectedWorkerType === 'peoplerent' && selectedSpecialties.length === 0) {
      toast.error('Please select at least one specialty');
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
      
      // If home service worker, save specialties to localStorage for later use
      if (selectedRole === 'worker' && selectedWorkerType === 'peoplerent') {
        localStorage.setItem('workerSpecialties', JSON.stringify(selectedSpecialties));
      }
      
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
      setCurrentStep('workerType');
    } else {
      setCurrentStep('form');
    }
  };

  const handleWorkerTypeSelect = (type: ServiceType) => {
    setSelectedWorkerType(type);
    if (type === 'peoplerent') {
      setCurrentStep('specialties');
    } else {
      setCurrentStep('form');
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'form':
        if (selectedRole === 'worker') {
          if (selectedWorkerType === 'peoplerent') {
            setCurrentStep('specialties');
          } else {
            setCurrentStep('workerType');
          }
        } else {
          setCurrentStep('role');
          setSelectedRole(null);
        }
        break;
      case 'specialties':
        setCurrentStep('workerType');
        setSelectedSpecialties([]);
        break;
      case 'workerType':
        setCurrentStep('role');
        setSelectedRole(null);
        setSelectedWorkerType('cab');
        break;
      default:
        break;
    }
  };

  const getTotalSteps = () => {
    if (selectedRole === 'worker') {
      if (selectedWorkerType === 'peoplerent') {
        return 4; // role -> workerType -> specialties -> form
      }
      return 3; // role -> workerType -> form
    }
    return 2; // role -> form
  };

  const getCurrentStepNumber = () => {
    switch (currentStep) {
      case 'role':
        return 1;
      case 'workerType':
        return 2;
      case 'specialties':
        return 3;
      case 'form':
        return selectedRole === 'worker' ? (selectedWorkerType === 'peoplerent' ? 4 : 3) : 2;
      default:
        return 1;
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
              style={{ width: `${(getCurrentStepNumber() / getTotalSteps()) * 100}%` }}
            />
          </div>

          {/* Step 1: Choose Role */}
          {currentStep === 'role' && (
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
          {currentStep === 'workerType' && (
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

          {/* Step 3: Choose Specialties (if home service worker) */}
          {currentStep === 'specialties' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Select Your Specialties</h2>
                <p className="mt-2 text-gray-600">Choose the services you can provide (select at least one)</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                <FiInfo className="text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Available Service Categories:</p>
                  <p>You can provide services in one or more categories. Select all the services you're skilled in.</p>
                </div>
              </div>

              <div className="space-y-6 max-h-96 overflow-y-auto">
                {homeServiceSpecialties.map((category) => (
                  <div key={category.category} className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="font-semibold text-lg mb-3">{category.category}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {category.services.map((service) => (
                        <label
                          key={service}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSpecialties.includes(`${category.category} - ${service}`)}
                            onChange={() => handleSpecialtyToggle(`${category.category} - ${service}`)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back to service selection
                </button>
                <button
                  onClick={() => {
                    if (selectedSpecialties.length === 0) {
                      toast.error('Please select at least one specialty');
                    } else {
                      setCurrentStep('form');
                    }
                  }}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Final Step: Registration Form */}
          {currentStep === 'form' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
                <p className="mt-2 text-gray-600">
                  {selectedRole === 'worker' 
                    ? `Registering as ${roleConfigs.worker.subtypes?.find(s => s.value === selectedWorkerType)?.label}`
                    : `Registering as ${roleConfigs[selectedRole!]?.title}`
                  }
                </p>
                {selectedRole === 'worker' && selectedWorkerType === 'peoplerent' && selectedSpecialties.length > 0 && (
                  <p className="text-sm text-indigo-600 mt-1">
                    {selectedSpecialties.length} specialties selected
                  </p>
                )}
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
                      {selectedWorkerType === 'peoplerent' && (
                        <li>• Your specialties will be displayed to customers</li>
                      )}
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