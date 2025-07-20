import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { FiTruck, FiShoppingCart, FiHome, FiUsers, FiPackage, FiMapPin } from 'react-icons/fi';

const services = [
  {
    title: 'Cab Booking',
    description: 'Book rides instantly with local drivers',
    icon: FiMapPin,
    href: '/services/cab',
    color: 'bg-blue-500',
  },
  {
    title: 'Quick Commerce',
    description: 'Get groceries and essentials delivered fast',
    icon: FiShoppingCart,
    href: '/services/commerce',
    color: 'bg-green-500',
  },
  {
    title: 'Home Rentals',
    description: 'Find your perfect home or PG',
    icon: FiHome,
    href: '/services/rentals',
    color: 'bg-purple-500',
  },
  {
    title: 'Food Delivery',
    description: 'Order from local restaurants',
    icon: FiTruck,
    href: '/services/food',
    color: 'bg-red-500',
  },
  {
    title: 'Services on Demand',
    description: 'Book plumbers, electricians, and more',
    icon: FiUsers,
    href: '/services/people',
    color: 'bg-yellow-500',
  },
  {
    title: 'Logistics',
    description: 'Send packages across the city',
    icon: FiPackage,
    href: '/services/logistics',
    color: 'bg-indigo-500',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Your Community, Connected
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-indigo-100">
              All local services in one unified platform
            </p>
            <Link
              href="/register"
              className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition duration-300"
            >
              Get Started
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need, All in One Place
            </h2>
            <p className="text-xl text-gray-600">
              Connect with local businesses and services in your community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="group relative bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className={`${service.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600">
                    {service.description}
                  </p>
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500 rounded-xl transition-colors duration-300"></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Community</h3>
              <p className="text-gray-600">
                Support local businesses and connect with service providers in your area
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShoppingCart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">One Platform</h3>
              <p className="text-gray-600">
                No more juggling between multiple apps - everything you need is here
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPackage className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast & Reliable</h3>
              <p className="text-gray-600">
                Quick service delivery with real-time tracking and updates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Simplify Your Life?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Join thousands of users who have already made the switch
          </p>
          <div className="space-x-4">
            <Link
              href="/register"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition duration-300"
            >
              Register Now
            </Link>
            <Link
              href="/login"
              className="inline-block bg-gray-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-600 transition duration-300"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 SecondSons. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}