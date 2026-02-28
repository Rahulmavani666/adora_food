// // hooks/useRestaurantListings.ts
// import { db } from "@/lib/firebase";
// import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
// import { useEffect, useState } from "react";

// export function useRestaurantListings(restaurantId: string) {
//   const [listings, setListings] = useState<any[]>([]);
//   useEffect(() => {
//     if (!restaurantId) return;
//     const q = query(
//       collection(db, "listings"),
//       where("restaurantId", "==", restaurantId),
//       orderBy("dateAdded", "desc")
//     );
//     return onSnapshot(q, (snap) => {
//       setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
//     });
//   }, [restaurantId]);
//   return listings;
// }

// hooks/useRestaurantListings.ts
// import { useEffect, useState } from "react";
// import { db } from "@/lib/firebase";
// import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

// interface Listing {
//   id: string;
//   title: string;
//   description: string;
//   price: number;
//   status: string;
//   createdAt: any;
//   restaurantId: string;
// }

// export function useRestaurantListings(restaurantId: string | null) {
//   const [listings, setListings] = useState<Listing[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!restaurantId) return;

//     const q = query(
//       collection(db, "listing"),
//       where("restaurantId", "==", restaurantId),
//       orderBy("createdAt", "desc")
//     );

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const data = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       })) as Listing[];

//       setListings(data);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [restaurantId]);

//   return { listings, loading };
// }



// hooks/useRestaurantListings.ts
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

interface Listing {
  id: string;
  foodType: string;
  freshnessStatus: string;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
  status: string;
  storageCondition: string;
  dateAdded: any;
  lastUpdated: any;
  availability?: {
    start: string | null;
    end: string | null;
  };
}

export function useRestaurantListings(restaurantId: string | null) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const q = query(
      collection(db, "listing"),
      where("restaurantId", "==", restaurantId),
      orderBy("dateAdded", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Listing[];

      setListings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  return { listings, loading };
}
