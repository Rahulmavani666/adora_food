"use client";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    // Check initial state
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-rose-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 shadow-lg">
      <WifiOff size={16} />
      You&apos;re offline. Some features may not work.
    </div>
  );
}
