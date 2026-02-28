"use client";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useRestaurantOrders(restaurantId: string) {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    if (!restaurantId) return;
    const q = query(collection(db, "orders"), where("restaurantId", "==", restaurantId));
    return onSnapshot(q, snap => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [restaurantId]);
  return orders;
}


