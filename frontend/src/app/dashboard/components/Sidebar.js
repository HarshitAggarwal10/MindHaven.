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
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

/**
 * Calm, animated sidebar - icon rail that expands on hover with smooth animation.
 * Uses soft teal palette and gentle shadows.
 */

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
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="h-full flex flex-col justify-between select-none"
      initial={false}
      animate={{ width: expanded ? 220 : 72 }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      style={{ minWidth: 72 }}
    >
      <div
        className="h-full bg-linear-to-b from-[#083230] to-[#063535] text-white rounded-2xl p-3 flex flex-col justify-between shadow-xl"
        style={{ height: "100%" }}
      >
        <div>
          <div className="mb-4 flex items-center justify-center">
            {expanded ? (
              <div className="text-teal-200 font-extrabold text-lg">MindHaven.</div>
            ) : (
              <div className="text-teal-200 font-bold">MH</div>
            )}
          </div>

          <nav className="space-y-2">
            {FEATURES.map((f) => {
              const active = selected === f.id;
              const Icon = f.Icon;
              return (
                <motion.button
                  key={f.id}
                  onClick={() => onSelect(f.id)}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 w-full rounded-xl p-2 transition-colors focus:outline-none ${
                    active ? "bg-white/10 text-white" : "text-white/90 hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      active ? "bg-white/10" : "bg-white/6"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {expanded && <span className="text-sm font-medium">{f.label}</span>}
                </motion.button>
              );
            })}
          </nav>
        </div>

        <div>
          <button
            onClick={() => router.push("/")}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-white/90"
          >
            <Home size={18} />
            {expanded && <span className="text-sm">Back to Home</span>}
          </button>

          <div className="mt-4 text-xs text-white/70 px-1">
            {expanded && (
              <>
                <div className="font-medium">{user?.name || user?.email || "Member"}</div>
                <div className="text-[11px]">Anonymous & secure</div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
