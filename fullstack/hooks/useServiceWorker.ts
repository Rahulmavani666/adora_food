"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("SW registered:", reg.scope);

        // Check for updates periodically
        setInterval(() => reg.update(), 60 * 60 * 1000); // every hour
      })
      .catch((err) => console.warn("SW registration failed:", err));
  }, []);
}
