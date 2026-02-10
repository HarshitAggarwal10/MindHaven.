"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

import ActivitiesSection from "./sections/ActivitiesSection";
import DiarySection from "./sections/DiarySection";
import MoodSection from "./sections/MoodSection";
import CommunitySection from "./sections/CommunitySection";
import TherapySection from "./sections/TherapySection";
import CampsSection from "./sections/CampsSection";
import CompanionSection from "./sections/CompanionSection";
import HabitsSection from "./sections/HabitsSection";
import ArtSection from "./sections/ArtSection";
import MeditationSection from "./sections/MeditationSection";

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
} from "lucide-react";

// Section mapping
const MAP = {
  activities: { comp: ActivitiesSection, label: "Activities", Icon: Activity },
  diary: { comp: DiarySection, label: "Digital Diary", Icon: Book },
  mood: { comp: MoodSection, label: "Mood Tracker", Icon: Smile },
  community: { comp: CommunitySection, label: "Community", Icon: Users },
  therapy: { comp: TherapySection, label: "Therapy", Icon: Calendar },
  camps: { comp: CampsSection, label: "Wellness Camps", Icon: Zap },
  companion: { comp: CompanionSection, label: "AI Companion", Icon: Settings },
  habits: { comp: HabitsSection, label: "Habit Builder", Icon: CheckSquare },
  art: { comp: ArtSection, label: "Art Therapy", Icon: Palette },
  meditation: { comp: MeditationSection, label: "Meditation", Icon: Headphones },
};

export default function ContentSwitcher({ selected }) {
  const Section = MAP[selected]?.comp || ActivitiesSection;
  const Label = MAP[selected]?.label || "Activities";
  const Icon = MAP[selected]?.Icon || Activity;

  return (
    <div className="relative w-full h-full overflow-visible">

      {/* 🌈 Ambient Floating Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Soft mint wash */}
        <div className="absolute inset-0 bg-linear-to-br from-[#F8FFFE] via-[#E3FDF5] to-[#FFF8E6] opacity-70" />

        {/* Glow orbs */}
        <div className="absolute top-[15%] left-[20%] w-[260px] h-[260px] bg-[#CFF7EA] rounded-full blur-[80px] opacity-40 animate-floating-slow" />
        <div className="absolute bottom-[10%] right-[15%] w-[320px] h-80 bg-[#FFF0C9] rounded-full blur-[90px] opacity-50 animate-floating-mid" />

        {/* Very soft wave */}
        <svg className="absolute top-10 left-0 opacity-[0.12] w-full" viewBox="0 0 1440 200" fill="none">
          <path
            d="M0 100C250 150 350 40 600 90C850 140 1050 20 1440 100"
            stroke="#9EE6D8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ✨ Animated Section Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="
            h-full w-full 
            bg-white/60 
            backdrop-blur-2xl 
            shadow-[0_10px_40px_rgba(0,0,0,0.10)]
            border border-white/50
            rounded-3xl 
            p-8 
            overflow-y-auto 
            beautiful-scrollbar
          "
        >
          {/* 🌙 Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-linear-to-br from-teal-200 to-teal-400 text-white shadow-md">
              <Icon size={20} />
            </div>
            <h2
              className="text-2xl font-semibold text-gray-800"
              style={{ fontFamily: "Quicksand" }}
            >
              {Label}
            </h2>
          </div>

          {/* 🌿 Actual Section Content */}
          <Section />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
