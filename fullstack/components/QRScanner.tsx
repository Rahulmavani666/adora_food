"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Camera, CameraOff, ScanLine } from "lucide-react";

interface QRScannerProps {
  /** Callback when a valid ADORA-VERIFY QR code is scanned */
  onScan: (orderId: string, otp: string) => void;
  onClose: () => void;
}

/**
 * QR Scanner component using html5-qrcode.
 * Parses the ADORA-VERIFY:<orderId>:<otp> format.
 */
export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const containerId = "adora-qr-reader";

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {
      // ignore cleanup errors
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const html5Qrcode = new Html5Qrcode(containerId);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (!mounted || scanned) return;
            // Parse ADORA-VERIFY:<orderId>:<otp>
            const match = decodedText.match(/^ADORA-VERIFY:(.+):(\d{6})$/);
            if (match) {
              setScanned(true);
              const [, orderId, otp] = match;
              onScan(orderId, otp);
            } else {
              setError("Invalid QR code. Please scan the order verification QR.");
              setTimeout(() => setError(null), 3000);
            }
          },
          () => {
            // Ignore scan failures (no QR detected yet)
          }
        );

        if (mounted) setScanning(true);
      } catch (err: any) {
        if (mounted) {
          setError(
            err?.message?.includes("NotAllowedError") || err?.message?.includes("Permission")
              ? "Camera permission denied. Please allow camera access."
              : "Could not start camera. Try again or enter OTP manually."
          );
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Scanner viewport */}
      <div className="relative w-full max-w-[280px] aspect-square rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
        <div id={containerId} className="w-full h-full" />

        {/* Scanning overlay */}
        {scanning && !scanned && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner markers */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-violet-400 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-violet-400 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-violet-400 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-violet-400 rounded-br-lg" />
            {/* Scan line animation */}
            <div className="absolute left-4 right-4 h-0.5 bg-violet-400/80 animate-pulse top-1/2" />
          </div>
        )}

        {/* Success overlay */}
        {scanned && (
          <div className="absolute inset-0 bg-emerald-900/80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-emerald-300 font-semibold text-sm">QR Code Scanned!</p>
            </div>
          </div>
        )}
      </div>

      {/* Status text */}
      {scanning && !scanned && !error && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Camera size={12} className="text-violet-400" />
          Point camera at the client&apos;s QR code
        </p>
      )}

      {error && (
        <p className="text-xs text-rose-400 text-center max-w-[260px]">
          {error}
        </p>
      )}

      {/* Cancel button */}
      <button
        onClick={() => {
          stopScanner();
          onClose();
        }}
        className="text-xs text-gray-400 hover:text-gray-200 transition underline"
      >
        Cancel scanning
      </button>
    </div>
  );
}
