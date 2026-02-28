"use client";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useClientOrders(clientId: string) {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    if (!clientId) return;
    const q = query(collection(db, "orders"), where("clientId", "==", clientId));
    return onSnapshot(q, snap => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [clientId]);
  return orders;
}
