// components/restaurant/OrdersList.tsx
"use client";

import { useEffect, useState } from "react";
import { orderService } from "@/lib/firebase-services";
import type { Order } from "@/lib/types";
import OrderCard from "./OrderCard";

export default function OrdersList({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = orderService.subscribeToRestaurantOrders(restaurantId, (data) => {
      setOrders(data);
    });
    return () => unsub();
  }, [restaurantId]);

  return (
    <div className="space-y-4">
      {orders.length === 0 && (
        <p className="text-gray-500 text-center py-4">No orders yet.</p>
      )}
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
