/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Brain,
  Heart,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const QUOTES = [
  "You are stronger than your anxious thoughts.",
  "Healing is not linear — and that’s okay.",
  "One small step today is progress.",
  "You deserve peace, calm, and kindness.",
  "Your mind is a garden — nourish it gently.",
  "Breathe. Reset. You’re doing your best.",
];

export default function Topbar({ user }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [quoteIndex, setQuoteIndex] = useState(0);

  // Enable hydration-safe user initials
  useEffect(() => setHydrated(true), []);

  // Quote Rotator (6 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const initials =
    hydrated && (user?.name || user?.email)
      ? user?.name
        ? user.name
            .trim()
            .split(/\s+/)
            .map((x) => x[0]?.toUpperCase())
            .slice(0, 2)
            .join("")
        : user?.email?.[0]?.toUpperCase() || "U"
      : "U";

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="relative z-999 px-6 py-4 flex items-center justify-between overflow-visible">
      {/* 🌈 Animated Pastel Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-r from-[#F8FFFE] via-[#ECFDF9] to-[#FFF9EA] animate-pulse-slow" />

        {/* Floating icons */}
        <Brain className="absolute top-3 left-16 w-10 h-10 text-teal-300 opacity-30 animate-floating-slow" />
        <Sparkles className="absolute bottom-3 right-20 w-7 h-7 text-yellow-300 opacity-40 animate-floating-mid" />
        <Heart className="absolute top-10 right-10 w-8 h-8 text-rose-300 opacity-30 animate-floating-slow" />
      </div>

      {/* 🌿 Rotating Quote */}
      <div className="flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={quoteIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.6 }}
            className="px-4 py-2 rounded-full bg-white/50 backdrop-blur-xl border border-white/60 shadow-md"
          >
            <p
              className="text-[15px] text-gray-700 font-medium"
              style={{ fontFamily: "Quicksand" }}
            >
              {QUOTES[quoteIndex]}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 🔔 Notifications + Profile */}
      <div className="flex items-center gap-5 relative">
        {/* Notification Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          className="p-2 rounded-full bg-white/70 shadow-sm border border-white/60 backdrop-blur-xl"
        >
          <Bell size={20} className="text-teal-700" />
        </motion.button>

        {/* Profile Block */}
        <div className="relative z-9999">
          <button
            onClick={() => setOpen((s) => !s)}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-xl px-3 py-1.5 rounded-full shadow border border-white/60"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-teal-300 to-teal-600 text-white flex items-center justify-center font-semibold shadow-md">
              {initials}
            </div>

            {/* Name */}
            <div
              className="text-sm text-gray-700"
              style={{ fontFamily: "Quicksand" }}
            >
              <div className="font-semibold">
                {hydrated ? user?.name || user?.email || "User" : "..."}
              </div>
              <div className="text-xs text-gray-500">Member</div>
            </div>

            <ChevronDown size={16} className="text-gray-500" />
          </button>

          {/* Dropdown */}
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 
           overflow-hidden backdrop-blur-xl z-10000"
            >
              <button
                onClick={() => router.push("/profile")}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              >
                <User size={16} /> Profile
              </button>

              <button
                onClick={() => router.push("/settings")}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              >
                <Settings size={16} /> Settings
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-red-600"
              >
                <LogOut size={16} /> Logout
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}
