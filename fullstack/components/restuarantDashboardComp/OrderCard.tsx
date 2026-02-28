// components/restaurant/OrderCard.tsx
"use client";

import { orderService } from "@/lib/firebase-services";
import type { Order, OrderStatus } from "@/lib/types";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

const nextStatusMap: Record<string, OrderStatus | null> = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "completed",
  completed: null,
};

export default function OrderCard({ order }: { order: Order }) {
  const handleStatusUpdate = async () => {
    const next = nextStatusMap[order.status];
    if (!next) return;

    try {
      await orderService.updateOrderStatus(order.id, next, order);
      toast.success(`Order → ${next.replace("_", " ")}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update");
    }
  };

  const next = nextStatusMap[order.status];

  return (
    <div className="p-4 rounded-xl border border-gray-800 bg-gray-900 space-y-2">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold">Order #{order.id.slice(0, 6)}</h3>
        <span className="text-xs bg-violet-600/20 text-violet-300 px-2 py-0.5 rounded">{order.status}</span>
      </div>
      <p className="text-sm text-gray-400">{order.clientName}</p>
      <ul className="text-sm list-disc ml-4 text-gray-300">
        {order.items?.map((item, idx) => (
          <li key={idx}>{item.foodType} × {item.quantity} {item.unit}</li>
        ))}
      </ul>
      <div className="text-sm text-emerald-400 font-medium">
        Earning: ₹{order.restaurantEarning?.toFixed(2)}
      </div>

      {next && (
        <button
          onClick={handleStatusUpdate}
          className="inline-flex items-center gap-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm"
        >
          Mark as {next.replace("_", " ")} <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
