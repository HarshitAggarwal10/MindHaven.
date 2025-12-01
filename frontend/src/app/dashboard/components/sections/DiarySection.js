"use client";

import { motion } from "framer-motion";
import CalmDecor from "../CalmDecor";

export default function DiarySection() {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Digital Diary</h2>
            <p className="text-gray-500 mt-1">Private, encrypted journaling to reflect and grow.</p>
          </div>

          <CalmDecor className="w-44 h-24" />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <textarea
            rows={6}
            placeholder="Write whatever's on your mind…"
            className="col-span-1 md:col-span-2 resize-none rounded-lg border p-4 outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">Your entries are private and encrypted.</div>
          <button className="px-4 py-2 rounded-full bg-linear-to-r from-teal-400 to-teal-600 text-white shadow">
            Save Entry
          </button>
        </div>
      </div>
    </motion.section>
  );
}
