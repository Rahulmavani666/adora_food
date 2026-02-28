"use client";
import { useCallback, useRef, useState } from "react";

// Razorpay types for the checkout response
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface PaymentOptions {
  amount: number;           // in ₹ (not paise)
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  receipt?: string;
}

interface PaymentResult {
  success: boolean;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  error?: string;
}

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function usePayment() {
  const [paying, setPaying] = useState(false);
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

  // Use ref to track if demo mode should be used (no key configured)
  const isDemoMode = !razorpayKeyId || razorpayKeyId === "rzp_test_YOUR_KEY_ID";

  const initiatePayment = useCallback(
    async (options: PaymentOptions): Promise<PaymentResult> => {
      setPaying(true);

      try {
        // ── Demo mode: simulate payment when no keys configured ──
        if (isDemoMode) {
          // Simulate a short delay
          await new Promise((r) => setTimeout(r, 1200));
          const demoId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          return {
            success: true,
            razorpayOrderId: `order_demo_${demoId}`,
            razorpayPaymentId: `pay_demo_${demoId}`,
            razorpaySignature: "demo_signature",
          };
        }

        // ── Load Razorpay checkout script ──
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          return { success: false, error: "Failed to load Razorpay. Check your internet connection." };
        }

        // ── Step 1: Create Razorpay order on the server ──
        const res = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: options.amount,
            receipt: options.receipt || `rcpt_${Date.now()}`,
            notes: { description: options.description || "Adora Food Order" },
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          return { success: false, error: data.error || "Failed to create payment order" };
        }

        const { orderId: razorpayOrderId } = await res.json();

        // ── Step 2: Open Razorpay checkout modal ──
        return new Promise<PaymentResult>((resolve) => {
          const rzp = new window.Razorpay({
            key: razorpayKeyId,
            order_id: razorpayOrderId,
            amount: Math.round(options.amount * 100),
            currency: "INR",
            name: "Adora",
            description: options.description || "Food Order Payment",
            image: "/icons/icon-192x192.png",
            prefill: {
              name: options.customerName,
              email: options.customerEmail || "",
              contact: options.customerPhone || "",
            },
            theme: { color: "#7c3aed" }, // violet-600
            handler: async (response: RazorpayResponse) => {
              // ── Step 3: Verify payment on server ──
              try {
                const verifyRes = await fetch("/api/payment/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(response),
                });

                if (!verifyRes.ok) {
                  resolve({ success: false, error: "Payment verification failed" });
                  return;
                }

                resolve({
                  success: true,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
              } catch {
                resolve({ success: false, error: "Payment verification failed" });
              }
            },
            modal: {
              ondismiss: () => {
                resolve({ success: false, error: "Payment cancelled by user" });
              },
            },
          });

          rzp.on("payment.failed", (resp: any) => {
            resolve({
              success: false,
              error: resp.error?.description || "Payment failed",
            });
          });

          rzp.open();
        });
      } catch (error: any) {
        return { success: false, error: error.message || "Payment error" };
      } finally {
        setPaying(false);
      }
    },
    [isDemoMode, razorpayKeyId]
  );

  return { initiatePayment, paying, isDemoMode };
}
