"use client";
import { useEffect, useState } from "react";
import { Truck, CheckCircle, Clock, Package, ChefHat, MapPin, Timer } from "lucide-react";
import { orderService } from "@/lib/firebase-services";
import type { Order, OrderStatus } from "@/lib/types";
import QRCodeDisplay from "@/components/QRCodeDisplay";

const steps: { key: OrderStatus; label: string; icon: any }[] = [
  { key: "placed", label: "Order Placed", icon: Package },
  { key: "accepted", label: "Accepted", icon: CheckCircle },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Clock },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "completed", label: "Completed", icon: MapPin },
];

export default function TrackingSection({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const unsub = orderService.subscribeToOrder(orderId, (o) => setOrder(o));
    return () => unsub();
  }, [orderId]);

  if (!orderId) return null;
  if (!order) {
    return (
      <section id="tracking" className="rounded-xl border border-white/10 bg-gray-900/50 p-5 shadow">
        <h3 className="font-semibold mb-4">Live Tracking</h3>
        <p className="text-gray-500 text-sm">Loading order...</p>
      </section>
    );
  }

  const currentIdx = steps.findIndex(s => s.key === order.status);
  const isRejected = order.status === "rejected";
  const isCancelled = order.status === "cancelled";

  return (
    <section id="tracking" className="flex flex-col gap-6">
      <div className="rounded-xl border border-white/10 bg-gray-900/50 p-5 shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Live Tracking — Order #{orderId.slice(0, 6)}</h3>
          <span className="text-xs text-gray-400">
            {order.restaurantName}
          </span>
        </div>

        {(isRejected || isCancelled) ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">{isRejected ? "❌" : "🚫"}</div>
            <p className="text-lg font-semibold text-rose-400">
              Order {isRejected ? "Rejected" : "Cancelled"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {isRejected
                ? "The restaurant could not fulfill this order."
                : "This order has been cancelled."}
            </p>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="flex items-center justify-between text-sm mb-6">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const isDone = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1 relative">
                    {/* Connector line */}
                    {i > 0 && (
                      <div className={`absolute top-4 -left-1/2 right-1/2 h-0.5
                        ${i <= currentIdx ? "bg-violet-500" : "bg-gray-700"}`} />
                    )}
                    <div
                      className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-full text-xs font-semibold transition-all
                        ${isDone ? "bg-violet-600 text-white" : "bg-gray-700 text-gray-400"}
                        ${isCurrent ? "ring-2 ring-violet-400 ring-offset-2 ring-offset-gray-900" : ""}`}
                    >
                      {isDone && i < currentIdx ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Icon size={16} />
                      )}
                    </div>
                    <span className={`mt-2 text-[11px] text-center
                      ${isDone ? "text-violet-300 font-medium" : "text-gray-500"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Order summary */}
            <div className="rounded-lg bg-gray-800/60 border border-white/10 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Items:</span>
                <span className="text-gray-200">
                  {order.items?.map(i => `${i.foodType} x${i.quantity}`).join(", ")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Paid:</span>
                <span className="text-emerald-400 font-semibold">₹{order.clientTotal?.toFixed(2)}</span>
              </div>
              {order.otp && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Verification OTP:</span>
                    <span className="text-violet-300 font-mono tracking-widest font-bold">{order.otp}</span>
                  </div>
                  <div className="flex justify-center pt-2">
                    <QRCodeDisplay orderId={order.id} otp={order.otp} size="md" />
                  </div>
                </>
              )}
              {order.estimatedPickupMin && order.estimatedPickupMin > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1"><Timer size={13} /> Est. Pickup:</span>
                  <PickupCountdown order={order} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function PickupCountdown({ order }: { order: Order }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!order.estimatedPickupMin || !order.updatedAt) return;
    const ts = order.updatedAt as any;
    const acceptedTime = ts?.toMillis?.() ?? (ts?.seconds ? ts.seconds * 1000 : Date.now());
    const deadline = acceptedTime + order.estimatedPickupMin * 60 * 1000;

    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) { setRemaining("Ready now!"); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}m ${secs}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order.estimatedPickupMin, order.updatedAt]);

  return (
    <span className="text-amber-400 font-mono font-semibold">
      {remaining}
    </span>
  );
}
