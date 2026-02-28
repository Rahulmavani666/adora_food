"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Eye, EyeOff } from "lucide-react";

interface QRCodeDisplayProps {
  orderId: string;
  otp: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Encodes order verification data into a QR code.
 * Format: ADORA-VERIFY:<orderId>:<otp>
 */
export default function QRCodeDisplay({ orderId, otp, size = "md" }: QRCodeDisplayProps) {
  const [showQR, setShowQR] = useState(false);

  const qrValue = `ADORA-VERIFY:${orderId}:${otp}`;
  const dims = size === "sm" ? 120 : size === "md" ? 160 : 200;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => setShowQR(!showQR)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-700/40 bg-violet-600/10 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-600/20 transition"
      >
        {showQR ? <EyeOff size={13} /> : <QrCode size={13} />}
        {showQR ? "Hide QR Code" : "Show QR Code"}
      </button>

      {showQR && (
        <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white shadow-lg animate-in fade-in duration-200">
          <QRCodeSVG
            value={qrValue}
            size={dims}
            bgColor="#ffffff"
            fgColor="#1a1a2e"
            level="H"
            includeMargin
          />
          <p className="text-[10px] text-gray-500 font-mono">
            Show this to the restaurant
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Inline compact QR badge — always visible, shows QR on tap.
 */
export function QRCodeInline({ orderId, otp }: { orderId: string; otp: string }) {
  const [showQR, setShowQR] = useState(false);
  const qrValue = `ADORA-VERIFY:${orderId}:${otp}`;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowQR(!showQR)}
        className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 transition"
        title="Show QR code for pickup verification"
      >
        <QrCode size={14} />
      </button>

      {showQR && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowQR(false)} />
          {/* QR Popover */}
          <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white shadow-2xl border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <QRCodeSVG
              value={qrValue}
              size={140}
              bgColor="#ffffff"
              fgColor="#1a1a2e"
              level="H"
              includeMargin
            />
            <p className="text-[10px] text-gray-500 font-mono whitespace-nowrap">
              Scan to verify pickup
            </p>
          </div>
        </>
      )}
    </div>
  );
}
