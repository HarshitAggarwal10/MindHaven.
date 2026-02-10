"use client";

import { motion } from "framer-motion";

export default function HabitsSection() {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Habit Builder</h2>
            <p className="text-gray-500 mt-1">Create gentle, sustainable habits and track streaks.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border p-4">
            <div className="font-medium text-gray-700">Daily journaling</div>
            <div className="text-xs text-gray-400">5 min habit</div>
            <div className="mt-3"><button className="px-3 py-2 rounded bg-teal-500 text-white">Add habit</button></div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="font-medium text-gray-700">Evening wind-down</div>
            <div className="text-xs text-gray-400">15 min habit</div>
            <div className="mt-3"><button className="px-3 py-2 rounded bg-teal-500 text-white">Start</button></div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
