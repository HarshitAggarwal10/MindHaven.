"use client";

import { motion } from "framer-motion";

export default function TherapySection() {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Therapy & Appointments</h2>
            <p className="text-gray-500 mt-1">Schedule in-person or online sessions with certified therapists.</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4">
              <div className="font-medium text-gray-700">Dr. Emilia Winson</div>
              <div className="text-xs text-gray-400">Physiotherapy — Video call</div>
              <div className="mt-3"><button className="px-3 py-2 rounded bg-teal-500 text-white">Book</button></div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="font-medium text-gray-700">Find a therapist</div>
              <div className="text-xs text-gray-400">Smart matching based on your preferences</div>
              <div className="mt-3"><button className="px-3 py-2 rounded bg-teal-500 text-white">Match me</button></div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
