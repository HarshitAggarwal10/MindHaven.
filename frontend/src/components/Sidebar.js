// src/components/Sidebar.js
"use client";

import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function Sidebar({ features = [], active, onSelect }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`p-5 bg-white/75 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl h-[calc(100vh-140px)] sticky top-20 transition-all ${collapsed ? "w-20" : "w-64"}`}>
      <div className="flex items-center justify-between mb-4">
        {!collapsed ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-800">MindHaven</h3>
            <p className="text-xs text-gray-500">Tap to explore</p>
          </div>
        ) : (
          <div className="text-sm font-semibold text-gray-800">MH</div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg bg-white/50 shadow-sm"
          aria-label="Toggle menu"
        >
          <Menu size={16} />
        </button>
      </div>

      <nav className="space-y-2 mt-2">
        {features.map((f) => (
          <motion.button
            key={f.id}
            onClick={() => onSelect(f.id)}
            whileHover={{ scale: 1.02 }}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${active === f.id ? "bg-teal-500 text-white shadow-lg" : "bg-white/60 text-gray-700 border border-gray-100 hover:bg-teal-50"}`}
          >
            <div className="w-7 h-7 flex items-center justify-center">
              <f.icon size={16} />
            </div>
            {!collapsed && <span className="font-medium">{f.label}</span>}
          </motion.button>
        ))}
      </nav>

      <div className="mt-6 pt-4 border-t border-white/30 text-xs text-gray-500">
        <div className="mb-2">Pro tip:</div>
        <div>Try the Mood Tracker daily to train the AI insights.</div>
      </div>
    </aside>
  );
}
