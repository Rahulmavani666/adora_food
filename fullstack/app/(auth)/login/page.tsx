"use client";

import { useState } from "react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const ParticlesBackground = dynamic(() => import("@/components/ParticlesBackground"), {
  ssr: false,
});

function getErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";
}




export default function LoginPage() {



  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");



  const handleSubmit = async (e: React.FormEvent) => {


    e.preventDefault();
    setError("");
    try {
      const [{ auth, db }, authModule, firestoreModule] = await Promise.all([
        import("@/lib/firebase"),
        import("firebase/auth"),
        import("firebase/firestore"),
      ]);

      // 1. Authenticate user
      const cred = await authModule.signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      // 2. Fetch user profile
      const userDoc = await firestoreModule.getDoc(
        firestoreModule.doc(db, "users", cred.user.uid)
      );
      if (!userDoc.exists()) {
        setError("User data not found");
        return;
      }

      const { role } = userDoc.data();

      // 3. Redirect based on role
      if (role === "client") router.push("/Clientdashboard");
      else if (role === "business") router.push("/restaurantdashboard");
    } catch {
      setError("Invalid credentials");
    }


  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const [{ auth, db }, authModule, firestoreModule] = await Promise.all([
        import("@/lib/firebase"),
        import("firebase/auth"),
        import("firebase/firestore"),
      ]);

      const provider = new authModule.GoogleAuthProvider();
      const cred = await authModule.signInWithPopup(auth, provider);

      // Check if user exists in Firestore
      const userRef = firestoreModule.doc(db, "users", cred.user.uid);
      const userDoc = await firestoreModule.getDoc(userRef);

      let role = "client"; // default role

      if (!userDoc.exists()) {
        // Create new user profile if it doesn't exist
        await firestoreModule.setDoc(userRef, {
          fullName: cred.user.displayName || "Google User",
          email: cred.user.email,
          photoURL: cred.user.photoURL || "",
          role: role,
          createdAt: firestoreModule.serverTimestamp(),
        });
      } else {
        role = userDoc.data().role;
        // Update photoURL if it changed (e.g. user updated their Google profile pic)
        if (cred.user.photoURL && cred.user.photoURL !== userDoc.data().photoURL) {
          await firestoreModule.setDoc(
            userRef,
            { photoURL: cred.user.photoURL },
            { merge: true }
          );
        }
      }

      // Redirect based on role
      if (role === "client") router.push("/Clientdashboard");
      else if (role === "business") router.push("/restaurantdashboard");
      else router.push("/Clientdashboard"); // Fallback

    } catch (error) {
      if (getErrorCode(error) === "auth/popup-closed-by-user") {
        console.log("Popup closed by user, login cancelled.");
        // We just ignore this error so the UI doesn't show "Failed to log in"
        return;
      }
      console.error("Google Login Error:", error);
      setError("Failed to log in with Google.");
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccessMsg("");
    if (!form.email) {
      setError("Please enter your email address first.");
      return;
    }

    try {
      const [{ auth }, authModule] = await Promise.all([
        import("@/lib/firebase"),
        import("firebase/auth"),
      ]);

      await authModule.sendPasswordResetEmail(auth, form.email);
      setSuccessMsg("Password reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Password Reset Error:", error);
      if (getErrorCode(error) === "auth/user-not-found") {
        setError("No user found with this email.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    }
  };

  return (
    <div id="login" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 relative">
      {/* Glow effect background */}
      <div className="absolute w-72 h-72 bg-purple-600 rounded-full blur-3xl opacity-30 top-10 left-10"></div>
      <div className="absolute w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-30 bottom-10 right-10"></div>
      <ParticlesBackground />
      {/* Card */}
      <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-lg p-8 z-10">
        {/* Logo */}

        {/* <div className="flex justify-center mb-6">
        </div> */}

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-white mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-gray-400 mb-6">
          Log in to your account to continue
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-red-400">{error}</p>}
          {successMsg && <p className="text-green-400">{successMsg}</p>}
          <div>
            <label className="text-gray-300 text-sm font-semibold">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full mt-2 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm font-semibold">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full mt-2 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Options */}
          <div className="flex justify-between items-center text-sm text-gray-400">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-purple-500" />
              Remember me
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-purple-400 hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition duration-300"
          >
            Log In
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-grow h-px bg-gray-700"></div>
          <span className="px-3 text-gray-400 text-sm">Or continue with</span>
          <div className="flex-grow h-px bg-gray-700"></div>
        </div>

        {/* Social Logins */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 transition"
          >
            <FaGoogle /> Google
          </button>
          <button type="button" onClick={() => { }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 transition">
            <FaGithub /> GitHub
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-400">
          Don’t have an account?{" "}
          <a href="/signup" className="text-purple-400 hover:underline">
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
}
