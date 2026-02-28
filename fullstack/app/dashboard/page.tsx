'use client';

import React, { useState } from 'react';
import ClientDashboard from '../../components/ClientDashboard';
import RestaurantDashboard from '../../components/RestaurantDashboard';
import OrderTracker from '../../components/OrderTracker';

export default function DashboardPage() {
  const [userType, setUserType] = useState<'client' | 'restaurant'>('client');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Mock user data - in real app, this would come from authentication
  const mockClientData = {
    clientId: 'client_123',
    clientName: 'John Doe',
    clientAddress: '123 Main St, City, State 12345',
    clientPhone: '+1 (555) 123-4567'
  };

  const mockRestaurantData = {
    restaurantId: 'restaurant_456',
    restaurantName: 'Delicious Bites'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Food Ordering Dashboard</h1>
            
            {/* User Type Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setUserType('client')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    userType === 'client'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Client
                </button>
                <button
                  onClick={() => setUserType('restaurant')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    userType === 'restaurant'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Restaurant
                </button>
              </div>
              
              {/* User Info */}
              <div className="text-sm text-gray-600">
                {userType === 'client' ? mockClientData.clientName : mockRestaurantData.restaurantName}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {userType === 'client' ? (
          <ClientDashboard
            clientId={mockClientData.clientId}
            clientName={mockClientData.clientName}
            clientAddress={mockClientData.clientAddress}
            clientPhone={mockClientData.clientPhone}
          />
        ) : (
          <RestaurantDashboard
            restaurantId={mockRestaurantData.restaurantId}
            restaurantName={mockRestaurantData.restaurantName}
          />
        )}
      </main>

      {/* Order Tracker Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl">
            <OrderTracker
              orderId={selectedOrderId}
              onClose={() => setSelectedOrderId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}


