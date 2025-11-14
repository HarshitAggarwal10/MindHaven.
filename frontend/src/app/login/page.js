"use client";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  getAuth,
} from "firebase/auth";
import { app } from "../../firebase/firebaseClient";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, User, Sparkles, LogIn, UserPlus } from "lucide-react";
import "../../styles/animation.css";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      Swal.fire({
        title: "Welcome Back!",
        text: `Logged in as ${result.user.displayName}`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      router.push("/dashboard");
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        Swal.fire("Account Created!", "Welcome to MindHaven 🌿", "success");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        Swal.fire("Welcome Back!", "Glad to see you again 💚", "success");
      }
      router.push("/dashboard");
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };

  return (
    <div className="relative flex min-h-screen justify-center items-center bg-linear-to-br from-[#E8F9FF] via-[#FFF9F4] to-[#E8FDF6] overflow-hidden font-[Poppins]">
      {/* 🌈 Floating Background Orbs */}
      <div className="absolute w-72 h-72 bg-teal-300/30 blur-3xl rounded-full top-10 left-10 animate-pulse-slow"></div>
      <div className="absolute w-96 h-96 bg-emerald-200/30 blur-3xl rounded-full bottom-10 right-10 animate-pulse-slower"></div>

      {/* 🌿 Auth Card */}
      <motion.div
        key={isSignUp ? "signup" : "login"}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 bg-white/70 backdrop-blur-lg border border-white/50 rounded-3xl shadow-2xl p-10 w-[90%] sm:w-[400px]"
      >
        <div className="text-center mb-6">
          <h1 className="text-4xl font-[Playfair_Display] font-bold text-gray-800 mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-gray-600">
            {isSignUp
              ? "Join MindHaven and start your healing journey 🌸"
              : "Log in to continue your journey 🌿"}
          </p>
        </div>

        {/* 🧠 Auth Form */}
        <form onSubmit={handleEmailAuth} className="space-y-5">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-white/80 border border-gray-200 rounded-xl px-10 py-3 focus:ring-2 focus:ring-teal-400 outline-none text-gray-700"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-10 py-3 focus:ring-2 focus:ring-teal-400 outline-none text-gray-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-10 py-3 focus:ring-2 focus:ring-teal-400 outline-none text-gray-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-teal-400 to-emerald-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>

          <div className="flex items-center justify-center gap-2 my-4">
            <div className="w-1/4 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="w-1/4 h-px bg-gray-300"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-3 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
          >
            <Image
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              width={20}
              height={20}
            />
            Continue with Google
          </button>
        </form>

        {/* 💫 Switch Form */}
        <div className="text-center mt-6 text-sm text-gray-600">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setIsSignUp(false)}
                className="text-teal-600 hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <button
                onClick={() => setIsSignUp(true)}
                className="text-teal-600 hover:underline font-medium"
              >
                Sign up
              </button>
            </>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-gray-500 hover:text-teal-500 transition"
          >
            <Sparkles size={16} /> Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
