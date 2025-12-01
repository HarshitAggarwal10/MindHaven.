"use client";

import { motion } from "framer-motion";
import CalmDecor from "../CalmDecor";

export default function ArtSection() {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Art Therapy</h2>
            <p className="text-gray-500 mt-1">Express with colors — a private canvas to release feelings.</p>
          </div>
          <CalmDecor className="w-44 h-24" />
        </div>

        <div className="mt-6">
          <div className="rounded-xl border p-4">
            <div className="text-gray-700">Open the art canvas and draw freely.</div>
            <div className="mt-3"><button className="px-3 py-2 rounded bg-teal-500 text-white">Open canvas</button></div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
