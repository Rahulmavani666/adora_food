// hooks/useAvailableListings.ts
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useAvailableListings() {
  const [listings, setListings] = useState<any[]>([]);
  useEffect(() => {
    const now = new Date();
    const q = query(
      collection(db, "listings"),
      where("status", "in", ["available", "reserved"]), // show reserved to indicate “almost gone”
      orderBy("dateAdded", "desc")
    );
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // client-side guard for availability window
      setListings(data.filter((l: any) =>
        l.availability?.start?.toDate() <= now &&
        l.availability?.end?.toDate() >= now
      ));
    });
  }, []);
  return listings;
}
