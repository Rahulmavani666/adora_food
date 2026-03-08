"use client";
import {
  ShoppingCart, X, Trash2, ShoppingBag, CreditCard, Shield,
  Banknote, Smartphone, Zap, MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { usePayment } from "@/hooks/usePayment";
import { orderService } from "@/lib/firebase-services";
import { PLATFORM_FEE_RATE } from "@/lib/types";
import type { PaymentInfo, PaymentMethod } from "@/lib/types";
import { toast } from "sonner";

interface CartDrawerProps {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
}

const DELIVERY_FEE = 0; // Free delivery for surplus — can be changed later

export default function CartDrawer({ clientId, clientName, clientPhone, clientAddress }: CartDrawerProps) {
  const { items, removeItem, clearCart, cartCount, cartTotal, groupedByRestaurant } = useCart();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const { initiatePayment, paying, isDemoMode } = usePayment();

  // Payment method selection
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("upi");
  const [orderNotes, setOrderNotes] = useState("");

  const platformFee = Math.round(cartTotal * PLATFORM_FEE_RATE * 100) / 100;
  const grandTotal = Math.round((cartTotal + platformFee + DELIVERY_FEE) * 100) / 100;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setChecking(true);
    try {
      let payment: PaymentInfo;

      if (selectedPayment === "cod") {
        // Cash on Delivery — no online payment needed
        payment = { method: "cod", status: "pending" };
      } else {
        // UPI or Razorpay — go through payment gateway
        const paymentResult = await initiatePayment({
          amount: grandTotal,
          customerName: clientName,
          customerPhone: clientPhone,
          description: `Adora Cart — ${cartCount} item(s)`,
          receipt: `cart_${Date.now()}`,
        });

        if (!paymentResult.success) {
          if (paymentResult.error !== "Payment cancelled by user") {
            toast.error(paymentResult.error || "Payment failed");
          }
          return;
        }

        payment = {
          method: selectedPayment === "upi" ? "upi" : "razorpay",
          status: "paid",
          razorpayOrderId: paymentResult.razorpayOrderId,
          razorpayPaymentId: paymentResult.razorpayPaymentId,
          razorpaySignature: paymentResult.razorpaySignature,
          paidAt: new Date().toISOString(),
        };
      }

      // Create one order per restaurant
      const restaurantGroups = Object.entries(groupedByRestaurant);
      for (const [restaurantId, group] of restaurantGroups) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const orderItems = group.items.map(({ restaurantId: _rid, restaurantName: _rn, ...rest }) => rest);
        await orderService.createOrder({
          clientId,
          clientName,
          clientPhone,
          clientAddress,
          restaurantId,
          restaurantName: group.restaurantName,
          items: orderItems,
          ...(orderNotes.trim() && { notes: orderNotes.trim() }),
          payment,
        });
      }

      toast.success(
        selectedPayment === "cod"
          ? `${restaurantGroups.length} order${restaurantGroups.length > 1 ? "s" : ""} placed! Pay on delivery.`
          : `Payment successful! ${restaurantGroups.length} order${restaurantGroups.length > 1 ? "s" : ""} placed!`
      );
      clearCart();
      setOrderNotes("");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order(s).");
    } finally {
      setChecking(false);
    }
  };

  const paymentOptions: { method: PaymentMethod; label: string; desc: string; icon: typeof CreditCard; color: string; badge?: string }[] = [
    { method: "upi", label: "UPI", desc: "GPay, PhonePe, Paytm", icon: Smartphone, color: "violet", badge: "Instant" },
    { method: "razorpay", label: "Card", desc: "Credit / Debit Card", icon: CreditCard, color: "blue" },
    { method: "cod", label: "Cash", desc: "Pay on Delivery", icon: Banknote, color: "emerald" },
  ];

  return (
    <>
      {/* ── Floating cart button (Zomato-style) ── */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 shadow-2xl transition-all duration-300 ${
          cartCount > 0
            ? "bg-violet-600 hover:bg-violet-500 shadow-violet-900/40 scale-100"
            : "bg-gray-800 hover:bg-gray-700 shadow-gray-900/40"
        }`}
      >
        <ShoppingCart size={18} />
        <span className="text-sm font-bold">Cart</span>
        {cartCount > 0 && (
          <>
            <span className="w-px h-4 bg-white/20" />
            <span className="text-sm font-bold">{cartCount} item{cartCount > 1 ? "s" : ""}</span>
            <span className="text-sm font-bold text-violet-200">₹{grandTotal.toFixed(0)}</span>
          </>
        )}
      </button>

      {/* ── Drawer overlay ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-950 border-l border-gray-800/50 h-full flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800/50">
              <h3 className="font-bold text-lg flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                  <ShoppingBag size={16} className="text-violet-400" />
                </div>
                Your Cart
                <span className="text-sm font-normal text-gray-500">({cartCount})</span>
              </h3>
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 transition">
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartCount === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="w-20 h-20 rounded-2xl bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart size={32} className="opacity-30" />
                  </div>
                  <p className="font-medium text-gray-400">Your cart is empty</p>
                  <p className="text-xs text-gray-600 mt-1">Add surplus food items to get started</p>
                </div>
              ) : (
                Object.entries(groupedByRestaurant).map(([rid, group]) => (
                  <div key={rid} className="rounded-xl border border-gray-800/50 bg-gray-900/50 overflow-hidden">
                    {/* Restaurant header */}
                    <div className="px-4 py-3 border-b border-gray-800/50 bg-gray-900/80">
                      <p className="text-sm font-semibold text-gray-200">{group.restaurantName}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{group.items.length} item{group.items.length > 1 ? "s" : ""}</p>
                    </div>
                    {/* Items */}
                    <div className="divide-y divide-gray-800/50">
                      {group.items.map((item) => (
                        <div key={item.listingId} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">{item.foodType}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.quantity} {item.unit} × <span className="text-emerald-400">₹{item.surplusPrice}</span>
                              <span className="ml-1 line-through text-gray-600">₹{item.originalPrice}</span>
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-gray-200 shrink-0">₹{item.itemTotal.toFixed(0)}</span>
                          <button
                            onClick={() => removeItem(item.listingId)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Footer with payment + checkout ── */}
            {cartCount > 0 && (
              <div className="border-t border-gray-800/50 bg-gray-900/50">
                {/* Payment method selector */}
                <div className="px-5 pt-4 pb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment Method</p>
                  <div className="flex gap-2">
                    {paymentOptions.map((opt) => {
                      const isSelected = selectedPayment === opt.method;
                      return (
                        <button
                          key={opt.method}
                          onClick={() => setSelectedPayment(opt.method)}
                          className={`flex-1 p-3 rounded-xl border transition-all duration-200 text-center ${
                            isSelected
                              ? "border-violet-500 bg-violet-600/15 ring-1 ring-violet-500/30"
                              : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                          }`}
                        >
                          <opt.icon
                            size={18}
                            className={`mx-auto mb-1.5 ${isSelected ? "text-violet-400" : "text-gray-500"}`}
                          />
                          <p className={`text-xs font-bold ${isSelected ? "text-violet-300" : "text-gray-400"}`}>
                            {opt.label}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{opt.desc}</p>
                          {opt.badge && isSelected && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-400 font-medium mt-1">
                              <Zap size={8} /> {opt.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Order notes */}
                <div className="px-5 pt-3 pb-1">
                  <button
                    onClick={() => document.getElementById('order-notes-input')?.focus()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
                  >
                    <MessageSquare size={12} /> Special Instructions
                  </button>
                  <textarea
                    id="order-notes-input"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="E.g. No plastic cutlery, extra napkins, ring doorbell…"
                    maxLength={200}
                    rows={2}
                    className="w-full rounded-xl border border-gray-800 bg-gray-900/50 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none resize-none transition"
                  />
                  <p className="text-[10px] text-gray-600 text-right mt-1">{orderNotes.length}/200</p>
                </div>

                {/* Bill details */}
                <div className="px-5 py-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill Details</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Item Total</span>
                    <span className="text-gray-200">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Platform Fee (5%)</span>
                    <span className="text-gray-200">₹{platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Delivery Fee</span>
                    <span className="text-emerald-400 font-medium">{DELIVERY_FEE === 0 ? "FREE" : `₹${DELIVERY_FEE}`}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-800/50">
                    <span className="text-white">To Pay</span>
                    <span className="text-emerald-400">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout buttons */}
                <div className="px-5 pb-5 pt-2 flex gap-2">
                  <button
                    onClick={clearCart}
                    className="rounded-xl border border-gray-700 px-4 py-3 text-sm text-gray-400 hover:bg-white/5 transition font-medium"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={checking || paying}
                    className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-3 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition shadow-lg shadow-violet-900/30"
                  >
                    {checking || paying ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {paying ? "Processing…" : "Placing…"}
                      </span>
                    ) : (
                      <>
                        {selectedPayment === "cod" ? (
                          <>
                            <Banknote size={16} />
                            Place Order — ₹{grandTotal.toFixed(0)}
                          </>
                        ) : (
                          <>
                            <CreditCard size={16} />
                            Pay ₹{grandTotal.toFixed(0)}
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>

                {isDemoMode && (
                  <p className="text-[10px] text-center text-yellow-500/70 flex items-center justify-center gap-1 pb-4">
                    <Shield size={10} /> Demo mode — no real charges
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
