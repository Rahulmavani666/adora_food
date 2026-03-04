"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Phone,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  ConfirmationResult,
} from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";

interface PhoneVerificationProps {
  userId: string;
}

export default function PhoneVerification({ userId }: PhoneVerificationProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null); // null = loading
  const [verifiedPhone, setVerifiedPhone] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState(0);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if user already has phone verified
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.phoneVerified && data.phoneNumber) {
            setIsVerified(true);
            setVerifiedPhone(data.phoneNumber);
          } else {
            setIsVerified(false);
          }
        } else {
          setIsVerified(false);
        }
      } catch {
        setIsVerified(false);
      }
    };
    checkVerification();
  }, [userId]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Cleanup recaptcha on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const setupRecaptcha = useCallback(() => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {
        // ignore
      }
      recaptchaVerifierRef.current = null;
    }

    if (!recaptchaContainerRef.current) return;

    recaptchaVerifierRef.current = new RecaptchaVerifier(
      auth,
      recaptchaContainerRef.current,
      {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved
        },
        "expired-callback": () => {
          toast.error("reCAPTCHA expired. Please try again.");
        },
      }
    );
  }, []);

  const sendOtp = async () => {
    const cleaned = phoneNumber.replace(/\s/g, "");
    if (!cleaned || cleaned.length < 10) {
      toast.error("Please enter a valid phone number with country code (e.g., +91XXXXXXXXXX)");
      return;
    }

    const formatted = cleaned.startsWith("+") ? cleaned : `+91${cleaned}`;

    try {
      setLoading(true);
      setupRecaptcha();

      if (!recaptchaVerifierRef.current) {
        toast.error("reCAPTCHA setup failed. Please refresh and try again.");
        return;
      }

      const result = await signInWithPhoneNumber(
        auth,
        formatted,
        recaptchaVerifierRef.current
      );
      setConfirmationResult(result);
      setStep("otp");
      setCountdown(60);
      toast.success(`OTP sent to ${formatted}`);
    } catch (err: unknown) {
      console.error("OTP send error:", err);
      const errCode = (err as { code?: string })?.code;
      if (errCode === "auth/too-many-requests") {
        toast.error("Too many requests. Please try again later.");
      } else if (errCode === "auth/invalid-phone-number") {
        toast.error("Invalid phone number. Please use format: +91XXXXXXXXXX");
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    if (!confirmationResult) {
      toast.error("Session expired. Please resend OTP.");
      return;
    }

    try {
      setLoading(true);

      // Verify the OTP
      const credential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        otpValue
      );

      // Link phone credential to existing account
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await linkWithCredential(currentUser, credential);
        } catch (linkErr: unknown) {
          // If already linked or credential conflict, just verify the OTP separately
          const linkCode = (linkErr as { code?: string })?.code;
          if (
            linkCode !== "auth/provider-already-linked" &&
            linkCode !== "auth/credential-already-in-use"
          ) {
            // Verify the OTP is correct by confirming it
            await confirmationResult.confirm(otpValue);
          }
        }
      } else {
        await confirmationResult.confirm(otpValue);
      }

      const formatted = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+91${phoneNumber.replace(/\s/g, "")}`;

      // Update Firestore
      await updateDoc(doc(db, "users", userId), {
        phoneVerified: true,
        phoneNumber: formatted,
        phoneVerifiedAt: new Date().toISOString(),
      });

      setIsVerified(true);
      setVerifiedPhone(formatted);
      setModalOpen(false);
      toast.success("Phone number verified successfully!");
    } catch (err: unknown) {
      console.error("OTP verification error:", err);
      const errCode = (err as { code?: string })?.code;
      if (errCode === "auth/invalid-verification-code") {
        toast.error("Invalid OTP. Please try again.");
      } else if (errCode === "auth/code-expired") {
        toast.error("OTP expired. Please resend.");
      } else {
        toast.error("Verification failed. Please try again.");
      }
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

    // Auto-focus next input
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
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
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
    setStep("phone");
    setOtp(["", "", "", "", "", ""]);
    setConfirmationResult(null);
    setCountdown(0);
    setPhoneNumber("");
  };

  const openModal = () => {
    resetModal();
    setModalOpen(true);
  };

  // Still loading verification status
  if (isVerified === null) return null;

  return (
    <>
      {/* Sidebar badge / button */}
      {isVerified ? (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-600/10 border border-emerald-700/30">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-emerald-400 font-medium">Verified</p>
            <p className="text-[10px] text-gray-500 truncate">{verifiedPhone}</p>
          </div>
        </div>
      ) : (
        <button
          onClick={openModal}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-600/10 border border-amber-700/30 text-amber-400 hover:bg-amber-600/20 transition group"
        >
          <ShieldCheck size={14} className="shrink-0" />
          <span className="text-[11px] font-medium flex-1 text-left">Verify Phone</span>
          <ChevronRight
            size={12}
            className="text-amber-500/50 group-hover:text-amber-400 transition"
          />
        </button>
      )}

      {/* Recaptcha container (invisible) */}
      <div ref={recaptchaContainerRef} id="recaptcha-container" />

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-600/20">
                  <Phone size={18} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Phone Verification</h3>
                  <p className="text-[10px] text-gray-500">
                    {step === "phone"
                      ? "Enter your phone number"
                      : "Enter the OTP sent to your phone"}
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

            {step === "phone" ? (
              /* ----- Phone Number Step ----- */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Phone Number
                  </label>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden focus-within:border-violet-500 transition">
                    <span className="pl-3 text-sm text-gray-400">+91</span>
                    <input
                      type="tel"
                      placeholder="XXXXXXXXXX"
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhoneNumber(val);
                      }}
                      className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    We&apos;ll send a 6-digit OTP via SMS
                  </p>
                </div>

                <button
                  onClick={sendOtp}
                  disabled={loading || phoneNumber.length < 10}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium transition"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Phone size={16} />
                  )}
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            ) : (
              /* ----- OTP Step ----- */
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
                        ref={(el) => { otpRefs.current[i] = el; }}
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
                    OTP sent to +91{phoneNumber}
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

                {/* Resend + back */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      resetModal();
                    }}
                    className="text-xs text-gray-400 hover:text-white transition"
                  >
                    Change number
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
