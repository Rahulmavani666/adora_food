// // hooks/useAuth.ts
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { UserRole } from "@/lib/types";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  orgName: string | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    orgName: null,
    loading: true,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          const data = snap.data();
          setState({
            user: firebaseUser,
            role: (data?.role as UserRole) || null,
            orgName: data?.orgName || null,
            loading: false,
          });
        } catch {
          setState({ user: firebaseUser, role: null, orgName: null, loading: false });
        }
      } else {
        setState({ user: null, role: null, orgName: null, loading: false });
      }
    });
    return () => unsub();
  }, []);

  return state;
}





// hooks/useAuth.ts
// import { useEffect, useState } from "react";
// import { onAuthStateChanged, User } from "firebase/auth";
// import { auth } from "@/lib/firebase";

// export function useAuth() {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
//       setUser(firebaseUser);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   return { user, loading };
// }
