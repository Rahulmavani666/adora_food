
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const steps = [
  { key: "placed", label: "Order Placed" },
  { key: "accepted", label: "Accepted by Restaurant" },
  { key: "preparing", label: "Preparing" },
  { key: "out-for-delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

function normalizeStatus(raw: any): string {
  if (raw == null) return "placed"; // fallback
  if (typeof raw === "string") return raw.trim().toLowerCase();

  // If it's an object, try common properties
  if (typeof raw === "object") {
    if (typeof (raw as any).status === "string") return (raw as any).status.trim().toLowerCase();
    if (typeof (raw as any).value === "string") return (raw as any).value.trim().toLowerCase();
    if (typeof (raw as any).name === "string") return (raw as any).name.trim().toLowerCase();
    // If it's a Timestamp or other object, convert to string safely
    try {
      return String(raw).trim().toLowerCase();
    } catch {
      return "placed";
    }
  }

  // numbers / booleans -> convert
  return String(raw).trim().toLowerCase();
}

export default function OrderTimeline({ orderId }: { orderId: string }) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (!orderId) return;

    const ref = doc(db, "orders", orderId);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        console.warn("OrderTimeline: order doc missing:", orderId);
        setCurrentIndex(0);
        return;
      }

      const data = snap.data();
      const rawStatus = data?.status;

      // Debug: log the raw status + its type so you can inspect what's stored in Firestore
      console.debug("OrderTimeline - raw status:", rawStatus, "typeof:", typeof rawStatus);

      const status = normalizeStatus(rawStatus);
      const idx = steps.findIndex((s) => s.key === status);

      if (idx >= 0) setCurrentIndex(idx);
      else {
        // unknown status: keep previous or set to 0
        console.warn(`OrderTimeline: unknown status "${status}" for order ${orderId}`);
        setCurrentIndex(0);
      }
    });

    return () => unsub();
  }, [orderId]);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md">
      <h2 className="text-lg font-semibold mb-4">Order Tracking</h2>
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-2 ${isCompleted ? "text-green-600" : "text-gray-400"}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  isCompleted ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
