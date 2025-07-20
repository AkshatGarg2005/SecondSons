// User Types
export type UserRole = 'customer' | 'admin' | 'worker' | 'restaurant' | 'homeowner';
export type AdminType = 'cab' | 'quickcommerce' | 'peoplerent' | 'logistics' | 'super';
export type ServiceType = 'cab' | 'quickcommerce' | 'rental' | 'food' | 'peoplerent' | 'logistics';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  adminType?: AdminType; // Only for admin users
  workerService?: ServiceType; // Only for worker users
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Cab Booking Types
export interface CabBooking {
  id: string;
  customerId: string;
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  dropLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  status: 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';
  driverId?: string;
  fare?: number;
  distance?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Quick Commerce Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuickCommerceOrder {
  id: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryAddress: {
    address: string;
    lat: number;
    lng: number;
  };
  status: 'pending' | 'accepted' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  deliveryPersonId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Home Rental Types
export interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  type: 'house' | 'apartment' | 'pg' | 'room';
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    lat: number;
    lng: number;
  };
  rent: number;
  deposit: number;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RentalBooking {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  checkIn: Date;
  checkOut?: Date;
  status: 'inquiry' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  monthlyRent: number;
  deposit: number;
  createdAt: Date;
  updatedAt: Date;
}

// Food Delivery Types
export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  cuisine: string[];
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    lat: number;
    lng: number;
  };
  images: string[];
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dish {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  imageUrl: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodOrder {
  id: string;
  customerId: string;
  restaurantId: string;
  items: Array<{
    dishId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryAddress: {
    address: string;
    lat: number;
    lng: number;
  };
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  deliveryPersonId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// People on Rent Types
export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  services: ServiceOffering[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceOffering {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  duration: number; // in minutes
  imageUrl?: string;
}

export interface ServiceBooking {
  id: string;
  customerId: string;
  serviceId: string;
  workerId?: string;
  scheduledDate: Date;
  scheduledTime: string;
  address: {
    address: string;
    lat: number;
    lng: number;
  };
  status: 'pending' | 'assigned' | 'ongoing' | 'completed' | 'cancelled';
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Logistics Types
export interface LogisticsRequest {
  id: string;
  type: 'food' | 'package' | 'service';
  relatedOrderId: string; // ID of food order or service booking
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  dropLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  status: 'pending' | 'assigned' | 'pickedup' | 'delivering' | 'delivered' | 'cancelled';
  deliveryPersonId?: string;
  estimatedDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}