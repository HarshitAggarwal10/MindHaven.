"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CalendarHeart,
  Check,
  Clock3,
  Compass,
  Flower2,
  Heart,
  Leaf,
  MapPin,
  Mountain,
  Search,
  Sparkles,
  Sunrise,
  Utensils,
  Wind,
  Waves,
} from "lucide-react";
import BookingsPanel from "./components/BookingsPanel";
import ExperienceCard from "./components/ExperienceCard";
import BreathingGuide from "./components/BreathingGuide";
import {
  getWellnessCategories,
  getWellnessExperiences,
  getWellnessResources,
} from "@/lib/wellness-api";

const TABS = [
  { id: "experiences", label: "Experiences", Icon: CalendarHeart },
  { id: "resources", label: "Free resources", Icon: Wind },
  { id: "bookings", label: "My bookings", Icon: BookOpen },
];

const MOODS = [
  ["very_low", "Low"],
  ["low", "A little low"],
  ["steady", "Steady"],
  ["good", "Good"],
  ["very_good", "Very good"],
];

const RETREAT_IDEAS = [
  {
    title: "Mountain yoga reset",
    kind: "Yoga & gentle movement",
    description: "Unhurried movement, fresh-air pauses, and room to find your own rhythm.",
    place: "Himalayan foothills",
    duration: "A long weekend",
    icon: Mountain,
    image: "/images/wellness/yoga.jpg",
    imageAlt: "A peaceful yoga practice surrounded by greenery",
    colors: "from-[#d5eee2] via-[#bbd9c9] to-[#8eaf9b]",
    search: "yoga",
    goals: ["stress", "movement", "reconnect", "energy", "nature"],
  },
  {
    title: "A quieter kind of weekend",
    kind: "Meditation & mindfulness",
    description: "A gentle change of pace with guided stillness and plenty of time to yourself.",
    place: "A quiet place, anywhere",
    duration: "2–3 days",
    icon: Flower2,
    image: "/images/wellness/meditation.jpg",
    imageAlt: "A quiet moment of meditation in warm natural light",
    colors: "from-[#e5dff3] via-[#d4cbe8] to-[#a99dc7]",
    search: "meditation",
    goals: ["stress", "rest", "reconnect"],
  },
  {
    title: "The screen-free nature break",
    kind: "Nature & digital reset",
    description: "Trade notifications for a slow walk, mindful moments, and a little more space.",
    place: "Forest or countryside",
    duration: "A flexible weekend",
    icon: Wind,
    image: "/images/wellness/nature.jpg",
    imageAlt: "Soft morning light over a peaceful natural landscape",
    colors: "from-[#e9e7c9] via-[#cbd8a7] to-[#8ea77e]",
    search: "mindfulness",
    goals: ["stress", "rest", "reconnect", "nature", "digital"],
  },
  {
    title: "Move at your own pace",
    kind: "Gentle exercise & recovery",
    description: "Approachable movement, restorative breaks, and no pressure to keep up.",
    place: "Somewhere close to home",
    duration: "A day or weekend",
    icon: Heart,
    image: "/images/wellness/movement.jpg",
    imageAlt: "A gentle outdoor movement practice",
    colors: "from-[#f5ddcf] via-[#eac9bb] to-[#c69182]",
    search: "movement",
    goals: ["movement", "energy", "reconnect"],
  },
  {
    title: "A reset among the trees",
    kind: "Nature & forest bathing",
    description: "An easy-going outdoor pause, with quiet trails and time to notice the little things.",
    place: "Forest or countryside",
    duration: "A slow weekend",
    icon: Leaf,
    image: "/images/wellness/nature.jpg",
    imageAlt: "Gentle morning sunlight over a green landscape",
    colors: "from-[#e9e7c9] via-[#cbd8a7] to-[#8ea77e]",
    search: "nature",
    goals: ["stress", "rest", "reconnect", "nature"],
  },
  {
    title: "Mindful food & slow mornings",
    kind: "Mindful cooking & nourishment",
    description: "Savour simple food, unhurried rituals, and the pleasure of being present.",
    place: "A welcoming retreat kitchen",
    duration: "A day or weekend",
    icon: Utensils,
    image: "/images/wellness/nourishment.jpg",
    imageAlt: "A colourful, nourishing meal made with fresh ingredients",
    colors: "from-[#f4dfc4] via-[#edc89c] to-[#c59163]",
    search: "mindful cooking",
    goals: ["energy", "reconnect", "rest", "nourishment"],
  },
  {
    title: "Sea-air breathwork break",
    kind: "Coastal calm & breathing",
    description: "Let the sound of the water set a slower rhythm for an optional guided breathing practice.",
    place: "Coast or lakeside",
    duration: "A long weekend",
    icon: Waves,
    image: "/images/wellness/coast.jpg",
    imageAlt: "Soft waves meeting a quiet shoreline",
    colors: "from-[#d2edf0] via-[#a9d6de] to-[#6ca5b5]",
    search: "breathing",
    goals: ["stress", "rest", "reconnect", "nature"],
  },
  {
    title: "A digital-light weekend",
    kind: "Mindfulness & mindful technology",
    description: "Make a little space away from screens, with gentle activities you can choose for yourself.",
    place: "A quiet place, anywhere",
    duration: "A flexible weekend",
    icon: Sunrise,
    image: "/images/wellness/stillness.jpg",
    imageAlt: "A calm, softly lit space for mindful rest",
    colors: "from-[#e5dff3] via-[#d4cbe8] to-[#a99dc7]",
    search: "mindfulness",
    goals: ["stress", "rest", "reconnect", "digital"],
  },
];

const RETREAT_GOALS = [
  ["stress", "Quiet a busy mind"],
  ["rest", "Make space for real rest"],
  ["movement", "Move gently, at my own pace"],
  ["reconnect", "Feel a little more like myself"],
  ["energy", "Find a fresh sense of energy"],
  ["nature", "Spend more time outdoors"],
  ["digital", "Take a softer break from screens"],
  ["nourishment", "Explore mindful food and rituals"],
];

const RETREAT_PLACES = [
  ["anywhere", "I’m open to ideas"],
  ["mountains", "Mountain air and open views"],
  ["forest", "Forest or quiet countryside"],
  ["coast", "Coast, river, or lakeside"],
  ["nearby", "Somewhere close to home"],
  ["online", "From home or online"],
];

const RETREAT_TIMES = [
  ["soon", "Soon, if something feels right"],
  ["month", "Within the next 1–2 months"],
  ["later", "A little further ahead"],
  ["flexible", "No date yet — I’m exploring"],
];

function EmptyState({ title, children }) {
  return (
    <div className="rounded-3xl border border-dashed border-teal-200 bg-white/75 px-6 py-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
        <Heart size={21} />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{children}</p>
    </div>
  );
}

function RetreatIdeaCard({ idea, onFind }) {
  const Icon = idea.icon;
  return (
    <article className="group overflow-hidden rounded-[1.6rem] border border-white bg-white shadow-[0_14px_38px_rgba(35,70,59,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(35,70,59,0.14)]">
      <div className={`relative flex h-48 items-end overflow-hidden bg-gradient-to-br ${idea.colors} p-5`}>
        <Image
          src={idea.image}
          alt={idea.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
        <div className="relative flex w-full items-end justify-between gap-3">
          <span className="rounded-full border border-white/50 bg-slate-950/25 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
            Retreat inspiration
          </span>
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/50 bg-white/20 text-white backdrop-blur">
            <Icon size={19} strokeWidth={1.7} />
          </span>
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">{idea.kind}</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">{idea.title}</h3>
        <p className="mt-2 min-h-[3rem] text-sm leading-6 text-slate-600">{idea.description}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{idea.place}</span>
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{idea.duration}</span>
        </div>
        <button
          type="button"
          onClick={() => onFind(idea)}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-teal-800 px-4 py-3 text-sm font-semibold text-teal-900 transition hover:bg-teal-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Find a real retreat <ArrowUpRight size={16} />
        </button>
        <p className="mt-2 text-center text-[11px] text-slate-400">Illustrative idea · dates and availability vary</p>
      </div>
    </article>
  );
}

function RetreatInspiration({ onFind }) {
  const [goal, setGoal] = useState("");
  const [place, setPlace] = useState("");
  const [when, setWhen] = useState("");
  const [recommendations, setRecommendations] = useState(null);

  const inspireMe = (event) => {
    event.preventDefault();
    const matches = RETREAT_IDEAS.filter((idea) => {
      const matchesGoal = !goal || idea.goals.includes(goal);
      const matchesPlace =
        !place ||
        place === "anywhere" ||
        (place === "mountains" && idea.place.toLowerCase().includes("mountain")) ||
        (place === "forest" && idea.place.toLowerCase().includes("forest")) ||
        (place === "coast" && /(coast|lake|shore)/.test(idea.place.toLowerCase())) ||
        (place === "nearby" && idea.place.toLowerCase().includes("home")) ||
        (place === "online" && /(anywhere|home)/.test(idea.place.toLowerCase()));
      return matchesGoal && matchesPlace;
    });
    setRecommendations(matches.length ? matches : RETREAT_IDEAS.slice(0, 2));
  };

  return (
    <section id="retreat-inspiration" className="mt-8 scroll-mt-6">
      <div className="grid overflow-hidden rounded-[2rem] border border-white bg-[#fffdf9] shadow-[0_20px_55px_rgba(35,70,59,0.08)] lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative flex min-h-[19rem] flex-col justify-between overflow-hidden bg-[#173f38] p-7 text-white sm:p-9">
          <Image
            src="/images/wellness/nature.jpg"
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#103b35]/95 via-[#173f38]/80 to-[#173f38]/50" />
          <div className="absolute -right-20 -top-20 size-72 rounded-full border border-white/15" />
          <div className="absolute -right-8 -top-8 size-48 rounded-full border border-white/15 bg-teal-200/10" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-teal-100">
              <Sparkles size={14} /> A little inspiration
            </span>
            <h2 className="mt-6 max-w-md font-[Quicksand] text-3xl font-semibold leading-tight sm:text-4xl">
              What would feeling better look like for you?
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-teal-50/80">
              Tell us what sounds good. We’ll suggest a few directions to explore—at your pace, with no pressure to book.
            </p>
          </div>
          <div className="relative mt-7 flex items-center gap-3 text-sm text-teal-50/80">
            <span className="grid size-10 place-items-center rounded-full bg-white/10"><Heart size={17} /></span>
            Your time away should feel like your choice.
          </div>
        </div>
        <form onSubmit={inspireMe} className="grid content-center gap-5 p-6 sm:p-9">
          <label className="block text-sm font-semibold text-slate-800">
            What are you hoping for?
            <select required value={goal} onChange={(event) => setGoal(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-normal text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
              <option value="">Choose what feels closest</option>
              {RETREAT_GOALS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-800">
              Where would you like to go?
              <select value={place} onChange={(event) => setPlace(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-normal text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                <option value="">Anywhere is fine</option>
                {RETREAT_PLACES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              When feels right?
              <select value={when} onChange={(event) => setWhen(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-normal text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                <option value="">Whenever you’re ready</option>
                {RETREAT_TIMES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-teal-800 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
              Inspire me <Compass size={17} />
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Clock3 size={14} /> Just a few thoughtful questions</span>
          </div>
          {recommendations && (
            <div className="rounded-2xl border border-teal-100 bg-teal-50/75 p-4" role="status" aria-live="polite">
              <p className="flex items-center gap-2 text-sm font-semibold text-teal-950"><Check size={16} /> Your starting points are ready</p>
              <p className="mt-1 text-sm leading-6 text-teal-900/80">
                Based on your wish to {RETREAT_GOALS.find(([value]) => value === goal)?.[1].toLowerCase()}
                {place && place !== "anywhere" && ` and your preference for ${RETREAT_PLACES.find(([value]) => value === place)?.[1].toLowerCase()}`}
                {when && `, with “${RETREAT_TIMES.find(([value]) => value === when)?.[1].toLowerCase()}” in mind`}.
                {" "}These are gentle starting points, not scheduled events. Choose what feels comfortable.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {recommendations.map((idea) => <RetreatIdeaCard key={idea.title} idea={idea} onFind={onFind} />)}
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

function RetreatIdeasSection({ onFind }) {
  return (
    <section className="mt-14">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">A vision for your next pause</p>
          <h2 className="mt-2 font-[Quicksand] text-2xl font-semibold text-slate-950 sm:text-3xl">Retreat ideas to spark your imagination</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">These are sample concepts—not scheduled or bookable events. Search real, published experiences below when you’re ready.</p>
        </div>
        <a href="#wellness-content" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:underline">Browse live experiences <ArrowRight size={15} /></a>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {RETREAT_IDEAS.map((idea) => <RetreatIdeaCard key={idea.title} idea={idea} onFind={onFind} />)}
      </div>
      <p className="mt-3 text-right text-xs text-slate-500">
        Photography from <a href="https://unsplash.com/license" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-teal-800">Unsplash</a>. Images are illustrative; only published provider listings are bookable.
      </p>
    </section>
  );
}

function ExperienceFilters({ categories, filters, onChange, onSearch }) {
  return (
    <form
      className="mt-8 grid gap-3 rounded-3xl border border-white bg-white/80 p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <label className="relative md:col-span-2 xl:col-span-1">
        <span className="sr-only">Search experiences</span>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-800" size={17} />
        <input
          value={filters.search}
          onChange={(event) => onChange("search", event.target.value)}
          placeholder="Search experiences"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
      </label>
      <select
        value={filters.category}
        onChange={(event) => onChange("category", event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        aria-label="Experience category"
      >
        <option value="">All categories</option>
        {categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}
      </select>
      <select
        value={filters.format}
        onChange={(event) => onChange("format", event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        aria-label="Experience format"
      >
        <option value="">In person or virtual</option>
        <option value="in_person">In person</option>
        <option value="virtual">Virtual</option>
        <option value="hybrid">Hybrid</option>
      </select>
      <input
        type="text"
        aria-label="Filter by location"
        value={filters.location}
        onChange={(event) => onChange("location", event.target.value)}
        placeholder="Location"
        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      />
      <input
        type="date"
        aria-label="Starting from"
        value={filters.start_date}
        onChange={(event) => onChange("start_date", event.target.value)}
        className="min-w-0 rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs outline-none focus:border-teal-600"
      />
      <input
        type="date"
        aria-label="Ending by"
        value={filters.end_date}
        onChange={(event) => onChange("end_date", event.target.value)}
        className="min-w-0 rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs outline-none focus:border-teal-600"
      />
      <button className="rounded-xl bg-teal-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
        Apply filters
      </button>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Min price
          <input type="number" min="0" value={filters.min_price} onChange={(event) => onChange("min_price", event.target.value)} className="w-24 rounded-lg border border-slate-200 px-2 py-1.5" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Max price
          <input type="number" min="0" value={filters.max_price} onChange={(event) => onChange("max_price", event.target.value)} className="w-24 rounded-lg border border-slate-200 px-2 py-1.5" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={filters.free === "true"} onChange={(event) => onChange("free", event.target.checked ? "true" : "")} className="accent-teal-800" />
          Free only
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={filters.available === "true"} onChange={(event) => onChange("available", event.target.checked ? "true" : "")} className="accent-teal-800" />
          Places available
        </label>
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          Sort
          <select
            value={filters.sort}
            onChange={(event) => onChange("sort", event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            aria-label="Sort experiences"
          >
            <option value="upcoming">Upcoming</option>
            <option value="featured">Featured</option>
            <option value="price_low">Price: low to high</option>
          </select>
        </label>
      </div>
    </form>
  );
}

function ResourceLibrary() {
  const [kind, setKind] = useState("");
  const [search, setSearch] = useState("");
  const [maxDuration, setMaxDuration] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);
  const [breathingResource, setBreathingResource] = useState(false);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const kinds = [
    ["", "All"],
    ["meditation", "Meditation"],
    ["breathing", "Breathing"],
    ["mindfulness", "Mindfulness"],
    ["movement", "Gentle movement"],
    ["grounding", "Grounding"],
    ["relaxation", "Relaxation"],
    ["reflection", "Reflection"],
    ["sleep", "Sleep"],
  ];

  const retry = () => {
    setLoading(true);
    setError("");
    setReloadKey((version) => version + 1);
  };

  useEffect(() => {
    let cancelled = false;
    getWellnessResources({ kind, search, max_duration: maxDuration, page_size: 48 })
      .then((data) => {
        if (!cancelled) {
          setResources(data.results || data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [kind, search, maxDuration, reloadKey]);

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Search free resources</span>
          <input value={search} onChange={(event) => { setLoading(true); setError(""); setSearch(event.target.value); }} placeholder="Search mindful resources" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
        </label>
        <select value={kind} onChange={(event) => { setLoading(true); setError(""); setKind(event.target.value); }} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" aria-label="Filter resource category">
          {kinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={maxDuration} onChange={(event) => { setLoading(true); setError(""); setMaxDuration(event.target.value); }} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" aria-label="Filter by maximum duration">
          <option value="">Any duration</option>
          <option value="5">5 minutes or less</option>
          <option value="10">10 minutes or less</option>
          <option value="20">20 minutes or less</option>
        </select>
      </div>
      {error ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          {error} <button onClick={retry} className="ml-2 font-semibold underline">Try again</button>
        </div>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading resources">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl bg-white/80" />)}
        </div>
      ) : resources.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <article key={resource.id} className="rounded-2xl border border-white bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{resource.kind.replace("_", " ")}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{resource.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>{resource.duration_minutes} min · Free</span>
                <button
                  className="font-semibold text-teal-800 underline-offset-2 hover:underline"
                  onClick={() => {
                    setSelectedResource(resource);
                    setBreathingResource(resource.kind === "breathing");
                  }}
                >
                  View guide
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No published resources yet">Free guided practices will appear here once they have been added and published by MindHaven.</EmptyState>
      )}
      {selectedResource && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setSelectedResource(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="resource-title" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{selectedResource.duration_minutes} minute practice</p>
                <h2 id="resource-title" className="mt-2 text-2xl font-semibold text-slate-900">{selectedResource.title}</h2>
              </div>
              <button type="button" onClick={() => setSelectedResource(null)} aria-label="Close resource" className="rounded-full border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Close</button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{selectedResource.description}</p>
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">{selectedResource.instructions}</p>
            {selectedResource.safety_notes && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{selectedResource.safety_notes}</p>}
            {breathingResource && <BreathingGuide />}
            {selectedResource.media_url && <a href={selectedResource.media_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 font-semibold text-teal-800 underline">Open resource media <ArrowRight size={15} /></a>}
          </section>
        </div>
      )}
    </section>
  );
}

export default function WellnessHubPage() {
  const [tab, setTab] = useState("experiences");
  const [categories, setCategories] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    format: "",
    location: "",
    start_date: "",
    end_date: "",
    min_price: "",
    max_price: "",
    free: "",
    available: "",
    sort: "upcoming",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const {
    category,
    format,
    location,
    start_date: startDate,
    end_date: endDate,
    min_price: minPrice,
    max_price: maxPrice,
    free,
    available,
    sort,
  } = filters;

  useEffect(() => {
    getWellnessCategories()
      .then((data) => setCategories(data.results || data))
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getWellnessExperiences({
      search: submittedSearch,
      category,
      format,
      location,
      start_date: startDate,
      end_date: endDate,
      min_price: minPrice,
      max_price: maxPrice,
      free,
      available,
      sort,
      page_size: 12,
    })
      .then((data) => {
        if (!cancelled) setExperiences(data.results || data);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [category, format, location, startDate, endDate, minPrice, maxPrice, free, available, sort, submittedSearch, reloadKey]);

  const changeFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    if (field !== "search") {
      setLoading(true);
      setError("");
    }
  };

  const applySearch = () => {
    setLoading(true);
    setError("");
    setSubmittedSearch(filters.search);
  };

  const findRealRetreat = (idea) => {
    setTab("experiences");
    setFilters((current) => ({ ...current, search: idea.search, location: "" }));
    setSubmittedSearch(idea.search);
    setLoading(true);
    setError("");
    document.getElementById("wellness-content")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,#f2faf7_0%,#f7fbf8_48%,#fff9ef_100%)] px-4 py-8 text-slate-800 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:underline">
          <ArrowRight className="rotate-180" size={16} /> Back to dashboard
        </Link>
        <section className="relative mt-5 min-h-[22rem] overflow-hidden rounded-[2rem] border border-white/80 bg-[#e6f1e9] shadow-[0_20px_55px_rgba(28,91,80,0.08)] sm:min-h-[25rem]">
          <Image
            src="/images/wellness/nature.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 90vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,253,250,0.98)_0%,rgba(250,253,250,0.94)_43%,rgba(250,253,250,0.73)_62%,rgba(250,253,250,0.08)_100%)] max-md:bg-[linear-gradient(90deg,rgba(250,253,250,0.96)_0%,rgba(250,253,250,0.87)_58%,rgba(250,253,250,0.58)_100%)]" />
          <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-[#d4efe2]/45 blur-3xl" />
          <div className="relative z-10 flex min-h-[22rem] flex-col justify-center px-6 py-9 sm:min-h-[25rem] sm:px-10 sm:py-12">
            <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-teal-800">
              <Sparkles size={14} /> MindHaven Wellness Hub
            </p>
            <h1 className="mt-5 font-[Quicksand] text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Make room for a reset
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Imagine a slower morning, a stretch in the fresh air, or a little time that belongs just to you. Find a retreat that meets you where you are.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => { setTab("experiences"); document.getElementById("wellness-content")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-full bg-teal-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900">Explore experiences</button>
              <button onClick={() => { setTab("resources"); document.getElementById("wellness-content")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-full border border-teal-200 bg-white px-5 py-3 text-sm font-semibold text-teal-900 transition hover:bg-teal-50">Try a free practice</button>
            </div>
            </div>
            <div className="absolute bottom-5 right-5 hidden items-center gap-2 rounded-full border border-white/75 bg-white/75 px-4 py-2 text-xs font-medium text-teal-950 shadow-lg backdrop-blur-md sm:flex lg:bottom-7 lg:right-7">
              <Heart size={14} className="text-teal-700" /> Your pace. Your path.
            </div>
          </div>
        </section>

        <RetreatInspiration onFind={findRealRetreat} />
        <RetreatIdeasSection onFind={findRealRetreat} />

        <nav aria-label="Wellness sections" className="mt-7 flex flex-wrap gap-2">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${tab === id ? "bg-teal-800 text-white shadow" : "border border-white bg-white/80 text-slate-700 hover:bg-white"}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        <section id="wellness-content" className="mt-7">
          {tab === "experiences" && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Upcoming experiences</h2>
                  <p className="mt-1 text-sm text-slate-600">Choose an in-person retreat or an online session at your own pace.</p>
                </div>
                {categories.length > 0 && <span className="text-xs text-slate-500">{categories.length} experience categories</span>}
              </div>
              <ExperienceFilters categories={categories} filters={filters} onChange={changeFilter} onSearch={applySearch} />
              <div className="mt-7">
                {loading ? (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading experiences">
                    {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-96 animate-pulse rounded-3xl bg-white/80" />)}
                  </div>
                ) : error ? (
                  <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{error} <button onClick={() => { setLoading(true); setError(""); setReloadKey((value) => value + 1); }} className="font-semibold underline">Try again</button></div>
                ) : experiences.length ? (
                  <>
                    {experiences.some((experience) => experience.is_demo) && (
                      <p role="note" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                        Listings marked <strong>DEMO</strong> are fictional camps for testing registrations only. They will not take place; sample addresses are not real venues.
                      </p>
                    )}
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {experiences.map((experience) => <ExperienceCard key={experience.id} experience={experience} />)}
                    </div>
                  </>
                ) : (
                  <EmptyState title={categories.length === 0 ? "No retreats are published just yet" : "No experiences match these filters"}>
                    {categories.length === 0
                      ? "There are no live provider listings to book yet. Retreats will appear here once a verified wellness provider publishes real dates, location, and booking details. Published free experiences can be booked once per account; paid bookings use secure checkout when payment is configured. The inspiration cards above are examples only—not reservations."
                      : "Try broadening your search, or check back as verified providers publish new experiences."}
                  </EmptyState>
                )}
              </div>
            </>
          )}
          {tab === "resources" && (
            <>
              <div className="mb-5">
                <h2 className="text-2xl font-semibold text-slate-950">Free wellness resources</h2>
                <p className="mt-1 text-sm text-slate-600">Small, optional practices to support a mindful pause. These are not medical treatment.</p>
              </div>
              <ResourceLibrary />
            </>
          )}
          {tab === "bookings" && (
            <>
              <div className="mb-5">
                <h2 className="text-2xl font-semibold text-slate-950">Your wellness journey</h2>
                <p className="mt-1 text-sm text-slate-600">Only your own registrations and eligible private session details appear here.</p>
              </div>
              <BookingsPanel />
            </>
          )}
        </section>
        <p className="mt-9 max-w-3xl text-xs leading-5 text-slate-500">
          Wellness activities are optional and are not a substitute for professional medical advice or care. Cold-exposure experiences may not be suitable for everyone; review the provider&apos;s safety information and seek qualified medical advice if you have health concerns.
        </p>
      </div>
    </main>
  );
}
