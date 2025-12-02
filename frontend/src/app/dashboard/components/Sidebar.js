"use client";

import React, { useState } from "react";
import {
  Activity,
  Book,
  Smile,
  Users,
  Calendar,
  Zap,
  Settings,
  CheckSquare,
  Palette,
  Headphones,
  Home,
  Brain,
  Sparkles,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const FEATURES = [
  { id: "activities", label: "Activities", Icon: Activity },
  { id: "diary", label: "Digital Diary", Icon: Book },
  { id: "mood", label: "Mood Tracker", Icon: Smile },
  { id: "community", label: "Community", Icon: Users },
  { id: "therapy", label: "Therapy", Icon: Calendar },
  { id: "camps", label: "Wellness Camps", Icon: Zap },
  { id: "companion", label: "AI Companion", Icon: Settings },
  { id: "habits", label: "Habit Builder", Icon: CheckSquare },
  { id: "art", label: "Art Therapy", Icon: Palette },
  { id: "meditation", label: "Meditation", Icon: Headphones },
];

export default function Sidebar({ selected, onSelect, user }) {
  const router = useRouter();
  const [expanded] = useState(true);

  return (
    <motion.aside
      className="h-full flex flex-col select-none relative overflow-hidden"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      style={{ width: 260 }}
    >
      {/* 🌟 FULL Scrollable Content */}
      <div className="h-full relative z-10 bg-white/60 backdrop-blur-xl rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-white/50 flex flex-col overflow-y-auto custom-scrollbar">
        {/* 🌿 Logo */}
        <div className="text-center mb-6">
          <span
            style={{
              fontFamily: "'Satisfy', cursive",
              fontSize: 36,
              color: "#4CC3AA",
              lineHeight: 1,
            }}
          >
            MindHaven.
          </span>
        </div>

        {/* ✨ Feature List */}
        <div className="space-y-2">
          {FEATURES.map((f) => {
            const active = selected === f.id;
            const Icon = f.Icon;
            return (
              <motion.button
                key={f.id}
                onClick={() => onSelect(f.id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-4 w-full rounded-xl px-4 py-3 transition-all font-medium
                ${
                  active
                    ? "bg-[#A7EDE0]/60 text-teal-900 shadow-md"
                    : "hover:bg-[#E9FBF8]/70 text-gray-700"
                }
                `}
                style={{ fontFamily: "Quicksand, sans-serif" }}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition 
                  ${active ? "bg-white/70" : "bg-white/50"}
                  `}
                >
                  <Icon className="w-5 h-5 text-teal-700" />
                </div>

                <span className="text-[15px]">{f.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* 🌟 Bottom Info Section */}
        <div className="mt-8">
          {/* Back to Home */}
          <motion.button
            onClick={() => router.push("/")}
            whileHover={{ scale: 1.04 }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/70 hover:bg-white text-gray-700 shadow-sm border border-white/80 mb-4"
          >
            <Home size={18} className="text-teal-700" />
            <span className="text-sm font-medium">Back to Home</span>
          </motion.button>

          {/* User Info & align  these in center*/}
          <div className="text-center">
            <div
              className="text-xs text-gray-600"
              style={{ fontFamily: "Quicksand" }}
            >
              Logged in as
            </div>
            <div
              className="font-semibold text-gray-800 mt-1"
              style={{ fontFamily: "Quicksand" }}
            >
              {user?.name || user?.email || "Member"}
            </div>
            <div className="text-[11px] text-teal-700 mt-1 opacity-80">
              Anonymous & Secure
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
