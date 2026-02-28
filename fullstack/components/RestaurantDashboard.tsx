'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../lib/types';
import { orderService } from '../lib/firebase-services';
import { toast } from 'sonner';

interface RestaurantDashboardProps {
  restaurantId: string;
  restaurantName: string;
}

export default function RestaurantDashboard({ 
  restaurantId, 
  restaurantName 
}: RestaurantDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsub = orderService.subscribeToRestaurantOrders(restaurantId, (orders) => {
      setOrders(orders);
      setLoading(false);
    });
    return () => unsub();
  }, [restaurantId]);

  const handleOrderAction = async (orderId: string, action: 'accept' | 'reject' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed') => {
    try {
      let newStatus: OrderStatus;
      
      switch (action) {
        case 'accept': newStatus = 'accepted'; break;
        case 'reject': newStatus = 'rejected'; break;
        case 'preparing': newStatus = 'preparing'; break;
        case 'ready': newStatus = 'ready'; break;
        case 'out_for_delivery': newStatus = 'out_for_delivery'; break;
        case 'completed': newStatus = 'completed'; break;
        default: newStatus = 'placed';
      }

      const order = orders.find(o => o.id === orderId);
      await orderService.updateOrderStatus(orderId, newStatus, order);
      toast.success(`Order ${action.replace('_', ' ')} successfully!`);
    } catch (error) {
      toast.error(`Failed to ${action} order`);
      console.error(`Error ${action}ing order:`, error);
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

  const getStatusActions = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleOrderAction(selectedOrder!.id, 'accept')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Accept
            </button>
            <button
              onClick={() => handleOrderAction(selectedOrder!.id, 'reject')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Reject
            </button>
          </div>
        );
      case 'accepted':
        return (
          <button
            onClick={() => handleOrderAction(selectedOrder!.id, 'preparing')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
          >
            Start Preparing
          </button>
        );
      case 'preparing':
        return (
          <button
            onClick={() => handleOrderAction(selectedOrder!.id, 'ready')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Mark Ready
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => handleOrderAction(selectedOrder!.id, 'out_for_delivery')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            Out for Delivery
          </button>
        );
      case 'out_for_delivery':
        return (
          <button
            onClick={() => handleOrderAction(selectedOrder!.id, 'completed')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Mark Completed
          </button>
        );
      default:
        return null;
    }
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter(order => order.status === status);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{restaurantName} Dashboard</h1>
        
        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Placed</h3>
            <p className="text-3xl font-bold text-yellow-600">{getOrdersByStatus('placed').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Preparing</h3>
            <p className="text-3xl font-bold text-orange-600">{getOrdersByStatus('preparing').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready</h3>
            <p className="text-3xl font-bold text-green-600">{getOrdersByStatus('ready').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Today&apos;s Orders</h3>
            <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Placed Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Placed Orders</h2>
            {getOrdersByStatus('placed').length === 0 ? (
              <p className="text-gray-500 text-center py-4">No placed orders</p>
            ) : (
              <div className="space-y-3">
                {getOrdersByStatus('placed').map((order) => (
                  <div 
                    key={order.id} 
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">Order #{order.id.slice(-8)}</h3>
                      <span className="text-sm text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{order.clientName}</p>
                    <div className="text-sm text-gray-700">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.foodType} x{item.quantity}</span>
                          <span>₹{item.itemTotal}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <span className="font-semibold">Total: ₹{order.restaurantEarning || 0}</span>
                      <span className="text-xs text-gray-500">{order.clientAddress || ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Orders</h2>
            {orders.filter(o => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active orders</p>
            ) : (
              <div className="space-y-3">
                {orders
                  .filter(o => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status))
                  .map((order) => (
                    <div 
                      key={order.id} 
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800">Order #{order.id.slice(-8)}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{order.clientName}</p>
                      <div className="text-sm text-gray-700">
                        {order.items?.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.foodType} x{item.quantity}</span>
                            <span>₹{item.itemTotal}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <span className="font-semibold">Earning: ₹{order.restaurantEarning || 0}</span>
                        <span className="text-xs text-gray-500">{order.clientAddress || ''}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Order #{selectedOrder.id.slice(-8)}
                  </h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Client Information</h3>
                    <p className="text-gray-600">{selectedOrder.clientName}</p>
                    <p className="text-gray-600">{selectedOrder.clientPhone || ''}</p>
                    <p className="text-gray-600">{selectedOrder.clientAddress || ''}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Order Items</h3>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.foodType} x{item.quantity}</span>
                          <span>₹{item.itemTotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Order Details</h3>
                    <p className="text-gray-600">Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.replace('_', ' ').toUpperCase()}
                    </span></p>
                    <p className="text-gray-600">Restaurant Earning: ₹{selectedOrder.restaurantEarning || 0}</p>
                    <p className="text-gray-600">Created: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : ''}</p>
                    {selectedOrder.notes && (
                      <p className="text-gray-600">Notes: {selectedOrder.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    Last updated: {selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleString() : ''}
                  </span>
                  {getStatusActions(selectedOrder.status)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


