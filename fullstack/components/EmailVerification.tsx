"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface EmailVerificationProps {
  userId: string;
}

export default function EmailVerification({ userId }: EmailVerificationProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if user already has email verified
  useEffect(() => {
    const check = async () => {
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.emailVerified && data.verifiedEmail) {
            setIsVerified(true);
            setVerifiedEmail(data.verifiedEmail);
          } else {
            setIsVerified(false);
            // Pre-fill with user's email if available
            if (data.email) setEmail(data.email);
          }
        } else {
          setIsVerified(false);
        }
      } catch {
        setIsVerified(false);
      }
    };
    check();
  }, [userId]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-focus first OTP input when switching to OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const sendOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send OTP");
        return;
      }

      setStep("otp");
      setCountdown(60);
      toast.success(`OTP sent to ${trimmed}`);
    } catch {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (step !== "otp") return;
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpValue, userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Verification failed");
        return;
      }

      // Update Firestore user doc client-side (user is authenticated here)
      await updateDoc(doc(db, "users", userId), {
        emailVerified: true,
        verifiedEmail: data.email || email,
        emailVerifiedAt: new Date().toISOString(),
      });

      setIsVerified(true);
      setVerifiedEmail(data.email || email);
      setModalOpen(false);
      toast.success("Email verified successfully!");
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      const focusIdx = Math.min(pasted.length, 5);
      otpRefs.current[focusIdx]?.focus();
    }
  };

  const resetModal = () => {
    setStep("email");
    setOtp(["", "", "", "", "", ""]);
    setCountdown(0);
  };

  const openModal = () => {
    resetModal();
    setModalOpen(true);
  };

  if (isVerified === null) return null;

  return (
    <>
      {/* Sidebar badge / button */}
      {isVerified ? (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-600/10 border border-emerald-700/30">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-emerald-400 font-medium">
              Email Verified
            </p>
            <p className="text-[10px] text-gray-500 truncate">
              {verifiedEmail}
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={openModal}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-600/10 border border-amber-700/30 text-amber-400 hover:bg-amber-600/20 transition group"
        >
          <ShieldCheck size={14} className="shrink-0" />
          <span className="text-[11px] font-medium flex-1 text-left">
            Verify Email
          </span>
          <ChevronRight
            size={12}
            className="text-amber-500/50 group-hover:text-amber-400 transition"
          />
        </button>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-600/20">
                  <Mail size={18} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Email Verification</h3>
                  <p className="text-[10px] text-gray-500">
                    {step === "email"
                      ? "We'll send a 6-digit code to your email"
                      : "Enter the code sent to your inbox"}
                  </p>
                </div>
              </div>
              <button
                className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {step === "email" ? (
              /* --- Email Step --- */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden focus-within:border-violet-500 transition">
                    <Mail size={14} className="ml-3 text-gray-400 shrink-0" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Check your inbox (and spam folder) for the OTP
                  </p>
                </div>

                <button
                  onClick={sendOtp}
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium transition"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Mail size={16} />
                  )}
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            ) : (
              /* --- OTP Step --- */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    Enter 6-digit OTP
                  </label>
                  <div
                    className="flex gap-2 justify-center"
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-10 h-12 rounded-lg bg-gray-800 border border-gray-700 text-center text-lg font-semibold outline-none focus:border-violet-500 transition"
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 text-center">
                    Code sent to {email}
                  </p>
                </div>

                <button
                  onClick={verifyOtp}
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium transition"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <div className="flex items-center justify-between">
                  <button
                    onClick={resetModal}
                    className="text-xs text-gray-400 hover:text-white transition"
                  >
                    Change email
                  </button>
                  <button
                    onClick={sendOtp}
                    disabled={countdown > 0 || loading}
                    className="text-xs text-violet-400 hover:text-violet-300 disabled:text-gray-600 disabled:cursor-not-allowed transition"
                  >
                    {countdown > 0
                      ? `Resend in ${countdown}s`
                      : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
