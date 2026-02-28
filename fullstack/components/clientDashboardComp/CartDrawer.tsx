"use client";
import { ShoppingCart, X, Trash2, ShoppingBag, CreditCard, Shield } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { usePayment } from "@/hooks/usePayment";
import { orderService } from "@/lib/firebase-services";
import { PLATFORM_FEE_RATE } from "@/lib/types";
import type { PaymentInfo } from "@/lib/types";
import { toast } from "sonner";

interface CartDrawerProps {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
}

export default function CartDrawer({ clientId, clientName, clientPhone, clientAddress }: CartDrawerProps) {
  const { items, removeItem, clearCart, cartCount, cartTotal, groupedByRestaurant } = useCart();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const { initiatePayment, paying, isDemoMode } = usePayment();

  const platformFee = Math.round(cartTotal * PLATFORM_FEE_RATE * 100) / 100;
  const grandTotal = Math.round((cartTotal + platformFee) * 100) / 100;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setChecking(true);
    try {
      // ── Initiate payment for the full cart total ──
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

      const payment: PaymentInfo = {
        method: 'razorpay',
        status: 'paid',
        razorpayOrderId: paymentResult.razorpayOrderId,
        razorpayPaymentId: paymentResult.razorpayPaymentId,
        razorpaySignature: paymentResult.razorpaySignature,
        paidAt: new Date().toISOString(),
      };

      // Create one order per restaurant
      const restaurantGroups = Object.entries(groupedByRestaurant);
      for (const [restaurantId, group] of restaurantGroups) {
        const orderItems = group.items.map(({ restaurantId: _, restaurantName: __, ...rest }) => rest);
        await orderService.createOrder({
          clientId,
          clientName,
          clientPhone,
          clientAddress,
          restaurantId,
          restaurantName: group.restaurantName,
          items: orderItems,
          payment,
        });
      }
      toast.success(`Payment successful! ${restaurantGroups.length} order${restaurantGroups.length > 1 ? "s" : ""} placed!`);
      clearCart();
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order(s).");
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-violet-600 hover:bg-violet-700 px-5 py-3 shadow-xl shadow-violet-900/30 transition"
      >
        <ShoppingCart size={18} />
        <span className="text-sm font-semibold">Cart</span>
        {cartCount > 0 && (
          <span className="w-6 h-6 rounded-full bg-white text-violet-700 text-xs font-bold flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-800 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingBag size={18} className="text-violet-400" />
                Your Cart ({cartCount})
              </h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/5 text-gray-400">
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartCount === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Your cart is empty.</p>
                  <p className="text-xs text-gray-600 mt-1">Add items from the listings above.</p>
                </div>
              ) : (
                Object.entries(groupedByRestaurant).map(([rid, group]) => (
                  <div key={rid} className="rounded-lg border border-gray-800 p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{group.restaurantName}</p>
                    {group.items.map(item => (
                      <div key={item.listingId} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                        <div className="flex-1">
                          <p className="text-sm text-gray-200">{item.foodType}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} {item.unit} × <span className="text-emerald-400">₹{item.surplusPrice}</span>
                            <span className="ml-1 line-through text-gray-600">₹{item.originalPrice}</span>
                            <span className="ml-1 text-gray-300">= ₹{item.itemTotal.toFixed(2)}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.listingId)}
                          className="p-1.5 rounded hover:bg-white/5 text-gray-500 hover:text-rose-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartCount > 0 && (
              <div className="p-5 border-t border-gray-800 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-gray-200">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Platform Fee (5%)</span>
                  <span className="text-gray-200">₹{platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-200">Total</span>
                  <span className="text-emerald-400">₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={checking || paying}
                    className="flex-1 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {checking || paying ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {paying ? "Processing..." : "Placing..."}
                      </span>
                    ) : (
                      <>
                        <CreditCard size={14} />
                        {`Pay ₹${grandTotal.toFixed(2)}`}
                      </>
                    )}
                  </button>
                </div>
                {isDemoMode && (
                  <p className="text-[10px] text-center text-yellow-500/70 flex items-center justify-center gap-1 mt-1">
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
