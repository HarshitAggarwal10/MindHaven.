"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Square } from "lucide-react";

const PHASES = [
  { label: "Breathe in gently", seconds: 4 },
  { label: "Pause if comfortable", seconds: 2 },
  { label: "Breathe out slowly", seconds: 6 },
];

export default function BreathingGuide() {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(PHASES[0].seconds);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setRemaining((current) => {
        if (current > 1) return current - 1;
        setPhaseIndex((index) => (index + 1) % PHASES.length);
        return PHASES[(phaseIndex + 1) % PHASES.length].seconds;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phaseIndex, running]);

  const stop = () => {
    setRunning(false);
    setPhaseIndex(0);
    setRemaining(PHASES[0].seconds);
  };

  return (
    <section className="mt-5 rounded-2xl border border-teal-100 bg-[#f2faf6] p-5" aria-label="Breathing guide">
      <p className="text-sm font-semibold text-teal-950">Optional breathing guide</p>
      <p className="mt-1 text-sm text-slate-600" aria-live="polite">
        {running ? `${PHASES[phaseIndex].label} · ${remaining} seconds` : "Follow a gentle rhythm, and return to normal breathing whenever you prefer."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRunning((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "Pause" : "Start"}
        </button>
        <button type="button" onClick={stop} className="inline-flex items-center gap-2 rounded-full border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-white">
          <Square size={15} /> Stop
        </button>
        <button type="button" onClick={stop} className="inline-flex items-center gap-2 rounded-full border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-white">
          <RotateCcw size={15} /> Reset
        </button>
      </div>
    </section>
  );
}
