'use client';

import React, { useState, useEffect } from 'react';
import { SurplusListing, Order, OrderItem } from '../lib/types';
import { listingService, orderService } from '../lib/firebase-services';
import LoadingScreen from './ui/LoadingScreen';
import { toast } from 'sonner';
import OrderTrackingButton from './OrderTrackingButton';

interface ClientDashboardProps {
  clientId: string;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
}

export default function ClientDashboard({ 
  clientId, 
  clientName, 
  clientAddress, 
  clientPhone 
}: ClientDashboardProps) {
  const [availableFood, setAvailableFood] = useState<SurplusListing[]>([]);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const unsubListings = listingService.subscribeToAvailableListings((listings) => {
      setAvailableFood(listings);
      setLoading(false);
    });
    const unsubOrders = orderService.subscribeToClientOrders(clientId, (orders) => {
      setClientOrders(orders);
    });
    return () => { unsubListings(); unsubOrders(); };
  }, [clientId]);

  const handleQuantityChange = (foodId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = new Map(selectedItems);
      newSelected.delete(foodId);
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(new Map(selectedItems.set(foodId, quantity)));
    }
  };

  const handleClaimFood = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one food item');
      return;
    }

    try {
      // Group items by restaurant
      const restaurantGroups = new Map<string, { items: OrderItem[], restaurantName: string }>();
      
      for (const [listingId, quantity] of selectedItems) {
        const listing = availableFood.find(f => f.id === listingId);
        if (!listing) continue;
        const restaurantId = listing.restaurantId;
        
        if (!restaurantGroups.has(restaurantId)) {
          restaurantGroups.set(restaurantId, { items: [], restaurantName: listing.restaurantName });
        }
        
        const group = restaurantGroups.get(restaurantId)!;
        group.items.push({
          listingId: listing.id,
          foodType: listing.foodType,
          quantity,
          unit: listing.unit || 'kg',
          surplusPrice: listing.surplusPrice,
          originalPrice: listing.originalPrice,
          itemTotal: listing.surplusPrice * quantity,
        });
      }

      // Create orders for each restaurant
      for (const [restaurantId, { items, restaurantName }] of restaurantGroups) {
        await orderService.createOrder({
          clientId,
          clientName,
          restaurantId,
          restaurantName,
          items,
          clientPhone,
          clientAddress,
        });
      }

      toast.success('Food claimed successfully!');
      setSelectedItems(new Map());
    } catch (error) {
      toast.error('Failed to claim food');
      console.error('Error claiming food:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingScreen variant="fullscreen" title="Loading Food" subtitle="Finding available surplus near you…" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome, {clientName}!</h1>
        
        {/* Available Food Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Available Food</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {availableFood.map((food) => (
              <div key={food.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                {food.imageUrl && (
                  <img 
                    src={food.imageUrl} 
                    alt={food.foodType}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{food.foodType}</h3>
                <p className="text-gray-600 text-sm mb-3">{food.description || ''}</p>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-sm line-through text-gray-400">₹{food.originalPrice}</span>
                    <span className="text-lg font-bold text-green-600 ml-2">₹{food.surplusPrice}</span>
                  </div>
                  <span className="text-sm text-gray-500">{food.quantity} {food.unit}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange(food.id, (selectedItems.get(food.id) || 0) - 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                    disabled={(selectedItems.get(food.id) || 0) <= 0}
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">
                    {selectedItems.get(food.id) || 0}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(food.id, (selectedItems.get(food.id) || 0) + 1)}
                    className="w-8 h-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedItems.size > 0 && (
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium">
                  Total Items: {Array.from(selectedItems.values()).reduce((sum, qty) => sum + qty, 0)}
                </span>
                <button
                  onClick={handleClaimFood}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Claim Selected Food
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Client Orders Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Orders</h2>
          
          {clientOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet. Claim some food to get started!</p>
          ) : (
            <div className="space-y-4">
              {clientOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">Order #{order.id.slice(-8)}</h3>
                      <p className="text-sm text-gray-600">
                        {order.restaurantName} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.foodType} x{item.quantity}</span>
                        <span>₹{item.itemTotal}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold">Total: ₹{order.clientTotal || 0}</span>
                      <OrderTrackingButton 
                        orderId={order.id} 
                        orderStatus={order.status}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {order.updatedAt ? new Date(order.updatedAt).toLocaleTimeString() : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
