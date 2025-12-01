"use client";

import { motion } from "framer-motion";
import CalmDecor from "../CalmDecor";

export default function CampsSection() {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Wellness Camps</h2>
            <p className="text-gray-500 mt-1">Retreats for mindfulness, breathwork, and immersive practices.</p>
          </div>
          <CalmDecor className="w-44 h-24" />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border p-4">
            <div className="font-medium text-gray-700">Himachal Retreat — 7 days</div>
            <div className="text-xs text-gray-400">Yoga, breathwork, ice-bath therapy</div>
            <div className="mt-3"><button className="px-3 py-2 rounded bg-teal-500 text-white">View details</button></div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="font-medium text-gray-700">Virtual Sound Bath</div>
            <div className="text-xs text-gray-400">Guided session — 60 mins</div>
            <div className="mt-3"><button className="px-3 py-2 rounded bg-teal-500 text-white">Join</button></div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
