"use client";

import { useEffect, useState } from "react";
import { orderService } from "@/lib/firebase-services";
import type { Order, OrderStatus } from "@/lib/types";
import { toast } from "sonner";
import { Check, X, Clock, Package, Timer } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function RestaurantOrders({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pickupTimes, setPickupTimes] = useState<Record<string, number>>({});  // orderId → minutes

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = orderService.subscribeToRestaurantOrders(restaurantId, (all) => {
      setOrders(all.filter(o => o.status === "placed"));
    });
    return () => unsub();
  }, [restaurantId]);

  async function handleAccept(order: Order) {
    const pickupMin = pickupTimes[order.id] || 15;
    try {
      // Save estimated pickup time first
      await updateDoc(doc(db, "orders", order.id), { estimatedPickupMin: pickupMin });
      await orderService.updateOrderStatus(order.id, "accepted", order);
      toast.success(`Order #${order.id.slice(0, 6)} accepted — ${pickupMin} min pickup`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept order");
    }
  }

  async function handleReject(order: Order) {
    try {
      await orderService.updateOrderStatus(order.id, "rejected", order);
      toast.success(`Order #${order.id.slice(0, 6)} rejected`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject order");
    }
  }

  if (orders.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
        <h2 className="text-lg font-semibold mb-2">Incoming Orders</h2>
        <div className="flex items-center gap-3 text-gray-500 py-6 justify-center">
          <Clock size={20} />
          <p>No new orders yet. They&apos;ll appear here in real-time.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Incoming Orders</h2>
        <span className="text-xs text-violet-400 bg-violet-600/20 px-2 py-0.5 rounded">
          {orders.length} pending
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Package size={16} className="text-violet-400" />
                Order #{order.id.slice(0, 6)}
              </h3>
              <span className="text-[11px] text-gray-400">
                {order.createdAt?.toDate?.()?.toLocaleTimeString() || "Just now"}
              </span>
            </div>

            <div className="text-sm text-gray-300 space-y-1">
              <p>From: <span className="text-gray-100">{order.clientName}</span></p>
              {order.items?.map((item, idx) => (
                <div key={idx} className="text-gray-400">
                  <span>{item.foodType} × {item.quantity} {item.unit}</span>
                  <span className="ml-2 text-emerald-400">₹{item.surplusPrice}/{item.unit}</span>
                  <span className="ml-1 text-gray-600 line-through text-xs">₹{item.originalPrice}</span>
                  <span className="ml-2 text-gray-300">= ₹{item.itemTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <div className="text-sm">
                <span className="text-gray-400">Your Earning: </span>
                <span className="text-emerald-400 font-semibold">₹{order.restaurantEarning?.toFixed(2)}</span>
              </div>
            </div>

            {/* Estimated pickup time + action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 flex-1">
                <Timer size={14} className="text-amber-400" />
                <select
                  value={pickupTimes[order.id] || 15}
                  onChange={(e) => setPickupTimes(prev => ({ ...prev, [order.id]: Number(e.target.value) }))}
                  className="rounded-lg bg-gray-800 border border-gray-700 px-2 py-1 text-xs outline-none focus:border-violet-500 text-gray-300"
                >
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hr</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(order)}
                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-sm"
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  onClick={() => handleReject(order)}
                  className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg text-sm"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
