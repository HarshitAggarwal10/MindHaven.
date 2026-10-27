"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Book,
  Calendar,
  CheckSquare,
  Headphones,
  Heart,
  Home,
  Palette,
  Settings,
  Smile,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { trackDashboardActivity } from "@/lib/activity-history";

const FEATURES = [
  { id: "activities", label: "Dashboard", Icon: Activity },
  { id: "diary", label: "Digital Diary", Icon: Book },
  { id: "mood", label: "Mood Tracker", Icon: Smile },
  { id: "community", label: "Community", Icon: Users },
  { id: "therapy", label: "Therapy", Icon: Calendar },
  { id: "camps", label: "Wellness Hub", Icon: Zap },
  { id: "companion", label: "AI Companion", Icon: Settings },
  { id: "habits", label: "Habit Builder", Icon: CheckSquare },
  { id: "art", label: "Art Therapy", Icon: Palette },
  { id: "meditation", label: "Meditation", Icon: Headphones },
];

export default function Sidebar({ selected, onSelect }) {
  const router = useRouter();

  return (
    <motion.aside
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      aria-label="Dashboard navigation"
      className="flex h-full w-[4.25rem] shrink-0 flex-col items-center bg-[#101a19] px-2 py-4 text-white sm:w-[4.75rem] sm:px-2.5"
    >
      <button
        type="button"
        aria-label="MindHaven dashboard"
        title="MindHaven"
        onClick={() => onSelect("activities")}
        className="mb-6 flex size-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-lg"
      >
        <Heart size={19} fill="currentColor" />
      </button>
      <nav className="flex w-full flex-1 flex-col items-center gap-2">
        {FEATURES.map(({ id, label, Icon }) => {
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-current={active ? "page" : undefined}
              title={label}
              onClick={() => {
                trackDashboardActivity(`Opened ${label}`);
                onSelect(id);
              }}
              className={`group relative flex size-10 shrink-0 items-center justify-center rounded-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${
                active
                  ? "bg-[#1b3531] text-[#a8eadc]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {active && <span className="absolute -left-2 h-6 w-1 rounded-full bg-[#83c47e]" />}
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              <span className="pointer-events-none absolute left-12 z-30 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block group-focus-visible:block">
                {label}
              </span>
            </button>
          );
        })}
      </nav>
      <button
        type="button"
        aria-label="Back to home"
        title="Back to home"
        onClick={() => router.push("/")}
        className="mt-3 flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
      >
        <Home size={19} />
      </button>
      <Sparkles size={14} className="mt-4 text-teal-300/60" aria-hidden="true" />
    </motion.aside>
  );
}
