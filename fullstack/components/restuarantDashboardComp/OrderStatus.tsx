"use client";

import { useEffect, useState } from "react";
import { orderService } from "@/lib/firebase-services";
import type { Order, OrderStatus } from "@/lib/types";
import { toast } from "sonner";

const statuses: { key: OrderStatus; label: string }[] = [
  { key: "placed", label: "Placed" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "completed", label: "Completed" },
];

type RestaurantOrderProps = {
  orderId: string;
};

export default function RestaurantOrderStatusManager({ orderId }: RestaurantOrderProps) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const unsub = orderService.subscribeToOrder(orderId, (o) => setOrder(o));
    return () => unsub();
  }, [orderId]);

  const handleUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;
    try {
      await orderService.updateOrderStatus(orderId, newStatus, order);
      toast.success(`Order → ${newStatus.replace("_", " ")}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  if (!orderId) return null;

  return (
    <div className="rounded-xl border border-gray-800 p-6 shadow bg-gray-900 text-white">
      <h2 className="text-lg font-bold mb-4">Manage Order #{orderId.slice(0, 6)}</h2>
      <p className="mb-4">
        Current Status: <span className="font-semibold text-violet-300">{order?.status || "Loading..."}</span>
      </p>
      {order?.otp && (
        <p className="mb-4 text-sm">
          Verification OTP: <span className="font-mono text-violet-300 font-bold tracking-widest">{order.otp}</span>
        </p>
      )}
      <div className="flex gap-3 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s.key}
            onClick={() => handleUpdate(s.key)}
            className={`px-4 py-2 rounded-lg border transition text-sm ${
              order?.status === s.key
                ? "bg-violet-600 border-violet-700"
                : "bg-gray-700 border-gray-600 hover:bg-gray-600"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
