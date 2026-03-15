"use client";

import { useState } from "react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { signIn } from "next-auth/react"; // 
import dynamic from "next/dynamic";

const ParticlesBackground = dynamic(() => import("@/components/ParticlesBackground"), {
  ssr: false,
});


// -------
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";




export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("");

  // ------
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "client", // default
     orgName: "",
  });

  const [error, setError] = useState("");

  const redirectByRole = (role?: string) => {
    if (role === "client") router.push("/Clientdashboard");
    else if (role === "business") router.push("/restaurantdashboard");
    else router.push("/dashboard");
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      // 1. Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      // 2. Store extra info in Firestore
      await setDoc(doc(db, "users", cred.user.uid), {
        fullName: form.fullName,
        email: form.email,
        role: form.role, // client OR restaurant
        orgName: form.orgName,
        createdAt: serverTimestamp(),
      });

      // 3. Redirect to login page
      router.push("/login");

    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        try {
          const cred = await signInWithEmailAndPassword(
            auth,
            form.email,
            form.password
          );
          const userDoc = await getDoc(doc(db, "users", cred.user.uid));
          redirectByRole(userDoc.data()?.role);
          return;
        } catch {
          setError("Email already in use. Please log in.");
          return;
        }
      }
      setError("Something went wrong. Please try again.");
    }
  };


  return (
    <div
      id="signup"
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4"
    >
      <ParticlesBackground/>
      <div className="w-full max-w-md bg-black/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-8">
        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center">Create Account</h2>
        <p className="text-gray-400 text-center mb-6">Join us in fight against food waste</p>

        {/* Form */}
        <form  onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}

          {error && <p className="text-red-400">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-300">Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="mt-1 w-full rounded-xl bg-gray-800/70 border border-gray-700 
                         text-gray-200 placeholder-gray-500 focus:border-violet-500 
                         focus:ring-1 focus:ring-violet-500 px-4 py-3 outline-none"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-xl bg-gray-800/70 border border-gray-700 
                         text-gray-200 placeholder-gray-500 focus:border-violet-500 
                         focus:ring-1 focus:ring-violet-500 px-4 py-3 outline-none"
                         required           
            />
          </div>

          {/* User Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-300">I am signing up as</label>
            <select
              // value={userType}
              // onChange={(e) => setUserType(e.target.value)}

              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              
              className="mt-1 w-full rounded-xl bg-gray-800/70 border border-gray-700 
                         text-gray-200 focus:border-violet-500 focus:ring-1 
                         focus:ring-violet-500 px-4 py-3 outline-none"
            >
              <option value="">-- Select User Type --</option>
              <option value="client">Client (NGO, Volunteer, Delivery Boy)</option>
              <option value="business">Business (Restaurant, Canteen, Café, Bar)</option>
            </select>
          </div>

          {/* Conditional Fields */}
          {form.role === "client" && (
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Organization / Role
              </label>
              <input
                type="text"
                placeholder="e.g., NGO Name, Volunteer, Delivery Boy"
                value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                className="mt-1 w-full rounded-xl bg-gray-800/70 border border-gray-700 
                           text-gray-200 placeholder-gray-500 focus:border-violet-500 
                           focus:ring-1 focus:ring-violet-500 px-4 py-3 outline-none"
              />
            </div>
          )}

          {form.role === "business" && (
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Business Name
              </label>
              <input
                type="text"
                placeholder="e.g., My Café, Food Hub, XYZ Restaurant"
                value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                className="mt-1 w-full rounded-xl bg-gray-800/70 border border-gray-700 
                           text-gray-200 placeholder-gray-500 focus:border-violet-500 
                           focus:ring-1 focus:ring-violet-500 px-4 py-3 outline-none"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded-xl bg-gray-800/70 border border-gray-700 
                           text-gray-200 placeholder-gray-500 focus:border-violet-500 
                           focus:ring-1 focus:ring-violet-500 px-4 py-3 outline-none"
                           required
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              className="mt-1 w-full rounded-xl bg-gray-800/70 border border-gray-700 
                         text-gray-200 placeholder-gray-500 focus:border-violet-500 
                         focus:ring-1 focus:ring-violet-500 px-4 py-3 outline-none"
            />
          </div> */}

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 
                       text-white font-medium shadow-lg shadow-violet-500/30 transition"
          >
            Sign Up
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="px-3 text-gray-400 text-sm">Or continue with</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 w-full py-2 rounded-xl 
                             bg-gray-800 hover:bg-gray-700 text-white border border-gray-700">
            <FaGoogle /> Google
          </button>
          <button className="flex items-center justify-center gap-2 w-full py-2 rounded-xl 
                             bg-gray-800 hover:bg-gray-700 text-white border border-gray-700">
            <FaGithub /> GitHub
          </button>
        </div>

        {/* Switch */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-violet-400 hover:underline">
           log In here
          </a>
        </p>
      </div>
    </div>
  );
}
