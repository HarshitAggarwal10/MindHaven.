"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, LogIn, Sparkles } from "lucide-react";
import "../../styles/animation.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error || "Invalid email or password");
        return;
      }

      if (!data.access) {
        setError("Login response was incomplete. Please try again.");
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("mh_token", data.access);
        localStorage.setItem("mh_user", JSON.stringify({ email: email.trim().toLowerCase() }));
      }

      router.push("/dashboard");
    } catch (requestError) {
      console.error("Login request failed:", requestError);
      setError("Could not reach the server. Check that the backend is running, then try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen justify-center items-center bg-linear-to-br from-[#E8F9FF] via-[#FFF9F4] to-[#E8FDF6] overflow-hidden font-[Poppins]">

      {/* Floating Orbs */}
      <div className="absolute w-72 h-72 bg-teal-300/30 blur-3xl rounded-full top-10 left-10 animate-pulse-slow"></div>
      <div className="absolute w-96 h-96 bg-emerald-200/30 blur-3xl rounded-full bottom-10 right-10 animate-pulse-slower"></div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 bg-white/70 backdrop-blur-lg border border-white/50 rounded-3xl shadow-2xl p-10 w-[90%] sm:w-[400px]"
      >
        <h1 className="text-4xl font-[Playfair_Display] font-bold text-center mb-4">
          Welcome Back
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Log in to continue your healing journey 🌿
        </p>

        {error && (
          <div className="bg-red-100 text-red-600 text-sm p-2 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="relative">
            <Mail size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-10 py-3 focus:ring-2 focus:ring-teal-400 outline-none text-gray-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-10 py-3 focus:ring-2 focus:ring-teal-400 outline-none text-gray-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-teal-400 to-emerald-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            <LogIn size={18} /> {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-teal-600 hover:underline">
            Sign up
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
