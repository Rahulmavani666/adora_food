// hooks/useListings.ts
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "listings"),
      where("status", "==", "available"), // show only available food
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setListings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { listings, loading };
}
