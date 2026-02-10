"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  HeartPulse,
  BookOpen,
  Smile,
  User,
  Building2,
  MapPin,
  CalendarDays,
  Clock,
  ArrowRight,
  Sparkles,
  Brain,
  Flower,
  Infinity,
  Sunrise,
  Moon,
  Target,
  Heart,
} from "lucide-react";

/* ---------------------------
   CALENDAR WITH PREV/NEXT CONTROLS
--------------------------- */
function CalendarWidget() {
  const current = new Date();
  const [view, setView] = useState({
    month: current.getMonth(),
    year: current.getFullYear(),
  });

  const today = current.getDate();
  const thisMonth = current.getMonth();
  const thisYear = current.getFullYear();

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const totalDays = new Date(view.year, view.month + 1, 0).getDate();
  const prevMonthDays = new Date(view.year, view.month, 0).getDate();

  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: prevMonthDays - firstDay + i + 1, type: "prev" });
  }

  for (let d = 1; d <= totalDays; d++) {
    days.push({ day: d, type: "current" });
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ day: d, type: "next" });
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const prevMonth = () => {
    setView((v) =>
      v.month === 0
        ? { month: 11, year: v.year - 1 }
        : { month: v.month - 1, year: v.year }
    );
  };

  const nextMonth = () => {
    setView((v) =>
      v.month === 11
        ? { month: 0, year: v.year + 1 }
        : { month: v.month + 1, year: v.year }
    );
  };

  return (
    <div className="bg-white/70 p-6 rounded-3xl shadow border border-white/60 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 bg-white/80 rounded-xl hover:bg-white shadow-sm"
        >
          ‹
        </button>

        <h3 className="text-xl font-semibold text-gray-800">
          {monthNames[view.month]} {view.year}
        </h3>

        <button
          onClick={nextMonth}
          className="p-2 bg-white/80 rounded-xl hover:bg-white shadow-sm"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-gray-600 font-semibold text-sm">
        {"SMTWTFS".split("").map((d, i) => (
          <div key={d + i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 mt-3 gap-2">
        {days.map(({ day, type }, i) => {
          const isToday =
            type === "current" &&
            view.month === thisMonth &&
            view.year === thisYear &&
            day === today;

          return (
            <div
              key={i}
              className={`p-2 rounded-xl text-sm flex items-center justify-center transition
                ${
                  isToday
                    ? "bg-teal-500 text-white shadow"
                    : type === "current"
                    ? "bg-white text-gray-700"
                    : "bg-gray-50 text-gray-400"
                }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------
   WELLNESS SCORE CARD
--------------------------- */
function WellnessScoreCard({ percent }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#E9FFF8] via-[#F5FFF6] to-[#FFF7E6]
        p-8 rounded-3xl shadow border border-white/60 backdrop-blur-xl relative overflow-hidden"
    >
      <Brain className="absolute top-4 right-4 w-12 h-12 opacity-[0.08] text-teal-500 animate-floating-slow" />

      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        Wellness Score
      </h3>

      <div className="flex flex-col items-center">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg width="150" height="150">
            <circle
              cx="75"
              cy="75"
              r={radius}
              stroke="#EAFBF5"
              strokeWidth="10"
              fill="none"
            />

            <motion.circle
              cx="75"
              cy="75"
              r={radius}
              stroke="url(#mindGrad)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              strokeDasharray={circumference}
            />

            <defs>
              <linearGradient id="mindGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#74EFC5" />
                <stop offset="80%" stopColor="#36C0B0" />
              </linearGradient>
            </defs>
          </svg>

          <p className="absolute text-2xl font-bold text-gray-800">
            {percent}%
          </p>
        </div>

        <p className="mt-3 text-gray-600 text-[15px]">
          Your mind feels balanced today 🌿
        </p>
      </div>
    </motion.div>
  );
}

/* ---------------------------
   CHECK CONDITION CARD (redirect to mood)
--------------------------- */
function CheckConditionCard() {
  const goToMood = () => {
    window.dispatchEvent(new CustomEvent("switch-section", { detail: "mood" }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative p-8 rounded-3xl shadow-xl bg-gradient-to-br
      from-[#E4FFF6] via-[#F9FFE9] to-[#FFF3DF] border border-white/50 overflow-hidden"
    >
      <div className="absolute -right-10 top-3 opacity-40 pointer-events-none">
        <Brain size={150} strokeWidth={1} className="text-teal-400" />
      </div>

      <h2 className="text-2xl font-semibold text-gray-800">
        Check Your Condition
      </h2>
      <p className="text-gray-700 mt-2 text-[15px]">
        Quick 40-second assessment to evaluate clarity, calmness and stress.
      </p>

      <motion.button
        onClick={goToMood}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="mt-6 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow flex items-center gap-2"
      >
        Check Your Condition <ArrowRight size={16} />
      </motion.button>
    </motion.div>
  );
}

/* ---------------------------
   APPOINTMENT CARD
--------------------------- */
function AppointmentCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-[#E3FDF5] to-[#FFF8E6]
      rounded-3xl p-6 shadow border border-white/50 overflow-hidden"
    >
      {/* Decorative Right Illustration */}
      <div className="absolute right-4 top-4 opacity-20">
        <CalendarDays size={90} className="text-teal-400" />
      </div>

      {/* Pulse indicator top-right */}
      <div className="absolute right-6 top-6 w-3 h-3 bg-teal-500 rounded-full animate-ping" />

      <h3 className="text-xl font-semibold text-gray-900">
        Upcoming Appointment
      </h3>

      <div className="flex items-center gap-4 mt-4">
        <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center">
          <User className="w-6 h-6 text-teal-700" />
        </div>

        <div>
          <p className="font-semibold text-gray-900">Dr. Meera Sharma</p>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <Building2 size={14} /> MindCare Hospital
          </p>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin size={14} /> Delhi, India
          </p>
        </div>
      </div>

      {/* Date + Time */}
      <div className="mt-4 flex items-center gap-6">
        <p className="flex items-center gap-2 text-gray-700">
          <CalendarDays size={18} /> Dec 4, 2025
        </p>
        <p className="flex items-center gap-2 text-gray-700">
          <Clock size={18} /> 4:00 PM
        </p>
      </div>
    </motion.div>
  );
}

/* ---------------------------
   ACTIVITY GRAPH
--------------------------- */
function ActivityGraph() {
  return (
    <div className="bg-white/70 rounded-3xl p-6 shadow border border-white/60 backdrop-blur-xl">
      <h3 className="text-xl font-semibold text-gray-800">Weekly Mood Trend</h3>

      <svg width="100%" height="150" className="mt-4">
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#B6F2E4AA" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        <motion.path
          d="M20 100 C80 40, 160 160, 240 80 C320 0, 400 160, 480 60 C560 0, 640 150, 720 90"
          fill="url(#areaGrad)"
          stroke="none"
        />

        <motion.path
          d="M20 100 C80 40, 160 160, 240 80 C320 0, 400 160, 480 60 C560 0, 640 150, 720 90"
          stroke="#3ABAB4"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

/* ---------------------------
   MINI STATS
--------------------------- */
function MiniStat({ title, value, Icon, color }) {
  return (
    <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-xl shadow border border-white/60 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: color }}
      >
        <Icon className="text-white w-6 h-6" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

/* ---------------------------
   MAIN COMPONENT
--------------------------- */
export default function ActivitiesSection() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data?.user);
    })();
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 relative"
    >
      {/* Floating Background Icons */}
      <Brain className="absolute top-0 right-10 w-12 h-12 opacity-[0.1] text-teal-400 animate-floating-slow" />

      {/* Greeting */}
      <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow border border-white/50">
        <h2 className="text-3xl font-semibold text-gray-800">
          Hi, {user?.name?.split(" ")[0] || "Friend"} 👋
        </h2>
        <p className="text-gray-600 mt-1">
          “Every step counts — even resting is progress.”
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left */}
        <div className="space-y-8">
          <AppointmentCard />
          <ActivityGraph />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MiniStat
              title="Mindfulness Score"
              value="82"
              Icon={Target}
              color="#4CC3AA"
            />
            <MiniStat
              title="Sleep Quality"
              value="7.4 hrs"
              Icon={Moon}
              color="#9CA3FF"
            />
            <MiniStat
              title="Daily Energy"
              value="Good"
              Icon={Sunrise}
              color="#FFB85C"
            />
            <MiniStat
              title="Emotional Health"
              value="Stable"
              Icon={Heart}
              color="#FF7F9F"
            />
          </div>
        </div>

        {/* Right */}
        <div className="space-y-8">
          <CalendarWidget />

          {/* Row: Wellness Score + Check Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WellnessScoreCard percent={75} />
            <CheckConditionCard />
          </div>
        </div>
      </div>

      {/* Wellness Tip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl shadow border border-white/50 flex items-center gap-3"
      >
        <Sparkles className="text-yellow-500 w-6 h-6" />
        <p className="text-gray-700 text-[15px]">
          Wellness Tip: Take a slow, deep breath and relax your shoulders.
        </p>
      </motion.div>
    </motion.section>
  );
}
