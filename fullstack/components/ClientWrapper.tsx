// components/ClientWrapper.tsx (client)
"use client";
import { useEffect } from "react";
import OfflineIndicator from "./OfflineIndicator";
import { useServiceWorker } from "@/hooks/useServiceWorker";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  useServiceWorker();

  useEffect(() => {
    console.log("Client-side effect works here!");
  }, []);

  return (
    <>
      <OfflineIndicator />
      {children}
    </>
  );
}
