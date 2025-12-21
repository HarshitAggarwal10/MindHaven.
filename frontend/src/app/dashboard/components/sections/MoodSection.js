"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const MOODS = [
  { id: "sad", label: "Sad", emoji: "😢" },
  { id: "neutral", label: "Neutral", emoji: "😐" },
  { id: "okay", label: "Okay", emoji: "🙂" },
  { id: "good", label: "Good", emoji: "😊" },
  { id: "great", label: "Great", emoji: "😁" },
];

export default function MoodSection() {
  const [selected, setSelected] = useState(null);

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Mood Tracker</h2>
            <p className="text-gray-500 mt-1">Quick check-in — track patterns over time.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`rounded-xl p-3 border text-left flex items-center gap-3 hover:shadow-sm transition ${
                selected === m.id ? "bg-teal-50 border-teal-200" : "bg-white"
              }`}
            >
              <div className="text-2xl">{m.emoji}</div>
              <div>
                <div className="font-medium text-gray-700">{m.label}</div>
                <div className="text-xs text-gray-400">Tap to log</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4">
          {selected && <div className="text-sm text-gray-700">You logged: <strong>{selected}</strong></div>}
        </div>
      </div>
    </motion.section>
  );
}
