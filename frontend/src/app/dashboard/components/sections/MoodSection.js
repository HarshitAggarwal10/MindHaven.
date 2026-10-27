"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Check,
  ChevronDown,
  Circle,
  CloudSun,
  Footprints,
  Heart,
  HandHeart,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  MessageCircleHeart,
  PartyPopper,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Shuffle,
  Trash2,
  X,
  Wind,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  analyzeMoodText,
  createMoodCheckIn,
  deleteMoodAnalysis,
  deleteMoodCheckIn,
  getMoodAnalysis,
  getMoodConfig,
  getMoodHistory,
  getMoodStats,
  updateMoodCheckIn,
} from "@/lib/mood-api";

const MOODS = [
  { id: "very_low", label: "Low", note: "A harder moment", Icon: CloudSun },
  { id: "low", label: "A little low", note: "Taking it slowly", Icon: Circle },
  { id: "steady", label: "Steady", note: "Somewhere in the middle", Icon: Activity },
  { id: "good", label: "Good", note: "A little lighter", Icon: Heart },
  { id: "very_good", label: "Very good", note: "Feeling bright", Icon: Sparkles },
];

const EMOTIONS = ["anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise"];
const EMOTION_LABELS = {
  anger: "Anger",
  disgust: "Disgust",
  fear: "Fear",
  joy: "Joy",
  neutral: "Neutral",
  sadness: "Sadness",
  surprise: "Surprise",
};
const MOOD_LABELS = Object.fromEntries(MOODS.map(({ id, label }) => [id, label]));

const SUPPORT_IDEAS = {
  very_low: [
    {
      id: "ground",
      title: "A soft landing",
      Icon: Footprints,
      description: "Try a small grounding pause. There is no need to fix everything right now.",
      steps: [
        "Notice five things you can see, at your own pace.",
        "Notice four things you can feel against your body.",
        "Listen for three sounds around you.",
        "Notice two scents, or two breaths if there are no clear scents.",
        "Notice one small thing that could make the next few minutes gentler.",
      ],
      complete: "I gave myself a moment",
    },
    {
      id: "tiny-step",
      title: "One tiny kindness",
      Icon: Sun,
      description: "Choose one low-effort action. A small step is enough; rest is also allowed.",
      steps: [
        "Pick one: sip some water, sit by a window, stretch gently, or step outside for one minute.",
        "Do only that one thing. You do not need to turn it into a bigger task.",
        "Notice whether you want anything else, or whether this is enough for now.",
      ],
      complete: "I took one small step",
    },
    {
      id: "reach-out",
      title: "Let someone in",
      Icon: HandHeart,
      description: "If it feels right, make a small connection with someone you trust.",
      steps: [
        "You could send: “I’m having a rough moment. Could you keep me company or check in later?”",
        "You do not need to explain everything. A simple hello counts.",
        "If no one is available, choose another gentle idea here or a local support resource.",
      ],
      complete: "I reached out, or chose another kind step",
    },
  ],
  low: [
    {
      id: "ground",
      title: "A soft landing",
      Icon: Footprints,
      description: "Give your attention a gentle place to rest.",
      steps: [
        "Notice five things you can see, at your own pace.",
        "Notice four things you can feel against your body.",
        "Listen for three sounds around you.",
        "Notice two scents, or two breaths if there are no clear scents.",
        "Notice one small thing that could make the next few minutes gentler.",
      ],
      complete: "I gave myself a moment",
    },
    {
      id: "tiny-step",
      title: "A little reset",
      Icon: Sun,
      description: "A small change of pace can be enough for this moment.",
      steps: [
        "Pick one: sip some water, sit by a window, stretch gently, or step outside for one minute.",
        "Let that be the whole activity. No need to do more.",
      ],
      complete: "I tried a small reset",
    },
    {
      id: "reach-out",
      title: "Share a little",
      Icon: HandHeart,
      description: "Connection can be simple and on your terms.",
      steps: [
        "You could text someone you trust: “Could we talk for a few minutes today?”",
        "A short message is enough. You can decide what to share.",
      ],
      complete: "I reached out or saved the idea",
    },
  ],
  steady: [
    {
      id: "notice",
      title: "Check what you need",
      Icon: Lightbulb,
      description: "A steady moment is a good time to notice what would support you.",
      steps: [
        "Ask yourself: do I need rest, movement, food or water, company, or a little quiet?",
        "Choose one small thing that fits the answer.",
      ],
      complete: "I checked in with myself",
    },
    {
      id: "outside",
      title: "A change of scene",
      Icon: Footprints,
      description: "Move gently or notice the world around you, if that feels comfortable.",
      steps: [
        "Look out of a window or step outside for a minute.",
        "Notice one color, one sound, and how the air feels.",
      ],
      complete: "I took a noticing break",
    },
    {
      id: "connection",
      title: "A small connection",
      Icon: HandHeart,
      description: "A little human connection can add warmth to an ordinary day.",
      steps: [
        "Send someone a quick hello, share a song, or thank them for something small.",
        "Keep it easy and genuine. There is no pressure to get a particular response.",
      ],
      complete: "I made a small connection",
    },
  ],
  good: [
    {
      id: "savor",
      title: "Save a bright moment",
      Icon: Sun,
      description: "Let a good moment have a little more room.",
      steps: [
        "Think of one thing that felt good today, however small.",
        "Pause and notice what made it meaningful to you.",
        "If you like, write one sentence so you can remember it later.",
      ],
      complete: "I took a moment to savor it",
    },
    {
      id: "kindness",
      title: "Pass the warmth along",
      Icon: HandHeart,
      description: "Share a little of what is going well, with no expectation in return.",
      steps: [
        "Send someone a sincere thank-you, a kind message, or a small word of encouragement.",
        "Notice how it feels to offer kindness, whatever the response may be.",
      ],
      complete: "I shared a little kindness",
    },
    {
      id: "grow",
      title: "One step toward something you care about",
      Icon: Footprints,
      description: "Use a bit of today's energy in a way that matters to you.",
      steps: [
        "Choose something you care about: learning, creativity, health, or connection.",
        "Pick a step that takes ten minutes or less.",
        "Decide when you might try it. A small step is still meaningful.",
      ],
      complete: "I chose a next step",
    },
  ],
  very_good: [
    {
      id: "savor",
      title: "Make joy memorable",
      Icon: Sun,
      description: "You can appreciate a good moment without needing to hold onto it forever.",
      steps: [
        "Name one thing you are enjoying right now.",
        "Notice what helped make it possible, including your own effort or care.",
        "Take a breath and let this moment be enough.",
      ],
      complete: "I made room to appreciate it",
    },
    {
      id: "kindness",
      title: "Create a ripple",
      Icon: HandHeart,
      description: "A small gesture can make someone else's day feel a little warmer.",
      steps: [
        "Offer a genuine compliment, share something useful, or check in with someone.",
        "Keep it simple and let the kindness be its own reward.",
      ],
      complete: "I shared a positive moment",
    },
    {
      id: "grow",
      title: "Channel this energy",
      Icon: Footprints,
      description: "Put a little of this energy toward a hope or goal that matters to you.",
      steps: [
        "Think of one thing you would like to make, learn, or experience.",
        "Choose one small action you can take today or this week.",
        "Celebrate beginning, rather than waiting for a perfect result.",
      ],
      complete: "I chose a meaningful next step",
    },
  ],
};

const MOOD_COMPANIONS = {
  sadness: {
    Icon: PartyPopper,
    label: "A tiny silly interruption",
    title: "The Department of Extremely Unnecessary News",
    intro: "Today's completely fictional bulletin:",
    moments: [
      "A pigeon has been promoted to Head of Snack Security. It has misplaced the clipboard.",
      "Your houseplant has started a podcast called “Water? In This Economy?” Episode one is mostly leaf sounds.",
      "A cloud has filed a complaint for being out-dramatized by the weather forecast.",
      "An extremely polite raccoon says doing your best counts, even if your socks disagree with each other.",
      "Breaking news: a tiny frog in a tiny raincoat says you can take this one moment at a time. The frog has no further comment.",
    ],
    action: "Another absurd bulletin",
    note: "No pressure to laugh or feel better. This is just a small, silly interruption if you want one.",
  },
  anger: {
    Icon: Wind,
    label: "A little room to breathe",
    title: "Let’s turn down the volume, not dismiss the feeling",
    intro: "Try these small steps at your own pace. You can stop whenever you like.",
    steps: [
      "Unclench your jaw if you notice it is tight, and let your shoulders drop a little.",
      "Take a comfortable breath in. No need to make it deep or force a rhythm.",
      "Let your next exhale be soft and a little slower than the inhale.",
      "Name what you need right now: space, to be heard, a pause, or help with one next step.",
    ],
    action: "Next gentle step",
    done: "You made a little space for yourself. The feeling can still matter.",
    note: "This is a pause, not a demand to forgive, agree, or pretend everything is okay.",
  },
  fear: {
    Icon: Footprints,
    label: "Come back to this moment",
    title: "A small here-and-now anchor",
    intro: "Let’s give your attention a few steady things to land on.",
    steps: [
      "Notice three things you can see, and pick one color you like.",
      "Notice two things supporting your body: a chair, the floor, or your clothes.",
      "Listen for one nearby sound, then one farther away.",
      "Ask: what is one small, kind next step I can choose in this moment?",
    ],
    action: "Next grounding step",
    done: "You took a moment to notice where you are. That is enough for now.",
    note: "You can keep your eyes open and skip anything that does not feel comfortable.",
  },
  joy: {
    Icon: Sparkles,
    label: "A joy-sized side quest",
    title: "Your good mood just unlocked a bonus level",
    intro: "Choose one tiny mission—or simply enjoy the ridiculous headline:",
    moments: [
      "A committee of ducks reviewed your vibe and issued one official stamp: “rather splendid.”",
      "Nearby plants are standing a little taller. They refuse to explain why.",
      "Your good mood has been spotted doing laps in a tiny cape. No permits were filed.",
      "Scientists confirm your joy is legally allowed to wear sunglasses indoors.",
      "A pop-up bakery has opened in your brain. Today's special: one completely unnecessary celebratory cake.",
    ],
    action: "Deal me another side quest",
    note: "Good moments do not need to be productive. You are allowed to enjoy one just because.",
  },
  steady: {
    Icon: Sparkles,
    label: "A curious little reset",
    title: "A 20-second side quest for an ordinary moment",
    intro: "Pick one small thing to notice—no mood upgrade required:",
    steps: [
      "Find the most interesting shape in the room. A mug counts.",
      "Notice one sound you usually ignore. It may be the room's tiny soundtrack.",
      "Imagine the nearest object has a very boring job title. The spoon is probably “Assistant Manager.”",
    ],
    action: "Another tiny quest",
    done: "Side quest complete. Your surroundings remain delightfully ordinary.",
    note: "You can keep it playful, skip it, or go right back to your day.",
  },
  surprise: {
    Icon: Sparkles,
    label: "A moment to get your bearings",
    title: "Unexpected plot twist? Take a beat",
    intro: "You do not have to decide what it means right away.",
    steps: [
      "Notice what changed, just as a simple fact.",
      "Check what you need first: more information, a pause, or someone to talk it through with.",
      "Choose one next step that feels manageable—not the whole plan.",
    ],
    action: "Next small step",
    done: "You gave yourself time to respond rather than rush.",
    note: "Surprise can feel exciting, unsettling, or both. You get to decide what fits.",
  },
  disgust: {
    Icon: CloudSun,
    label: "A gentle sensory reset",
    title: "Change one small thing around you",
    intro: "If something feels unpleasant or overwhelming, try a simple reset:",
    steps: [
      "Move away from the thing if you can, or look toward a neutral object.",
      "Take a sip of water or notice a comfortable texture nearby.",
      "Ask what boundary or small change would make this moment easier.",
    ],
    action: "Next gentle step",
    done: "You checked what would help you feel more comfortable.",
    note: "You do not need to explain or justify what feels uncomfortable.",
  },
  neutral: {
    Icon: Sun,
    label: "A low-pressure check-in",
    title: "No big feelings required",
    intro: "Try a tiny needs check, without turning it into homework:",
    steps: [
      "Would a little water, food, movement, quiet, or company help?",
      "Pick the easiest option—or decide that you are okay as you are.",
      "If you chose something, make it pleasantly small.",
    ],
    action: "Next small step",
    done: "You checked in with yourself. No further action required.",
    note: "Neutral is a real place to be. You do not have to make it more interesting.",
  },
};

function MoodCompanionCard({ mood, emotion }) {
  const [momentIndex, setMomentIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const moodToCompanion = {
    very_low: "sadness",
    low: "sadness",
    steady: "steady",
    good: "joy",
    very_good: "joy",
  };
  const companionKey = moodToCompanion[mood] || emotion;
  const companion = MOOD_COMPANIONS[companionKey];
  if (!companion) return null;

  const { Icon, moments, steps } = companion;
  const isLastStep = steps && stepIndex === steps.length - 1;

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
      className={`relative overflow-hidden rounded-3xl border p-5 shadow-[0_8px_28px_rgba(42,91,80,0.06)] sm:p-6 ${
        companionKey === "anger"
          ? "border-[#D9EAE9] bg-gradient-to-br from-[#EFF9F8] via-white to-[#F1F6FF]"
          : companionKey === "fear"
            ? "border-[#DFE4F4] bg-gradient-to-br from-[#F3F5FF] via-white to-[#EFF9F8]"
            : companionKey === "sadness"
              ? "border-[#F0E5D8] bg-gradient-to-br from-[#FFF9F1] via-white to-[#F7F4FF]"
              : companionKey === "joy"
                ? "border-[#E6F1ED] bg-gradient-to-br from-[#F1FBF6] via-white to-[#FFF8E8]"
                : "border-[#E6F1ED] bg-gradient-to-br from-[#F5FBF8] via-white to-[#FFF9EC]"
      }`}
      aria-labelledby="mood-companion-title"
    >
      <div className="pointer-events-none absolute -right-5 -top-7 text-teal-900/[0.06]" aria-hidden="true">
        <Icon size={132} strokeWidth={1} />
      </div>
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-white/80 bg-white/80 p-3 text-teal-800 shadow-sm">
            <Icon size={22} aria-hidden="true" />
          </div>
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">
              <Sparkles size={15} aria-hidden="true" />
              {companion.label}
            </p>
            <h3 id="mood-companion-title" className="mt-2 text-lg font-semibold text-slate-800">
              {companion.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{companion.intro}</p>
          </div>
        </div>

        {moments ? (
          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-white/80 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-12 max-w-2xl">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${companionKey}-${momentIndex}`}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -5 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                  className="text-sm font-medium leading-6 text-slate-700"
                  aria-live="polite"
                >
                  {moments[momentIndex % moments.length]}
                </motion.p>
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => setMomentIndex((current) => (current + 1) % moments.length)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-900 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-[#F7FCFA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:self-center"
            >
              <Shuffle size={16} aria-hidden="true" />
              {companion.action}
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/80 bg-white/80 p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EFF8F4] text-sm font-semibold text-teal-900">
                {isLastStep ? <Check size={17} aria-hidden="true" /> : stepIndex + 1}
              </span>
              <div className="min-h-12 flex-1" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${companionKey}-${stepIndex}`}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -5 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                    className="text-sm leading-6 text-slate-700"
                  >
                    {isLastStep ? companion.done : steps[stepIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-5 text-slate-500">{companion.note}</p>
              <button
                type="button"
                onClick={() => setStepIndex((current) => (isLastStep ? 0 : current + 1))}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#276F64] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1D5D53] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
              >
                {isLastStep ? <RotateCcw size={15} aria-hidden="true" /> : <ArrowUpRight size={15} aria-hidden="true" />}
                {isLastStep ? "Start again, if you like" : companion.action}
              </button>
            </div>
          </div>
        )}
        {moments && (
          <p className="relative mt-3 text-xs leading-5 text-slate-500">{companion.note}</p>
        )}
      </div>
    </motion.section>
  );
}

function MoodLiftCard({ mood }) {
  const ideas = SUPPORT_IDEAS[mood] || [];
  const [activeIdea, setActiveIdea] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [completedIdeas, setCompletedIdeas] = useState([]);

  if (!mood || ideas.length === 0) return null;

  function chooseIdea(idea) {
    setActiveIdea(idea);
    setStepIndex(0);
  }

  return (
    <section
      className="rounded-3xl border border-[#E6F1ED] bg-gradient-to-br from-[#F5FBF8] via-white to-[#FFF9EC] p-5 shadow-[0_8px_28px_rgba(42,91,80,0.06)] sm:p-7"
      aria-labelledby="mood-lift-title"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white p-2.5 text-teal-800 shadow-sm">
          <Lightbulb size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">
            Small steps, your way
          </p>
          <h3 id="mood-lift-title" className="mt-1 text-lg font-semibold text-slate-800">
            {mood === "good" || mood === "very_good"
              ? "Want to build on this good moment?"
              : mood === "steady"
                ? "What might support you right now?"
                : "Feeling low? You don’t have to force a brighter mood."}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            These gentle, optional ideas are here to offer a next step—not to diagnose you or replace support.
            Pick one, or skip them all.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {ideas.map(({ id, title, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => chooseIdea(ideas.find((idea) => idea.id === id))}
            aria-pressed={activeIdea?.id === id}
            className={`flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              activeIdea?.id === id
                ? "border-teal-400 bg-white shadow-sm"
                : "border-[#E4EEEA] bg-white/75 hover:border-teal-200 hover:bg-white"
            }`}
          >
            <Icon size={19} className="mt-0.5 shrink-0 text-teal-800" aria-hidden="true" />
            <span>
              <span className="block text-sm font-semibold text-slate-800">{title}</span>
              {completedIdeas.includes(id) && (
                <span className="mt-1 block text-xs text-teal-800">Tried by you</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {activeIdea && (
        <div className="mt-4 rounded-2xl border border-teal-100 bg-white p-5" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-slate-800">{activeIdea.title}</h4>
              <p className="mt-1 text-sm text-slate-600">{activeIdea.description}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const alternatives = ideas.filter((idea) => idea.id !== activeIdea.id);
                chooseIdea(alternatives[Math.floor(Math.random() * alternatives.length)]);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-teal-900 underline-offset-2 hover:bg-teal-50 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              <RotateCcw size={14} aria-hidden="true" /> Another idea
            </button>
          </div>
          <ol className="mt-4 space-y-2">
            {activeIdea.steps.map((step, index) => (
              <li
                key={step}
                className={`flex gap-3 rounded-xl p-3 text-sm leading-6 ${
                  index === stepIndex ? "bg-[#EFF8F4] text-slate-800" : "text-slate-600"
                }`}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-teal-900">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {completedIdeas.includes(activeIdea.id) ? (
            <p className="mt-4 rounded-xl bg-[#EFF8F4] p-3 text-sm text-teal-900" role="status">
              You gave yourself a moment. That counts—there’s nothing more you need to do here.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {stepIndex < activeIdea.steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStepIndex((current) => current + 1)}
                  className="rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
                >
                  Next gentle step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCompletedIdeas((current) => [...current, activeIdea.id])}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
                >
                  <Heart size={16} aria-hidden="true" />
                  {activeIdea.complete}
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveIdea(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
              >
                Maybe later
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ScoreBars({ scores }) {
  if (!scores) return null;

  return (
    <div className="space-y-3" aria-label="Classifier scores">
      {EMOTIONS.map((emotion) => {
        const score = Number(scores[emotion] || 0);
        const percent = Math.round(score * 100);
        return (
          <div key={emotion}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium capitalize text-slate-700">
                {EMOTION_LABELS[emotion]}
              </span>
              <span className="text-slate-500">{percent}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-teal-50"
              role="progressbar"
              aria-label={`${EMOTION_LABELS[emotion]} classifier score`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div
                className="h-full rounded-full bg-teal-500 transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DailyBars({ daily }) {
  const maxCount = Math.max(
    1,
    ...daily.map((day) => day.self_reported_count + day.ai_analysis_count),
  );

  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3">
      {daily.map((day) => {
        const total = day.self_reported_count + day.ai_analysis_count;
        const height = total ? Math.max(8, (total / maxCount) * 76) : 0;
        const label = new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, {
          weekday: "short",
        });
        return (
          <div
            key={day.date}
            className="flex min-w-0 flex-col items-center gap-2"
            role="img"
            aria-label={`${day.date}: ${day.self_reported_count} self-reported check-ins, ${day.ai_analysis_count} AI analyses`}
          >
            <span className="text-xs text-slate-500">{total || ""}</span>
            <div className="flex h-20 w-full items-end justify-center gap-1 rounded-xl bg-[#F4FBF9] px-1">
              {total > 0 && (
                <>
                  <span
                    className="w-2/5 rounded-t-md bg-teal-500"
                    style={{
                      height: `${(day.self_reported_count / maxCount) * 76}px`,
                    }}
                    title={`${day.self_reported_count} self-reported check-ins`}
                  />
                  <span
                    className="w-2/5 rounded-t-md bg-amber-300"
                    style={{
                      height: `${(day.ai_analysis_count / maxCount) * 76}px`,
                    }}
                    title={`${day.ai_analysis_count} AI analyses`}
                  />
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-500">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function AnalysisDialog({ analysis, loading, error, onClose, onDelete }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    dialogRef.current?.querySelector("button")?.focus();
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  const handleDialogKeyDown = (event) => {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-dialog-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white bg-[#FBFEFD] p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Private analysis
            </p>
            <h3 id="analysis-dialog-title" className="mt-2 text-xl font-semibold text-slate-800">
              Saved classifier result
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close analysis details"
            className="rounded-full p-2 text-slate-500 transition hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            <X size={20} />
          </button>
        </div>
        {loading ? (
          <div className="flex items-center gap-3 py-10 text-slate-600" role="status">
            <LoaderCircle className="animate-spin text-teal-700" size={20} />
            Loading saved analysis
          </div>
        ) : error ? (
          <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900" role="alert">
            {error}
          </p>
        ) : analysis ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl bg-teal-50/80 p-5">
              <p className="text-sm text-slate-600">
                Strongest classifier signal
              </p>
              <p className="mt-1 text-2xl font-semibold capitalize text-teal-900">
                {EMOTION_LABELS[analysis.primary_emotion] || analysis.primary_emotion}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{analysis.summary}</p>
              <p className="mt-2 text-xs text-slate-500">
                Classifier score: {Math.round(analysis.confidence * 100)}% — not a medical probability.
              </p>
            </div>
            <ScoreBars scores={analysis.emotion_scores} />
            {analysis.themes?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-800">Other model signals</h4>
                <p className="mt-1 text-sm text-slate-600">
                  {analysis.themes.map((theme) => EMOTION_LABELS[theme] || theme).join(", ")}
                </p>
              </div>
            )}
            {analysis.suggestions?.length > 0 && (
              <div className="rounded-2xl border border-[#E8F2EE] bg-white p-5">
                <h4 className="font-semibold text-slate-800">Optional gentle ideas</h4>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {analysis.suggestions.map((suggestion) => (
                    <li key={suggestion} className="flex gap-2">
                      <Heart size={16} className="mt-1 shrink-0 text-teal-700" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs leading-5 text-slate-500">
              {analysis.model_identifier}
              {analysis.model_version ? ` · ${analysis.model_version}` : ""}
            </p>
            <button
              type="button"
              onClick={() => onDelete(analysis.id)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-rose-50 hover:text-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              <Trash2 size={16} /> Delete this analysis
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default function MoodSection() {
  const reducedMotion = useReducedMotion();
  const [selectedMood, setSelectedMood] = useState("");
  const [savedMood, setSavedMood] = useState("");
  const [editingCheckIn, setEditingCheckIn] = useState(null);
  const [savingCheckIn, setSavingCheckIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState(null);
  const [entryText, setEntryText] = useState("");
  const [consent, setConsent] = useState(false);
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState("");
  const [configLoading, setConfigLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(7);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const idempotencyKey = useRef(null);

  const refreshProviderConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError("");
    try {
      setConfig(await getMoodConfig());
    } catch (error) {
      setConfig(null);
      setConfigError(error.message || "AI settings are unavailable.");
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProviderConfig();
  }, [refreshProviderConfig]);

  useEffect(() => {
    let active = true;
    setDataLoading(true);
    setDataError("");
    Promise.all([getMoodHistory(days, 50), getMoodStats(days)])
      .then(([nextHistory, nextStats]) => {
        if (!active) return;
        setHistory(nextHistory);
        setStats(nextStats);
      })
      .catch((error) => {
        if (active) setDataError(error.message || "Your mood history could not be loaded.");
      })
      .finally(() => {
        if (active) setDataLoading(false);
      });
    return () => {
      active = false;
    };
  }, [days, refreshVersion]);

  async function saveCheckIn() {
    if (!selectedMood) return;
    setSavingCheckIn(true);
    setCheckInMessage(null);
    try {
      if (editingCheckIn) {
        await updateMoodCheckIn(editingCheckIn, selectedMood);
      } else {
        await createMoodCheckIn(selectedMood);
      }
      setSavedMood(selectedMood);
      setSelectedMood("");
      setEditingCheckIn(null);
      setCheckInMessage({
        type: "success",
        text: "Your self-reported check-in has been saved.",
      });
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      setCheckInMessage({
        type: "error",
        text: error.message || "Your check-in could not be saved.",
      });
    } finally {
      setSavingCheckIn(false);
    }
  }

  async function submitAnalysis(event) {
    event.preventDefault();
    if (!consent || entryText.trim().length < 20 || !config?.analysis_available) return;
    setAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);
    idempotencyKey.current ||= globalThis.crypto.randomUUID();
    try {
      const result = await analyzeMoodText(
        entryText,
        consent,
        idempotencyKey.current,
      );
      setAnalysis(result);
      setEntryText("");
      setConsent(false);
      idempotencyKey.current = null;
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      setAnalysisError(error.message || "The analysis could not be completed.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function showAnalysis(id) {
    setDetail({ id });
    setDetailLoading(true);
    setDetailError("");
    try {
      setDetail(await getMoodAnalysis(id));
    } catch (error) {
      setDetailError(error.message || "This analysis could not be opened.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function removeHistoryItem(id, type = "analysis") {
    if (!window.confirm("Delete this private mood record? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      if (type === "check-in") {
        await deleteMoodCheckIn(id);
      } else {
        await deleteMoodAnalysis(id);
        setDetail(null);
      }
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      setDataError(error.message || "This mood record could not be deleted.");
    } finally {
      setDeletingId("");
    }
  }

  const maxEmotionCount = Math.max(0, ...Object.values(stats?.ai_emotion_counts || {}));
  const isLocalInference = config?.provider === "local-transformers";
  const providerDisplayName = isLocalInference
    ? "the MindHaven server"
    : config?.provider || "the configured inference provider";

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.35 }}
      className="mood-motion space-y-6"
    >
      <header className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-[#F0FBF8] via-white to-[#FFF9EC] p-6 shadow-[0_12px_36px_rgba(42,91,80,0.08)] sm:p-8">
        <div className="absolute -right-5 -top-8 h-36 w-36 rounded-full bg-[#D8F4E9]/60 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="rounded-2xl bg-white/80 p-3 text-teal-800 shadow-sm">
            <MessageCircleHeart size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
              MindHaven · gentle self-reflection
            </p>
            <h2
              className="mt-2 text-2xl font-semibold text-slate-800 sm:text-3xl"
              style={{ fontFamily: "Quicksand, sans-serif" }}
            >
              Your Emotional Wellbeing
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Understand your emotional patterns, one day at a time. Your check-ins
              are personal and are not shared with your communities.
            </p>
          </div>
          <div className="hidden shrink-0 items-center justify-center sm:flex" aria-hidden="true">
            <svg viewBox="0 0 120 104" className="h-24 w-28">
              <path d="M25 69c-8-4-10-13-5-19 4-5 10-6 15-3 2-12 13-19 24-16 9 2 14 9 14 18 10-3 21 3 21 14 0 9-7 15-17 15H35c-5 0-8-3-10-9Z" fill="#fffdf7" stroke="#8bb8a4" strokeWidth="2" />
              <circle cx="47" cy="58" r="2" fill="#486e62" />
              <circle cx="68" cy="58" r="2" fill="#486e62" />
              <path d="M50 66c4 5 10 5 14 0" fill="none" stroke="#d98977" strokeWidth="2" strokeLinecap="round" />
              <path d="M88 23c0-6 5-11 11-11s11 5 11 11c0 7-11 15-11 15S88 30 88 23Z" fill="#f3c6a9" stroke="#d9957d" strokeWidth="1.5" />
              <path d="M16 84c4-8 9-11 15-10M83 91c3-8 8-11 14-10" fill="none" stroke="#83a98f" strokeWidth="2" strokeLinecap="round" />
              <path d="m22 35 2 4 4 1-4 2-2 4-2-4-4-2 4-1 2-4Z" fill="#e2bb70" />
              <path d="m82 48 1.5 3 3.5 1-3.5 1.5-1.5 3-1.5-3-3.5-1.5 3.5-1 1.5-3Z" fill="#e2bb70" />
            </svg>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#E6F1ED] bg-gradient-to-br from-white via-[#fbfdfb] to-[#f7f5eb] p-5 shadow-[0_10px_32px_rgba(42,91,80,0.06)] sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[#e7f2e7]/60 blur-2xl" aria-hidden="true" />
        <div className="relative flex items-start gap-3">
          <div className="rounded-xl bg-[#EAF8F3] p-2.5 text-teal-800">
            <Heart size={19} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-slate-800">How are you feeling today?</h3>
            <p className="mt-1 text-sm text-slate-600">
              A check-in is entirely yours to choose. It does not use or send any text.
            </p>
          </div>
          <div className="hidden shrink-0 items-center justify-center sm:flex" aria-hidden="true">
            <svg viewBox="0 0 124 90" className="h-[4.5rem] w-28">
              <path d="M61 71c-14-2-24-11-24-24 0-12 9-21 21-22 5-12 19-17 31-10 9 5 12 15 9 25 10 5 13 16 7 25-4 6-10 8-18 7H61Z" fill="#fffdf7" stroke="#90b6a0" strokeWidth="2" />
              <path d="M49 49c2-2 5-2 7 0M75 49c2-2 5-2 7 0" fill="none" stroke="#476d60" strokeWidth="2" strokeLinecap="round" />
              <path d="M59 60c4 4 9 4 13 0" fill="none" stroke="#d88b7d" strokeWidth="2" strokeLinecap="round" />
              <circle cx="49" cy="56" r="3" fill="#efb6a2" opacity=".8" />
              <circle cx="82" cy="56" r="3" fill="#efb6a2" opacity=".8" />
              <path d="M27 67c-7-8-8-17-2-22 7 2 10 8 8 16 7-5 14-4 17 2-4 8-12 10-23 4Zm68 9c3-10 9-15 17-13 3 8-1 15-8 19 8 0 13 5 12 12-8 4-16 0-21-9-1 8-6 13-13 12-3-9 2-16 13-21Z" fill="#b9d1ad" stroke="#83a98e" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="m23 24 2 4 4 1-4 2-2 4-2-4-4-2 4-1 2-4Zm82 2 1.5 3 3.5 1-3.5 1.5-1.5 3-1.5-3-3.5-1.5 3.5-1 1.5-3Z" fill="#dfb96d" />
            </svg>
          </div>
        </div>

        <div
          className="relative mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5"
          role="group"
          aria-label="Choose a self-reported mood"
        >
          {MOODS.map(({ id, label, note, Icon }) => {
            const selected = selectedMood === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setSelectedMood(id);
                  setCheckInMessage(null);
                }}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                  selected
                    ? "border-teal-400 bg-[#EAF8F3] shadow-sm"
                    : "border-[#E9F0ED] bg-white hover:-translate-y-0.5 hover:border-teal-200 hover:bg-[#F8FCFA]"
                }`}
              >
                <span className="rounded-xl bg-white p-2 text-teal-800 shadow-sm">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{note}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveCheckIn}
            disabled={!selectedMood || savingCheckIn}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingCheckIn ? (
              <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
            ) : (
              <Check size={17} aria-hidden="true" />
            )}
            {editingCheckIn ? "Save change" : "Save check-in"}
          </button>
          {editingCheckIn && (
            <button
              type="button"
              onClick={() => {
                setEditingCheckIn(null);
                setSelectedMood("");
              }}
              className="rounded-xl px-3 py-2 text-sm text-slate-600 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              Cancel edit
            </button>
          )}
          {checkInMessage && (
            <p
              className={`text-sm ${checkInMessage.type === "error" ? "text-rose-800" : "text-teal-900"}`}
              role={checkInMessage.type === "error" ? "alert" : "status"}
            >
              {checkInMessage.text}
            </p>
          )}
        </div>
      </section>

      <MoodLiftCard key={`mood-lift-${selectedMood || savedMood || "none"}`} mood={selectedMood || savedMood} />
      <MoodCompanionCard
        key={`mood-companion-${selectedMood || savedMood || (analysis?.status === "success" ? analysis.primary_emotion : "none")}`}
        mood={selectedMood || savedMood}
        emotion={analysis?.status === "success" ? analysis.primary_emotion : ""}
      />

      <section className="rounded-3xl border border-[#E6F1ED] bg-white/90 p-5 shadow-[0_8px_28px_rgba(42,91,80,0.06)] sm:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#FFF7E8] p-2.5 text-amber-800">
            <Sparkles size={19} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Optional AI text reflection</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Share only text you choose to enter below. Saved diary entries are never loaded or
              submitted by this feature, and your submitted text is not stored with the result.
              {isLocalInference
                ? " The model runs locally on the MindHaven backend; your text is not sent to an AI provider."
                : ""}
            </p>
          </div>
        </div>

        <form onSubmit={submitAnalysis} className="mt-5 space-y-4">
          <label htmlFor="mood-analysis-text" className="block text-sm font-semibold text-slate-700">
            Text to reflect on
          </label>
          <textarea
            id="mood-analysis-text"
            value={entryText}
            onChange={(event) => {
              setEntryText(event.target.value);
              idempotencyKey.current = null;
            }}
            maxLength={3000}
            rows={5}
            placeholder="Write or paste a few sentences you would like to reflect on..."
            className="w-full resize-y rounded-2xl border border-[#DDEAE5] bg-[#FCFEFD] px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            aria-describedby="mood-text-guidance mood-text-count"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span id="mood-text-guidance">At least 20 characters; up to 3,000. Avoid names or identifying details.</span>
            <span id="mood-text-count" aria-live="polite">{entryText.length}/3000</span>
          </div>

          <div className="rounded-2xl border border-[#E7EFEA] bg-[#F8FBF9] p-4">
            <div className="flex items-start gap-3">
              <LockKeyhole size={18} className="mt-0.5 shrink-0 text-teal-800" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Before analysis</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {config?.privacy_notice ||
                    "AI processing is not ready until the server's provider settings have been configured and reviewed."}
                </p>
                {config?.provider === "hf-inference" && (
                  <a
                    href="https://huggingface.co/docs/inference-providers/security"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-teal-900 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                  >
                    Review provider privacy and security details
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                )}
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {isLocalInference
                    ? "The model runs on the backend server CPU. The first use downloads public model files; submitted text is processed on that server and is not sent with the download."
                    : "Inference usage may be billable depending on your provider account and plan. Check current pricing before sharing text."}
                </p>
              </div>
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm leading-5 text-slate-700">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 size-4 accent-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              />
              <span>
                {isLocalInference
                  ? "I understand this selected text will be processed by the local model on the MindHaven server, not sent to a hosted AI inference provider. I have reviewed the privacy information above and consent to this request."
                  : (
                    <>
                      I understand this selected text will be sent to{" "}
                      <strong>{providerDisplayName}</strong>{" "}
                      for an emotion-classification estimate. I have reviewed the privacy
                      information above and consent to this request.
                    </>
                  )}
              </span>
            </label>
          </div>

          {configLoading ? (
            <p className="flex items-center gap-2 rounded-xl bg-[#F4F8F6] p-3 text-sm text-slate-700" role="status">
              <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
              Checking AI analysis availability…
            </p>
          ) : (configError || (config && !config.analysis_available)) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status">
              <div className="flex items-start gap-2">
                <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">AI analysis is not ready yet</p>
                  <p className="mt-1 leading-6">
                    {configError ||
                      config?.availability_message ||
                      "The server reports that AI analysis is unavailable. The Analyze button will stay disabled until the server is configured."}
                  </p>
                  {config?.provider === "local-transformers" ? (
                    <>
                      <p className="mt-2 text-xs leading-5">
                        With the backend virtual environment active and your terminal at the repository root, install the CPU build of PyTorch with{" "}
                        <code className="rounded bg-white px-1 py-0.5">python -m pip install torch --index-url https://download.pytorch.org/whl/cpu</code>{" "}
                        followed by{" "}
                        <code className="rounded bg-white px-1 py-0.5">python -m pip install -r backend/requirements-mood-local.txt</code>,
                        then restart Django. The first analysis downloads the model weights to the server cache.
                      </p>
                      <p className="mt-2 text-xs leading-5">
                        No fabricated result will be shown while the local model is unavailable.
                      </p>
                    </>
                  ) : config?.provider === "hf-inference" ? (
                    <>
                      <ol className="mt-2 list-inside list-decimal space-y-1 text-xs leading-5">
                        <li>
                          Create a Hugging Face token with{" "}
                          <a
                            href="https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained"
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold underline underline-offset-2"
                          >
                            Inference Providers permission
                          </a>
                          .
                        </li>
                        <li>
                          Set <code className="rounded bg-white px-1 py-0.5">HUGGINGFACE_API_TOKEN</code>{" "}
                          in <code className="rounded bg-white px-1 py-0.5">backend/.env</code> (never in frontend or chat).
                        </li>
                        <li>Restart Django, then recheck the server configuration below.</li>
                      </ol>
                      <p className="mt-2 text-xs leading-5">
                        Inference availability and usage charges depend on your Hugging Face account and the provider.
                        No fabricated result will be shown if inference is unavailable.
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-xs leading-5">
                      Check that Django is running and the mood configuration endpoint is reachable, then retry.
                      Do not add an inference token to frontend configuration.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={refreshProviderConfig}
                    disabled={configLoading}
                    className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900 disabled:opacity-60"
                  >
                    {configLoading && <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />}
                    I configured it — check again
                  </button>
                </div>
              </div>
            </div>
          )}
          {analysisError && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
              <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{analysisError} Your text remains in this form so you can retry or remove it.</span>
            </p>
          )}
          <button
            type="submit"
            disabled={
              analyzing ||
              configLoading ||
              !consent ||
              entryText.trim().length < 20 ||
              !config?.analysis_available
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#276F64] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D5D53] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                Waiting for the classifier…
              </>
            ) : (
              <>
                <Sparkles size={17} aria-hidden="true" />
                Analyze my entry
              </>
            )}
          </button>
        </form>
      </section>

      <AnimatePresence>
        {analysis && (
          <motion.section
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reducedMotion ? 0 : 0.25 }}
            className="rounded-3xl border border-teal-100 bg-white p-5 shadow-[0_8px_28px_rgba(42,91,80,0.07)] sm:p-7"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
                  {analysis.status === "unclear" ? "Signals unclear" : "Classifier result"}
                </p>
                <h3 className="mt-2 text-2xl font-semibold capitalize text-slate-800">
                  {EMOTION_LABELS[analysis.primary_emotion] || analysis.primary_emotion}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{analysis.summary}</p>
              </div>
              <span className="rounded-full bg-[#EFF8F4] px-3 py-1.5 text-xs font-medium text-teal-900">
                Score {Math.round(analysis.confidence * 100)}% · not a diagnosis
              </span>
              <button
                type="button"
                onClick={() => setAnalysis(null)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 underline-offset-2 hover:bg-teal-50 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
              >
                Dismiss result
              </button>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-800">Emotion classifier scores</h4>
                <ScoreBars scores={analysis.emotion_scores} />
              </div>
              <div className="rounded-2xl bg-[#F8FBF9] p-4">
                <h4 className="text-sm font-semibold text-slate-800">Optional gentle ideas</h4>
                {analysis.suggestions?.length ? (
                  <ul className="mt-3 space-y-3 text-sm leading-5 text-slate-600">
                    {analysis.suggestions.map((suggestion) => (
                      <li key={suggestion} className="flex gap-2">
                        <Heart size={16} className="mt-0.5 shrink-0 text-teal-800" aria-hidden="true" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm leading-5 text-slate-600">
                    The model was unsure. You can use the manual check-in above instead.
                  </p>
                )}
                <p className="mt-4 break-all text-xs text-slate-500">
                  {analysis.model_identifier}
                  {analysis.model_version ? ` · ${analysis.model_version}` : ""}
                </p>
              </div>
            </div>
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-[#FFF9EC] p-3 text-xs leading-5 text-slate-600">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-teal-800" aria-hidden="true" />
              AI text predictions can be inaccurate and may not match your feelings. They are not a
              diagnosis or a medical probability. Your own understanding comes first.
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      <section className="rounded-3xl border border-[#E6F1ED] bg-white/90 p-5 shadow-[0_8px_28px_rgba(42,91,80,0.06)] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">Your own records</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-800">Patterns over time</h3>
            <p className="mt-1 text-sm text-slate-600">
              Self-reported check-ins and AI classifications are counted separately.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span>Period</span>
            <span className="relative">
              <select
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                className="appearance-none rounded-xl border border-[#DDEAE5] bg-white py-2 pl-3 pr-9 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                aria-label="Choose mood history period"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 text-slate-500" size={16} aria-hidden="true" />
            </span>
          </label>
        </div>

        {dataError && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
            <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{dataError} <button type="button" onClick={() => setRefreshVersion((version) => version + 1)} className="underline underline-offset-2">Try again</button></span>
          </p>
        )}
        {dataLoading ? (
          <p className="flex items-center gap-2 py-8 text-sm text-slate-600" role="status">
            <LoaderCircle size={18} className="animate-spin text-teal-800" aria-hidden="true" />
            Loading your private mood history…
          </p>
        ) : stats?.insufficient_data ? (
          <div className="mt-5 rounded-2xl border border-dashed border-teal-200 bg-[#F8FCFA] px-5 py-8 text-center">
            <Heart size={25} className="mx-auto text-teal-700" aria-hidden="true" />
            <p className="mt-3 font-semibold text-slate-800">Your reflections will appear here</p>
            <p className="mt-1 text-sm text-slate-600">
              Save a check-in or choose to analyze text to begin building your own history.
            </p>
          </div>
        ) : stats && (
          <div className="mt-6 grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-teal-500" />Self-reported check-ins</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-300" />AI analyses</span>
              </div>
              <DailyBars daily={stats.daily} />
              <p className="mt-3 text-xs text-slate-500">
                {stats.check_in_count} check-ins · {stats.analysis_count} AI analyses in this period.
              </p>
              {stats.previous_period.available ? (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Previous period: {stats.previous_period.check_in_count} check-ins and{" "}
                  {stats.previous_period.analysis_count} analyses. These are activity counts,
                  not a measure of wellbeing or whether things are getting better or worse.
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  There is not enough activity in both periods to show a comparison.
                </p>
              )}
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-800">Your check-in frequency</h4>
              {stats.check_in_count === 0 ? (
                <p className="mb-5 rounded-xl bg-[#F8FBF9] p-4 text-sm leading-5 text-slate-600">
                  No self-reported check-ins in this period.
                </p>
              ) : (
                <ul className="mb-6 space-y-2">
                  {MOODS.map(({ id, label }) => {
                    const count = stats.self_reported_moods[id] || 0;
                    return (
                      <li key={id} className="flex items-center gap-3 text-sm">
                        <span className="w-24 text-slate-700">{label}</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-teal-50">
                          <span
                            className="block h-full rounded-full bg-teal-500"
                            role="progressbar"
                            aria-label={`${label} self-reported check-in count`}
                            aria-valuemin={0}
                            aria-valuemax={stats.check_in_count}
                            aria-valuenow={count}
                            style={{
                              width: count
                                ? `${Math.max(5, (count / stats.check_in_count) * 100)}%`
                                : "0%",
                            }}
                          />
                        </span>
                        <span className="w-7 text-right text-slate-500">{count}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <h4 className="mb-3 text-sm font-semibold text-slate-800">AI emotion frequency</h4>
              {Object.keys(stats.ai_emotion_counts).length === 0 ? (
                <p className="rounded-xl bg-[#F8FBF9] p-4 text-sm leading-5 text-slate-600">
                  No AI classifications in this period. Manual check-ins are still shown separately.
                </p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(stats.ai_emotion_counts)
                    .sort((left, right) => right[1] - left[1])
                    .map(([emotion, count]) => (
                      <li key={emotion} className="flex items-center gap-3 text-sm">
                        <span className="w-20 capitalize text-slate-700">
                          {EMOTION_LABELS[emotion] || emotion}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-teal-50">
                          <span
                            className="block h-full rounded-full bg-amber-300"
                            role="progressbar"
                            aria-label={`${EMOTION_LABELS[emotion] || emotion} AI analysis count`}
                            aria-valuemin={0}
                            aria-valuemax={maxEmotionCount}
                            aria-valuenow={count}
                            style={{ width: `${Math.max(5, (count / maxEmotionCount) * 100)}%` }}
                          />
                        </span>
                        <span className="w-7 text-right text-slate-500">{count}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[#E6F1ED] bg-white/90 p-5 shadow-[0_8px_28px_rgba(42,91,80,0.06)] sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Recent reflections</h3>
            <p className="mt-1 text-sm text-slate-600">Only your own saved records are shown.</p>
          </div>
          <span className="rounded-full bg-[#EFF8F4] px-3 py-1 text-xs text-teal-900">
            {history.length} · up to 50 most recent
          </span>
        </div>
        {dataLoading ? (
          <p className="py-6 text-sm text-slate-500">Updating history…</p>
        ) : history.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-[#F8FBF9] p-5 text-sm text-slate-600">
            No saved reflections in this period yet. Your records will appear here when you choose to save one.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#EAF1ED]">
            {history.map((item) => {
              const isAnalysis = item.type === "ai_prediction";
              return (
                <li key={`${item.type}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`mt-0.5 rounded-xl p-2 ${isAnalysis ? "bg-[#FFF7E8] text-amber-800" : "bg-[#EAF8F3] text-teal-800"}`}>
                      {isAnalysis ? <Sparkles size={17} aria-hidden="true" /> : <Heart size={17} aria-hidden="true" />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {isAnalysis
                          ? `AI signal: ${EMOTION_LABELS[item.primary_emotion] || item.primary_emotion}${item.status === "unclear" ? " · unclear" : ""}`
                          : `Your check-in: ${MOOD_LABELS[item.mood] || item.mood}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleString()}
                        {isAnalysis ? ` · classifier score ${Math.round(item.confidence * 100)}%` : " · self-reported"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isAnalysis ? (
                      <button
                        type="button"
                        onClick={() => showAnalysis(item.id)}
                        aria-label={`View analysis from ${new Date(item.created_at).toLocaleString()}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-teal-900 transition hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                      >
                        Details <ArrowUpRight size={14} aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCheckIn(item.id);
                          setSelectedMood(item.mood);
                          setCheckInMessage(null);
                        }}
                        aria-label={`Edit ${MOOD_LABELS[item.mood] || item.mood} check-in`}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-teal-50 hover:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => removeHistoryItem(item.id, isAnalysis ? "analysis" : "check-in")}
                      aria-label={`Delete ${isAnalysis ? "AI analysis" : "mood check-in"}`}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700 disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 size={16} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2 px-1 text-xs leading-5 text-slate-500">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-teal-800" aria-hidden="true" />
        MindHaven provides personal wellness reflection, not medical diagnosis or treatment. AI
        classifications can be inaccurate and do not determine what you truly feel.
      </p>

      {detail && (
        <AnalysisDialog
          analysis={detail}
          loading={detailLoading}
          error={detailError}
          onClose={() => setDetail(null)}
          onDelete={(id) => removeHistoryItem(id, "analysis")}
        />
      )}
    </motion.section>
  );
}
