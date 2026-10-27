"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircleHeart, Sparkles } from "lucide-react";

const COMPANION_URL =
  "https://app.gpt-trainer.com/widget/8604f23ef96040eda432f7bd80d49440";

export default function CompanionSection() {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36 }}
      className="space-y-5"
    >
      <header className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-[#eef8f3] via-white to-[#fff7e9] p-5 shadow-[0_12px_36px_rgba(42,91,80,0.07)] sm:p-7">
        <div className="pointer-events-none absolute -right-7 -top-10 size-40 rounded-full bg-teal-100/70 blur-2xl" aria-hidden="true" />
        <div className="relative flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/80 text-teal-800 shadow-sm">
            <MessageCircleHeart size={23} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">
              <Sparkles size={13} aria-hidden="true" /> MindHaven companion
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-800 sm:text-2xl">A gentle space to talk</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Share what’s on your mind, or start with a small question. The companion can offer a listening ear and mindful prompts; it isn’t a replacement for professional care.
            </p>
          </div>
          <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full border border-emerald-100 bg-white/75 px-3 py-1.5 text-xs font-medium text-emerald-800 sm:inline-flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Ready when you are
          </span>
        </div>
      </header>

      <section className="overflow-hidden rounded-[1.75rem] border border-[#e5eee8] bg-white shadow-[0_14px_38px_rgba(42,91,80,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-[#fbfdfb] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><Heart size={16} /></span>
            Your private conversation
          </div>
          <p className="text-xs text-slate-500">Take your time. You can begin with “I’m feeling…”</p>
        </div>
        <div className="relative h-[min(72vh,680px)] min-h-[440px] bg-[#fbfdfb] sm:min-h-[560px]">
          {!loaded && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#fbfdfb] p-6 text-center" role="status">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
                <MessageCircleHeart size={23} className="animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Opening your calm corner…</p>
              <p className="max-w-sm text-xs leading-5 text-slate-500">The conversation panel is connecting. Response speed depends on the chat service.</p>
            </div>
          )}
          <iframe
            src={COMPANION_URL}
            title="MindHaven AI companion chat"
            className="relative z-0 size-full border-0"
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded(true)}
            allow="clipboard-write"
          />
        </div>
      </section>
    </motion.section>
  );
}
