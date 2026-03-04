// components/ClientOrders.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { orderService, listingService, reviewService } from "@/lib/firebase-services";
import type { Order, OrderStatus, OrderItem } from "@/lib/types";
import { ORDER_STATUS_FLOW } from "@/lib/types";
import { CheckCircle2, Circle, RotateCcw, Clock, XCircle, Star, MessageCircle, CreditCard, Banknote, Smartphone } from "lucide-react";
import TrackingSection from "./Tracking";
import ReviewModal from "./ReviewModal";
import { QRCodeInline } from "@/components/QRCodeDisplay";
import OrderChat, { ChatButton } from "@/components/OrderChat";
import { toast } from "sonner";

function stepIndex(status: OrderStatus): number {
  return ORDER_STATUS_FLOW.indexOf(status);
}

export default function ClientOrders({ clientId }: { clientId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"active" | "history">("active");
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    const unsub = orderService.subscribeToClientOrders(clientId, setOrders);
    return () => unsub();
  }, [clientId]);

  // Check which completed orders have already been reviewed
  useEffect(() => {
    const completedOrders = orders.filter(o => o.status === "completed");
    if (completedOrders.length === 0) return;
    Promise.all(
      completedOrders.map(async (o) => {
        const reviewed = await reviewService.hasReviewed(o.id);
        return reviewed ? o.id : null;
      })
    ).then((ids) => {
      setReviewedOrderIds(new Set(ids.filter(Boolean) as string[]));
    });
  }, [orders]);

  const activeOrders = orders.filter(o => ["placed", "accepted", "preparing", "ready", "out_for_delivery"].includes(o.status));
  const historyOrders = orders.filter(o => ["completed", "rejected", "cancelled"].includes(o.status));
  const displayOrders = tab === "active" ? activeOrders : historyOrders;

  // Cancel order (only within 2 mins of placing)
  async function handleCancel(order: Order) {
    setCancellingId(order.id);
    try {
      await orderService.updateOrderStatus(order.id, "cancelled", order);
      toast.success("Order cancelled.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel order.");
    } finally {
      setCancellingId(null);
    }
  }

  // Reorder — create a new order with the same items
  async function handleReorder(order: Order) {
    setReorderingId(order.id);
    try {
      await orderService.createOrder({
        clientId: order.clientId,
        clientName: order.clientName,
        clientPhone: order.clientPhone,
        clientAddress: order.clientAddress,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
        items: order.items,
      });
      toast.success("Reorder placed successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reorder. The items may no longer be available.");
    } finally {
      setReorderingId(null);
    }
  }

  // Can cancel within 2 minutes of placing
  function canCancel(order: Order): boolean {
    if (order.status !== "placed") return false;
    const ts = order.createdAt as any;
    const created = ts?.toMillis?.() ?? (ts?.seconds ? ts.seconds * 1000 : 0);
    return Date.now() - created < 2 * 60 * 1000;
  }

  return (
    <div className="space-y-6">
      {/* Tab header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-100">Your Orders</h2>
        <div className="flex rounded-lg bg-gray-800 border border-gray-700 p-0.5">
          <button
            onClick={() => setTab("active")}
            className={`px-4 py-1.5 text-sm rounded-md transition ${tab === "active" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-1.5 text-sm rounded-md transition ${tab === "history" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            History ({historyOrders.length})
          </button>
        </div>
      </div>
      
      {displayOrders.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          {tab === "active" ? "No active orders." : "No order history yet. Claim some surplus food to get started!"}
        </p>
      )}
      
      {displayOrders.map((order) => {
        const currentStep = stepIndex(order.status);
        const isReordering = reorderingId === order.id;
        const isCancelling = cancellingId === order.id;
        const clientName = order.clientName || "Client";
        return (
          <div key={order.id} className="space-y-4">
            <Card className="shadow-md bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-gray-100">Order #{order.id.slice(0, 6)}</CardTitle>
                  <Badge variant={order.status === "completed" ? "default" : order.status === "rejected" || order.status === "cancelled" ? "destructive" : "secondary"}>
                    {order.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {order.restaurantName}
                </p>
              </CardHeader>
              <CardContent>
                {/* Timeline / Stepper — only for active */}
                {tab === "active" && (
                  <div className="flex items-center justify-between mb-4">
                    {ORDER_STATUS_FLOW.map((step, i) => (
                      <div key={step} className="flex flex-col items-center flex-1">
                        {i <= currentStep ? (
                          <CheckCircle2 className="text-violet-400 w-5 h-5" />
                        ) : (
                          <Circle className="text-gray-600 w-5 h-5" />
                        )}
                        <span className={`text-xs mt-1 text-center ${i <= currentStep ? "text-violet-300" : "text-gray-500"}`}>
                          {step.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Order Details */}
                <div className="text-sm text-gray-300 space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="text-gray-400 flex items-center gap-2 flex-wrap">
                      <span>{item.foodType} × {item.quantity} {item.unit}</span>
                      <span className="text-emerald-400">₹{item.surplusPrice}/{item.unit}</span>
                      <span className="text-gray-600 line-through text-xs">₹{item.originalPrice}</span>
                      <span className="text-gray-300">= ₹{item.itemTotal.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-800">
                    <p><span className="text-gray-500">Subtotal:</span> <span className="text-gray-300">₹{order.subtotal?.toFixed(2)}</span></p>
                    <p><span className="text-gray-500">Fee (5%):</span> <span className="text-gray-300">₹{order.platformFees?.clientFee?.toFixed(2)}</span></p>
                    <p><span className="text-gray-500">You Paid:</span> <span className="text-emerald-400 font-semibold">₹{order.clientTotal?.toFixed(2)}</span></p>
                    {/* Payment badge */}
                    {order.payment ? (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        order.payment.status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : order.payment.status === 'refunded'
                          ? 'bg-yellow-500/15 text-yellow-400'
                          : order.payment.status === 'failed'
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {order.payment.method === 'upi' ? (
                          <><Smartphone size={10} /> {order.payment.status === 'paid' ? 'Paid via UPI' : 'UPI — ' + order.payment.status}</>
                        ) : order.payment.method === 'cod' ? (
                          <><Banknote size={10} /> {order.payment.status === 'pending' ? 'Cash on Delivery' : 'COD — ' + order.payment.status}</>
                        ) : order.payment.method === 'razorpay' ? (
                          <><CreditCard size={10} /> {order.payment.status === 'paid' ? 'Paid Online' : order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1)}</>
                        ) : (
                          <><CreditCard size={10} /> {order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1)}</>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-gray-500/15 text-gray-400">
                        <Banknote size={10} /> Pay on Pickup
                      </span>
                    )}
                    {order.otp && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500">OTP:</span>
                        <span className="text-violet-300 font-mono font-bold">{order.otp}</span>
                        <QRCodeInline orderId={order.id} otp={order.otp} />
                      </div>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs">
                    {order.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                  </p>
                  {order.deliveryProofUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Delivery Proof:</p>
                      <img
                        src={order.deliveryProofUrl}
                        alt="Delivery proof"
                        className="h-24 w-auto rounded-lg border border-gray-700 object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                  {/* Chat button — active orders only */}
                  {["placed", "accepted", "preparing", "ready", "out_for_delivery"].includes(order.status) && (
                    <ChatButton
                      orderId={order.id}
                      myRole="client"
                      onClick={() => setChatOrderId(order.id)}
                    />
                  )}
                  {/* Cancel button — active orders within 2 min */}
                  {canCancel(order) && (
                    <button
                      onClick={() => handleCancel(order)}
                      disabled={isCancelling}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-700/40 bg-rose-600/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-600/20 transition disabled:opacity-50"
                    >
                      <XCircle size={13} />
                      {isCancelling ? "Cancelling..." : "Cancel Order"}
                    </button>
                  )}
                  {/* Reorder button — completed/rejected/cancelled orders */}
                  {["completed", "rejected", "cancelled"].includes(order.status) && (
                    <button
                      onClick={() => handleReorder(order)}
                      disabled={isReordering}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-violet-700/40 bg-violet-600/10 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-600/20 transition disabled:opacity-50"
                    >
                      <RotateCcw size={13} />
                      {isReordering ? "Reordering..." : "Reorder"}
                    </button>
                  )}
                  {/* Rate button — completed orders, not yet reviewed */}
                  {order.status === "completed" && !reviewedOrderIds.has(order.id) && (
                    <button
                      onClick={() => setReviewOrder(order)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-700/40 bg-amber-600/10 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-600/20 transition"
                    >
                      <Star size={13} />
                      Rate Order
                    </button>
                  )}
                  {order.status === "completed" && reviewedOrderIds.has(order.id) && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 size={13} />
                      Reviewed
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tracking Section for active orders */}
            {!["completed", "rejected", "cancelled"].includes(order.status) && (
              <TrackingSection orderId={order.id} />
            )}
          </div>
        );
      })}

      {/* Review Modal */}
      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          clientId={clientId}
          clientName={reviewOrder.clientName || "Client"}
          onClose={() => {
            setReviewedOrderIds(prev => new Set(prev).add(reviewOrder.id));
            setReviewOrder(null);
          }}
        />
      )}

      {/* Order Chat Drawer */}
      {chatOrderId && (() => {
        const chatOrder = orders.find(o => o.id === chatOrderId);
        if (!chatOrder) return null;
        return (
          <OrderChat
            orderId={chatOrder.id}
            orderLabel={`Order #${chatOrder.id.slice(0, 6)}`}
            senderId={clientId}
            senderRole="client"
            senderName={chatOrder.clientName || "Client"}
            otherName={chatOrder.restaurantName}
            open={true}
            onClose={() => setChatOrderId(null)}
          />
        );
      })()}
    </div>
  );
}
