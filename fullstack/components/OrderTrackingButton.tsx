'use client';

import React, { useState } from 'react';
import { Package, MapPin } from 'lucide-react';
import OrderTracker from './OrderTracker';

interface OrderTrackingButtonProps {
  orderId: string;
  orderStatus: string;
  className?: string;
}

export default function OrderTrackingButton({ 
  orderId, 
  orderStatus, 
  className = '' 
}: OrderTrackingButtonProps) {
  const [showTracker, setShowTracker] = useState(false);

  const isTrackable = ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(orderStatus);

  if (!isTrackable) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowTracker(true)}
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium ${className}`}
      >
        <Package className="w-4 h-4" />
        <span>Track Order</span>
      </button>

      {/* Order Tracker Modal */}
      {showTracker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl">
            <OrderTracker
              orderId={orderId}
              onClose={() => setShowTracker(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}


