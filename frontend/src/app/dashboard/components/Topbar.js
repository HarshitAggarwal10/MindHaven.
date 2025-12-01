"use client";

import React, { useEffect, useState } from "react";
import { Search, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

/**
 * Topbar with search and profile dropdown. Smooth animations and calm micro-interactions.
 */

export default function Topbar({ user }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const initials = hydrated
    ? user?.name
      ? user.name.split(" ").map((x) => x[0]).slice(0,2).join("")
      : user?.email?.[0]?.toUpperCase() || "U"
    : "";

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="bg-transparent px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28 }}
          className="bg-white/60 backdrop-blur rounded-full px-3 py-2 flex items-center gap-2"
        >
          <Search size={16} className="text-gray-500" />
          <input
            className="outline-none bg-transparent w-64 text-sm text-gray-700"
            placeholder="Search features, appointments, notes..."
          />
        </motion.div>
      </div>

      <div className="flex items-center gap-4 relative">
        <motion.button
          whileHover={{ scale: 1.04 }}
          className="p-2 rounded-full bg-white/60 shadow-sm"
        >
          <Bell size={18} className="text-gray-600" />
        </motion.button>

        <div className="relative">
          <button
            onClick={() => setOpen((s) => !s)}
            className="flex items-center gap-3 bg-white/80 px-3 py-1 rounded-full shadow"
            aria-expanded={open}
          >
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center font-semibold">
              {initials || "U"}
            </div>
            <div className="text-sm text-gray-700">
              <div className="font-medium">{hydrated ? (user?.name || user?.email || "User") : "..."}</div>
              <div className="text-xs text-gray-400">Member</div>
            </div>
            <ChevronDown size={16} className="text-gray-500" />
          </button>

          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 mt-3 w-44 bg-white rounded-lg shadow-lg overflow-hidden z-30"
            >
              <button onClick={() => router.push("/profile")} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                <User size={16} /> Profile
              </button>
              <button onClick={() => router.push("/settings")} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                <Settings size={16} /> Settings
              </button>
              <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2">
                <LogOut size={16} /> Logout
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}
