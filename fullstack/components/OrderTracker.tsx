'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../lib/types';
import { orderService } from '../lib/firebase-services';
import { CheckCircle, Clock, XCircle, Truck, Package, Home } from 'lucide-react';

interface OrderTrackerProps {
  orderId: string;
  onClose?: () => void;
}

const orderSteps: { status: OrderStatus; label: string; icon: React.ReactNode; description: string }[] = [
  {
    status: 'placed',
    label: 'Order Placed',
    icon: <Clock className="w-6 h-6" />,
    description: 'Your order has been placed and is waiting for restaurant confirmation'
  },
  {
    status: 'accepted',
    label: 'Order Accepted',
    icon: <CheckCircle className="w-6 h-6" />,
    description: 'Restaurant has accepted your order and will start preparing soon'
  },
  {
    status: 'preparing',
    label: 'Preparing',
    icon: <Package className="w-6 h-6" />,
    description: 'Your food is being prepared in the kitchen'
  },
  {
    status: 'ready',
    label: 'Ready for Pickup',
    icon: <CheckCircle className="w-6 h-6" />,
    description: 'Your order is ready! You can pick it up or wait for delivery'
  },
  {
    status: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: <Truck className="w-6 h-6" />,
    description: 'Your order is on its way to you'
  },
  {
    status: 'completed',
    label: 'Completed',
    icon: <Home className="w-6 h-6" />,
    description: 'Your order has been delivered successfully!'
  }
];

export default function OrderTracker({ orderId, onClose }: OrderTrackerProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = orderService.subscribeToOrder(orderId, (orderData: Order | null) => {
      setOrder(orderData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const getCurrentStepIndex = (status: OrderStatus) => {
    return orderSteps.findIndex(step => step.status === status);
  };

  const getStepStatus = (stepIndex: number, currentStepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'done';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Not Found</h3>
        <p className="text-gray-600">The order you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(order.status);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Order #{order.id.slice(-8)}
          </h2>
          <p className="text-gray-600">
            {order.restaurantName} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Order Summary</h3>
        <div className="space-y-2">
          {order.items?.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.foodType} x{item.quantity}</span>
              <span>₹{item.itemTotal}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₹{order.clientTotal || 0}</span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Order Progress</h3>
        <div className="space-y-4">
          {orderSteps.map((step, index) => {
            const stepStatus = getStepStatus(index, currentStepIndex);
            const isCompleted = stepStatus === 'done';
            const isCurrent = stepStatus === 'current';
            const isPending = stepStatus === 'upcoming';

            return (
              <div key={step.status} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? 'bg-green-100 text-green-600' 
                    : isCurrent 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${
                    isCompleted ? 'text-green-800' : isCurrent ? 'text-blue-800' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </h4>
                  <p className={`text-sm ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {isCompleted && <CheckCircle className="w-6 h-6 text-green-500" />}
                  {isCurrent && <div className="w-6 h-6 rounded-full bg-blue-500 animate-pulse"></div>}
                  {isPending && <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Highlight */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Current Status</h4>
        <p className="text-blue-700">
          {orderSteps[currentStepIndex]?.description || 'Processing your order...'}
        </p>
        {order.status === 'rejected' && (
          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
            Your order was rejected by the restaurant. Please contact them for more information.
          </div>
        )}
      </div>

      {/* Order Details */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-semibold text-gray-800 mb-3">Order Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Order ID:</span>
            <p className="font-mono">{order.id}</p>
          </div>
          <div>
            <span className="text-gray-600">Created:</span>
            <p>{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</p>
          </div>
          <div>
            <span className="text-gray-600">Last Updated:</span>
            <p>{order.updatedAt ? new Date(order.updatedAt).toLocaleString() : ''}</p>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <p className="capitalize">{order.status.replace('_', ' ')}</p>
          </div>
        </div>
        
        {order.notes && (
          <div className="mt-4">
            <span className="text-gray-600">Notes:</span>
            <p className="text-sm bg-yellow-50 p-2 rounded mt-1">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}


