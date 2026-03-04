"use client";
import { useCallback, useState } from "react";

// Razorpay types for the checkout response
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface PaymentOptions {
  amount: number; // in ₹ (not paise)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const isDemoMode = !razorpayKeyId || razorpayKeyId === "rzp_test_YOUR_KEY_ID";

  const initiatePayment = useCallback(
    async (options: PaymentOptions): Promise<PaymentResult> => {
      setPaying(true);

      try {
        // ── Load Razorpay checkout script ──
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          return {
            success: false,
            error: "Failed to load Razorpay SDK. Check your internet.",
          };
        }

        // ── Step 1: Create order on server ──
        const res = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: options.amount,
            receipt: options.receipt || `rcpt_${Date.now()}`,
            notes: { description: options.description || "Adora Food Order" },
          }),
        });

        const orderData = await res.json();

        if (!res.ok) {
          console.error("[Payment] create-order failed:", orderData);
          return {
            success: false,
            error: orderData.error || "Failed to create payment order",
          };
        }

        const razorpayOrderId = orderData.orderId;
        const amountInPaise = orderData.amount; // server already converted

        // ── Step 2: Open Razorpay checkout ──
        return new Promise<PaymentResult>((resolve) => {
          const rzp = new window.Razorpay({
            key: razorpayKeyId,
            order_id: razorpayOrderId,
            amount: amountInPaise,
            currency: "INR",
            name: "Adora Food",
            description: options.description || "Food Order Payment",
            prefill: {
              name: options.customerName || "",
              email: options.customerEmail || "",
              contact: options.customerPhone || "",
            },
            theme: { color: "#7c3aed" },
            handler: async (response: RazorpayResponse) => {
              // ── Step 3: Verify signature on server ──
              try {
                const verifyRes = await fetch("/api/payment/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(response),
                });

                if (!verifyRes.ok) {
                  const vData = await verifyRes.json();
                  console.error("[Payment] Verification failed:", vData);
                  resolve({
                    success: false,
                    error: vData.error || "Payment verification failed",
                  });
                  return;
                }

                resolve({
                  success: true,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
              } catch (err) {
                console.error("[Payment] Verify network error:", err);
                resolve({
                  success: false,
                  error: "Payment verification failed",
                });
              }
            },
            modal: {
              ondismiss: () => {
                resolve({
                  success: false,
                  error: "Payment cancelled by user",
                });
              },
              escape: true,
              confirm_close: true,
            },
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rzp.on("payment.failed", (resp: any) => {
            console.error("[Payment] payment.failed:", resp.error);
            resolve({
              success: false,
              error:
                resp.error?.description ||
                resp.error?.reason ||
                "Payment failed",
            });
          });

          rzp.open();
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("[Payment] Exception:", error);
        return { success: false, error: error.message || "Payment error" };
      } finally {
        setPaying(false);
      }
    },
    [razorpayKeyId]
  );

  return { initiatePayment, paying, isDemoMode };
}
