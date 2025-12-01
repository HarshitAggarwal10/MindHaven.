"use client";

import { motion } from "framer-motion";
import CalmDecor from "../CalmDecor";
import ActivityRow from "./shared/ActivityRow";

export default function ActivitiesSection() {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Your Activities</h2>
            <p className="text-gray-500 mt-1">Recent sessions, mood logs and quick actions.</p>
          </div>
          <CalmDecor className="w-44 h-24" />
        </div>

        <div className="mt-6 space-y-3">
          <ActivityRow title="Manage stress" time="10:00 PM — 12:00 AM" />
          <ActivityRow title="Physiotherapy" time="09:00 AM — 10:00 AM" />
          <ActivityRow title="Therapy call" time="Tomorrow 11:00 AM" />
        </div>

        <div className="mt-6 text-right">
          <button className="text-teal-600 font-medium hover:underline">See all activities →</button>
        </div>
      </div>
    </motion.section>
  );
}
