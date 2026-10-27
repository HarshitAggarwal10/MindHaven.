"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, HeartHandshake, LockKeyhole, ShieldAlert, UserRound } from "lucide-react";
import CommunityIcon from "./CommunityIcon";

export default function JoinCommunityDialog({ community, open, onClose, onJoin, joining = false, joinError = "" }) {
  const [step, setStep] = useState("consent");
  const [displayAnonymously, setDisplayAnonymously] = useState(true);
  const [respectAgreement, setRespectAgreement] = useState(false);

  if (!open || !community) return null;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onMouseDown={(event) => {
      if (event.target === event.currentTarget && !joining) onClose();
      }}
      role="presentation"
    >
      <motion.section
        aria-labelledby="join-community-title"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-[#fffdf9] p-6 shadow-[0_28px_90px_-25px_rgba(31,93,84,0.4)] sm:p-8"
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <CommunityIcon className="h-14 w-14" name={community.name} size={28} slug={community.slug} />
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">A gentle space to connect</p>
              <h2 id="join-community-title" className="font-[Quicksand] text-2xl font-bold text-slate-800">{community.name}</h2>
            </div>
          </div>
          <button aria-label="Close" className="rounded-full p-2 text-slate-400 transition-colors hover:bg-teal-50 hover:text-teal-800" disabled={joining} onClick={onClose} type="button">
            <span aria-hidden="true" className="text-xl leading-none">×</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
        {step === "consent" ? (
          <motion.div key="consent" animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} initial={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <HeartHandshake className="text-teal-700" size={18} />
              Community care starts with us
            </div>
            <p className="leading-7 text-slate-600">
              Before joining, please help us keep this a caring, respectful community. By continuing, you agree to treat others with kindness, respect their privacy, and understand that peer support is not a substitute for professional care.
            </p>
            <div className="mt-5 flex gap-3 rounded-2xl border border-amber-100 bg-[#FFF8ED] p-4 text-sm leading-6 text-amber-950">
              <ShieldAlert className="mt-0.5 shrink-0 text-amber-700" size={20} />
              <span>If you or someone else is in immediate danger, contact local emergency services or a trusted crisis-support service. This community is not monitored as an emergency service.</span>
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm leading-6 text-slate-700 transition-colors hover:bg-teal-50">
              <input
                checked={respectAgreement}
                className="mt-1 size-4 accent-teal-700"
                onChange={(event) => setRespectAgreement(event.target.checked)}
                type="checkbox"
              />
              <span>I agree to be respectful, protect other members&apos; privacy, and share support without judgment.</span>
            </label>
            <div className="mt-7 flex justify-end gap-3">
              <button className="rounded-full px-5 py-3 font-semibold text-slate-600 transition-colors hover:bg-slate-100" onClick={onClose} type="button">Not now</button>
              <button className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-3 font-semibold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50" disabled={!respectAgreement} onClick={() => setStep("identity")} type="button">
                I understand
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" size={17} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="identity" animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} initial={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <LockKeyhole className="text-teal-700" size={18} />
              Your identity, your choice
            </div>
            <p className="mb-5 text-slate-600">Choose how your name will appear in this community. You can update your choice whenever you rejoin.</p>
            <div className="space-y-3">
              <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition duration-200 ${displayAnonymously ? "border-teal-400 bg-[#EAF8F2] shadow-sm" : "border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40"}`}>
                <input checked={displayAnonymously} className="mt-1 accent-teal-600" name="community-identity" onChange={() => setDisplayAnonymously(true)} type="radio" />
                <span>
                  <span className="flex items-center gap-2 font-semibold text-slate-800"><LockKeyhole className="text-teal-700" size={17} /> Stay anonymous</span>
                  <span className="mt-1 block text-sm text-slate-600">A private community nickname will be shown instead of your signup name.</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition duration-200 ${!displayAnonymously ? "border-teal-400 bg-[#EAF8F2] shadow-sm" : "border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40"}`}>
                <input checked={!displayAnonymously} className="mt-1 accent-teal-600" name="community-identity" onChange={() => setDisplayAnonymously(false)} type="radio" />
                <span>
                  <span className="flex items-center gap-2 font-semibold text-slate-800"><UserRound className="text-emerald-700" size={17} /> Use my signup name</span>
                  <span className="mt-1 block text-sm text-slate-600">Other members will see the name associated with your account.</span>
                </span>
              </label>
            </div>
            {joinError && (
              <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800" role="alert">
                {joinError}
                {joinError.includes("sign in again") && (
                  <Link className="ml-1 font-bold underline underline-offset-2" href="/login">Sign in</Link>
                )}
              </p>
            )}
            <div className="mt-7 flex justify-between gap-3">
              <button className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-slate-600 transition-colors hover:bg-slate-100" disabled={joining} onClick={() => setStep("consent")} type="button"><ArrowLeft size={17} /> Back</button>
              <button aria-busy={joining} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-3 font-semibold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-wait disabled:opacity-60" disabled={joining} onClick={() => onJoin(displayAnonymously)} type="button">
                {joining ? "Joining..." : "Join community"}
                {!joining && <Check size={17} />}
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}
