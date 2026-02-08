"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, BookHeart, Users, SmilePlus, LogOut } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!data.user) return router.push("/login");
      setUser(data.user);
    }
    fetchUser();
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Brain },
    { id: "journal", label: "Journal", icon: BookHeart },
    { id: "community", label: "Community", icon: Users },
    { id: "mood", label: "Mood Tracker", icon: SmilePlus },
  ];

  return (
    <div className="min-h-screen relative bg-linear-to-br from-[#E8F9FF] via-[#FFF9F4] to-[#E8FDF6] font-[Poppins]">

      {/* Background Orbs */}
      <div className="absolute w-80 h-80 bg-teal-300/30 blur-3xl rounded-full top-20 left-20 animate-pulse-slow"></div>
      <div className="absolute w-96 h-96 bg-emerald-200/30 blur-3xl rounded-full bottom-10 right-10 animate-pulse-slower"></div>

      <div className="relative z-10 max-w-5xl mx-auto pt-24">

        <h1 className="text-4xl font-[Playfair_Display] text-gray-800 font-bold">
          Welcome back, {user?.name || "Friend"} 🌿
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mt-10">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                tab === t.id
                  ? "bg-teal-500 text-white shadow-lg"
                  : "bg-white/60 backdrop-blur border-gray-200 text-gray-700 hover:scale-105"
              }`}
            >
              <t.icon size={18} /> {t.label}
            </button>
          ))}

          <button
            onClick={logout}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/80 text-white hover:bg-red-600 transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="mt-10 p-6 bg-white/70 backdrop-blur-lg border border-white/50 rounded-3xl shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4 }}
            >
              {tab === "overview" && <p>Your personalized wellness overview 💚</p>}
              {tab === "journal" && <p>Start writing your thoughts ✍️</p>}
              {tab === "community" && <p>Connect with people who care 🤝</p>}
              {tab === "mood" && <p>Track your emotional growth 📈</p>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
