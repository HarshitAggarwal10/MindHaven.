// src/components/FeaturePanel.js
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChartBar, Clock, MessageSquare } from "lucide-react";

export default function FeaturePanel({ active }) {
  return (
    <div className="min-h-[60vh]">
      <AnimatePresence mode="wait">
        <motion.section
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.36 }}
          className="p-8 bg-white/80 backdrop-blur-md border border-white/40 rounded-3xl shadow-2xl"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 capitalize">{active.replace("-", " ")}</h2>
              <p className="text-gray-500 mt-1">{panelDescription(active)}</p>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="p-3 rounded-xl bg-linear-to-tr from-teal-50 to-white border">
                <ChartBar size={18} />
              </div>
              <div className="p-3 rounded-xl bg-linear-to-tr from-amber-50 to-white border">
                <Clock size={18} />
              </div>
            </div>
          </div>

          <div className="mt-6">
            {active === "overview" && overviewContent()}
            {active === "therapy" && therapyContent()}
            {active === "diary" && diaryContent()}
            {active === "mood" && moodContent()}
            {active === "community" && communityContent()}
            {active === "wellness" && wellnessContent()}
            {active === "retreats" && retreatsContent()}
            {active === "security" && securityContent()}
            {active === "gamification" && gamificationContent()}
            {active === "ai" && aiContent()}
            {active === "admin" && adminContent()}
          </div>
        </motion.section>
      </AnimatePresence>
    </div>
  );
}

/* helpers (same as earlier but kept concise) */
function panelDescription(active) {
  switch (active) {
    case "overview": return "Snapshot of your recent mood, activity and recommended next steps.";
    case "therapy": return "Book sessions, match with therapists, and manage reminders.";
    case "diary": return "Private journaling with AI prompts and encryption.";
    case "mood": return "Daily check-ins, trends, and AI insights.";
    default: return "Explore the tools to support your mental wellness.";
  }
}

function overviewContent() {
  return (
    <>
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Mood Snapshot" desc="Recent check-ins & trendline" color="teal" icon={<ChartBar />} />
        <Card title="Next Sessions" desc="Upcoming appointments & reminders" color="amber" icon={<Clock />} />
        <Card title="Journal Highlights" desc="Important entries suggested" color="indigo" icon={<MessageSquare />} />
      </div>

      <div className="mt-6 p-4 rounded-xl bg-linear-to-tr from-white to-[#F7FFF8] border">
        <h4 className="font-semibold">Quick Action</h4>
        <p className="text-sm text-gray-600 mt-2">Try a 3-minute breathing exercise to reduce immediate stress. <span className="text-teal-600 font-medium">Start now →</span></p>
      </div>
    </>
  );
}

function therapyContent() {
  return (
    <div className="space-y-4">
      <p className="text-gray-700">Find therapists matched to your needs, book online or in-person, and add to your calendar.</p>
      <button className="mt-3 px-4 py-2 rounded-lg bg-teal-500 text-white shadow hover:scale-[1.02]">Book a Session</button>
    </div>
  );
}

function diaryContent() {
  return (
    <div>
      <textarea className="w-full rounded-xl border p-4 min-h-[180px]" placeholder="Write a private reflection..."></textarea>
      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-gray-500">Saved locally & encrypted.</div>
        <button className="px-4 py-2 rounded-lg bg-teal-500 text-white">Save Entry</button>
      </div>
    </div>
  );
}

function moodContent() {
  return (
    <div className="space-y-4">
      <p className="text-gray-700">Tap an emoji or use the slider to record your mood. Get AI insights over time.</p>
      <div className="flex gap-2 items-center mt-2">
        {["😭","😟","😐","🙂","😊"].map((e,i)=>(<button key={i} className="text-2xl p-3 rounded-xl bg-white/60 border">{e}</button>))}
      </div>
    </div>
  );
}

function communityContent() { return <p className="text-gray-700">Join moderated, anonymous circles and find peer support.</p>; }
function wellnessContent() { return <p className="text-gray-700">Meditations, habit trackers, CBT exercises and guided programs.</p>; }
function retreatsContent() { return <p className="text-gray-700">Browse upcoming wellness retreats and events.</p>; }
function securityContent() { return <p className="text-gray-700">Privacy-first design: encrypted entries, anonymous profiles, and opt-in data sharing.</p>; }
function gamificationContent() { return <p className="text-gray-700">Streaks, badges, and a Mind Garden that grows with your progress.</p>; }
function aiContent() { return <p className="text-gray-700">Companion chat trained for empathetic, non-judgmental conversation.</p>; }
function adminContent() { return <p className="text-gray-700">Therapist & admin tools for managing sessions and community.</p>; }

function Card({ title, desc, color, icon }) {
  const colors = { teal: "from-teal-50 to-white", amber: "from-amber-50 to-white", indigo: "from-indigo-50 to-white" };
  return (
    <div className={`p-4 rounded-xl border bg-linear-to-tr ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="mt-1 font-medium text-gray-800">{desc}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/60">{icon}</div>
      </div>
    </div>
  );
}
