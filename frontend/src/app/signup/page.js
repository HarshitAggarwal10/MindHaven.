"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Lock, User, Sparkles, UserPlus } from "lucide-react";
import "../../styles/animation.css";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [hasExistingAccount, setHasExistingAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setHasExistingAccount(false);
    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:8000/api/auth/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setHasExistingAccount(true);
          setError("This email is already registered. Sign in with the original password, or use another email.");
        } else {
          setError(data.error || data.detail || "Signup failed");
        }
        return;
      }

      if (!data.access) {
        setError("Account response was incomplete. Please try signing in.");
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("mh_token", data.access);
        localStorage.setItem("mh_user", JSON.stringify({ email: email.trim().toLowerCase() }));
      }

      router.push("/dashboard");
    } catch (requestError) {
      console.error("Signup request failed:", requestError);
      setError("Could not reach the server. Check that the backend is running, then try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen justify-center items-center bg-linear-to-br from-[#FFF9F4] via-[#E8F9FF] to-[#E8FDF6] overflow-hidden font-[Poppins]">
      <div className="absolute w-60 h-60 bg-teal-200/30 blur-3xl rounded-full top-12 left-16 animate-pulse-slow"></div>
      <div className="absolute w-96 h-96 bg-emerald-200/30 blur-3xl rounded-full bottom-10 right-10 animate-pulse-slower"></div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 bg-white/70 backdrop-blur-lg border border-white/50 rounded-3xl shadow-2xl p-10 w-[90%] sm:w-[400px]"
      >
        <h1 className="text-4xl font-[Playfair_Display] font-bold text-center mb-4">
          Create Account
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Start your healing journey with MindHaven ✨
        </p>

        {error && (
          <div className="bg-red-100 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
            <p>{error}</p>
            {hasExistingAccount && (
              <Link href="/login" className="inline-block mt-2 font-semibold text-teal-700 hover:underline">
                Go to sign in
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="relative">
            <User size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Full Name"
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-10 py-3 focus:ring-2 focus:ring-teal-400 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Mail size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-10 py-3 focus:ring-2 focus:ring-teal-400 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-10 py-3 focus:ring-2 focus:ring-teal-400 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-emerald-400 to-teal-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            <UserPlus size={18} /> {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-teal-600 hover:underline">
            Sign in
          </Link>
        </p>

        <div className="text-center mt-4">
          <Link href="/" className="text-gray-500 hover:text-teal-500 transition flex items-center justify-center gap-1">
            <Sparkles size={16} /> Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
