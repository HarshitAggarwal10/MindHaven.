"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  BookHeart,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flower2,
  Heart,
  IndianRupee,
  MessageCircle,
  MapPin,
  Mountain,
  Sparkles,
  Sprout,
  Users,
  Wind,
} from "lucide-react";
import { getMoodHistory } from "@/lib/mood-api";
import { getWellnessBookings } from "@/lib/wellness-api";
import {
  getCommunityChatActivity,
  getUserMemberships,
  getUserProfile,
} from "@/lib/community-api";
import {
  getDashboardActivitySnapshot,
  subscribeToDashboardActivity,
} from "@/lib/activity-history";

const MOOD_LABELS = {
  very_low: "Low",
  low: "A little low",
  steady: "Steady",
  good: "Good",
  very_good: "Very good",
};

const MOOD_PRESENTATION = {
  very_low: { label: "Low", emotion: "Sad", score: 1, color: "#e87979" },
  low: { label: "A little low", emotion: "Low", score: 2, color: "#f2aa72" },
  steady: { label: "Steady", emotion: "Neutral", score: 3, color: "#8b9ba7" },
  good: { label: "Good", emotion: "Happy", score: 4, color: "#68b895" },
  very_good: { label: "Very good", emotion: "Joyful", score: 5, color: "#63a9a3" },
};

const AI_EMOTIONS = {
  anger: { label: "Angry", score: 1, color: "#df7777" },
  disgust: { label: "Uneasy", score: 2, color: "#a78b72" },
  fear: { label: "Anxious", score: 2, color: "#a889bd" },
  joy: { label: "Happy", score: 5, color: "#60ad85" },
  neutral: { label: "Neutral", score: 3, color: "#8b9ba7" },
  sadness: { label: "Sad", score: 1, color: "#7096c3" },
  surprise: { label: "Surprised", score: 4, color: "#d9a54f" },
};

const ACTIVITY_COLORS = {
  diary: { label: "Diary", dot: "bg-amber-500", text: "text-amber-700", image: "/images/wellness/stillness.jpg" },
  mood: { label: "Mood check-in", dot: "bg-violet-500", text: "text-violet-700", image: "/images/wellness/meditation.jpg" },
  retreat: { label: "Retreat", dot: "bg-teal-600", text: "text-teal-800", image: "/images/wellness/yoga.jpg" },
  community: { label: "Community", dot: "bg-sky-500", text: "text-sky-700", image: "/images/wellness/nature.jpg" },
  community_chat: { label: "Community chat", dot: "bg-cyan-600", text: "text-cyan-700", image: "/images/wellness/nature.jpg" },
  explore: { label: "Exploration", dot: "bg-orange-500", text: "text-orange-700", image: "/images/wellness/movement.jpg" },
};

function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getCalendarEvents({ bookings, checkIns, diaryEntries, memberships, chatActivity, explored }) {
  return [
    ...diaryEntries.map((entry) => ({ date: entry.created_at, kind: "diary" })),
    ...checkIns.map((checkIn) => ({ date: checkIn.created_at, kind: "mood" })),
    ...chatActivity.map((chat) => ({ date: chat.date, kind: "community_chat" })),
    ...bookings
      .filter((booking) => ["confirmed", "pending_payment"].includes(booking.status))
      .map((booking) => ({ date: booking.experience.start_at, kind: "retreat" })),
    ...memberships.map((membership) => ({ date: membership.joined_at, kind: "community" })),
    ...explored.map((activity) => ({ date: activity.created_at, kind: "explore" })),
  ].reduce((byDate, event) => {
    const key = localDateKey(event.date);
    if (key) byDate[key] = [...(byDate[key] || []), event.kind];
    return byDate;
  }, {});
}

function CalendarCard({ bookings, checkIns, diaryEntries, memberships, chatActivity, explored }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const today = new Date();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leadingDays = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const monthName = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(month);

  const shiftMonth = (offset) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };
  const calendarEvents = useMemo(
    () => getCalendarEvents({ bookings, checkIns, diaryEntries, memberships, chatActivity, explored }),
    [bookings, checkIns, diaryEntries, memberships, chatActivity, explored],
  );

  return (
    <section className="rounded-3xl border border-white bg-white/90 p-5 shadow-[0_10px_30px_rgba(29,78,70,0.07)]">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Calendar</h3>
        <div className="flex gap-1">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="rounded-full p-1.5 text-slate-500 hover:bg-teal-50 hover:text-teal-800"><ChevronLeft size={17} /></button>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="rounded-full p-1.5 text-slate-500 hover:bg-teal-50 hover:text-teal-800"><ChevronRight size={17} /></button>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{monthName}</p>
      <div className="mt-3 grid grid-cols-7 gap-y-2 text-center text-[11px] text-slate-500">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`} className="py-1 font-semibold">{day}</span>)}
        {Array.from({ length: leadingDays }, (_, index) => <span key={`empty-${index}`} />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const active = day === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();
          const dateKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const kinds = [...new Set(calendarEvents[dateKey] || [])];
          const eventNames = kinds.map((kind) => ACTIVITY_COLORS[kind].label).join(", ");
          return (
            <span key={day} className="relative mx-auto">
              <span
                tabIndex={0}
                title={eventNames ? `${monthName} ${day}: ${eventNames}` : `${monthName} ${day}`}
                aria-label={eventNames ? `${monthName} ${day}: ${eventNames}` : `${monthName} ${day}`}
                className={`flex size-8 flex-col items-center justify-center rounded-full text-xs outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${active ? "bg-[#ee9852] font-bold text-white shadow-sm ring-2 ring-orange-200" : "text-slate-700 hover:bg-teal-50"}`}
              >
                {day}
                {kinds.length > 0 && (
                  <span className="mt-0.5 flex h-1 gap-0.5" aria-hidden="true">
                    {kinds.slice(0, 3).map((kind) => (
                      <span key={kind} className={`size-1 rounded-full ring-1 ring-white/90 ${ACTIVITY_COLORS[kind].dot}`} />
                    ))}
                  </span>
                )}
              </span>
            </span>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 sm:grid-cols-3">
        {Object.entries(ACTIVITY_COLORS).map(([kind, item]) => (
          <span key={kind} className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />{item.label}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Your personal milestones, marked by type. Dates stay private to your account.</p>
    </section>
  );
}

function CheckInCard({ user }) {
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const switchToMood = () => window.dispatchEvent(new CustomEvent("switch-section", { detail: "mood" }));

  return (
    <section className="relative isolate min-h-72 overflow-hidden rounded-3xl border border-white/70 bg-[#dce9e7] p-6 shadow-[0_10px_30px_rgba(29,78,70,0.07)] sm:p-7">
      <Image src="/images/wellness/meditation.jpg" alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="absolute inset-0 -z-20 object-cover object-center opacity-35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#edf7e9]/95 via-[#e2f0e5]/90 to-[#b9d8d0]/70" aria-hidden="true" />
      <Flower2 className="absolute -right-4 -top-4 size-24 text-teal-900/10" aria-hidden="true" />
      <div className="relative">
        <div className="flex size-14 items-center justify-center rounded-full border-4 border-white bg-[#93c9c1] text-lg font-bold text-teal-950 shadow-sm" aria-hidden="true">
          {firstName?.slice(0, 1).toUpperCase() || <Heart size={22} />}
        </div>
        <h2 className="mt-5 text-xl font-semibold text-slate-900">नमस्ते{firstName ? `, ${firstName}` : ""}!</h2>
        <p className="mt-1 max-w-sm text-sm font-medium leading-6 text-teal-950">
          {firstName ? `${firstName}, आज अपने लिए थोड़ी-सी खुशी चुनें — आपकी छोटी कोशिश भी बहुत मायने रखती है।` : "आज अपने लिए थोड़ी-सी खुशी चुनें — आपकी छोटी कोशिश भी बहुत मायने रखती है।"}
        </p>
        <h3 className="mt-5 text-lg font-semibold text-slate-900">Check in with yourself</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">A gentle pause can help you notice what you need today. Share only what feels comfortable.</p>
        <button type="button" onClick={switchToMood} className="mt-5 rounded-full bg-[#8fbe72] px-5 py-3 text-sm font-semibold text-[#183d27] transition hover:bg-[#82b667] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800">
          Start a mood check-in
        </button>
      </div>
    </section>
  );
}

function formatCurrency(amount, currency = "INR") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount) || 0);
}

function retreatImage(experience) {
  if (experience.cover_image) return experience.cover_image;
  const slug = experience.category?.slug || "";
  if (slug.includes("yoga")) return ACTIVITY_COLORS.retreat.image;
  if (slug.includes("meditation")) return ACTIVITY_COLORS.mood.image;
  if (slug.includes("movement") || slug.includes("exercise")) return ACTIVITY_COLORS.explore.image;
  if (slug.includes("detox") || slug.includes("nature")) return "/images/wellness/nourishment.jpg";
  return "/images/wellness/coast.jpg";
}

function bookingStatusLabel(booking) {
  return booking.status.replaceAll("_", " ");
}

function UpcomingBookings({ bookings, loading, error, onRetry }) {
  const orderedBookings = [...bookings].sort((left, right) => {
    return new Date(right.created_at) - new Date(left.created_at);
  });

  return (
    <section className="rounded-3xl border border-white bg-white/90 p-5 shadow-[0_10px_30px_rgba(29,78,70,0.07)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Your wellness hub</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Your retreat bookings</h2>
        </div>
        <Mountain className="text-teal-700" size={21} />
      </div>
      {loading ? (
        <div className="mt-5 space-y-3" aria-label="Loading schedule">
          <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : error ? (
        <div role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          <p>{error}</p>
          <button type="button" onClick={onRetry} className="mt-2 font-semibold underline">Try again</button>
        </div>
      ) : orderedBookings.length ? (
        <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
          {orderedBookings.map((booking) => {
            const experience = booking.experience;
            const confirmed = booking.status === "confirmed";
            return (
              <article key={booking.id} className="overflow-hidden rounded-2xl border border-[#e6eee8] bg-[#f8fbf8]">
                <div className="relative h-32 sm:h-36">
                  <Image src={retreatImage(experience)} alt="" fill sizes="(max-width: 768px) 100vw, 40vw" unoptimized className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
                  <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${confirmed ? "bg-emerald-100 text-emerald-900" : booking.status === "pending_payment" ? "bg-amber-100 text-amber-900" : "bg-white/90 text-slate-700"}`}>
                    {bookingStatusLabel(booking)}
                  </span>
                  {experience.is_demo && <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-950">Demo only</span>}
                  <div className="absolute inset-x-3 bottom-3">
                    <p className="text-xs font-semibold text-white/85">{experience.category?.name || "Wellness retreat"}</p>
                    <h3 className="mt-0.5 text-base font-semibold leading-tight text-white">{experience.title}</h3>
                  </div>
                </div>
                <div className="space-y-2.5 p-3">
                  <div className="grid gap-x-3 gap-y-2 text-xs text-slate-600 sm:grid-cols-2">
                    <p className="flex items-start gap-2"><CalendarDays size={14} className="mt-0.5 shrink-0 text-teal-700" /><span><strong className="text-slate-800">Starts</strong><br />{new Date(experience.start_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span></p>
                    <p className="flex items-start gap-2"><Clock3 size={14} className="mt-0.5 shrink-0 text-teal-700" /><span><strong className="text-slate-800">Ends · {experience.duration_minutes} min</strong><br />{new Date(experience.end_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span></p>
                    <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-teal-700" /><span><strong className="text-slate-800">{experience.format === "virtual" ? "Format" : "Location"}</strong><br />{experience.format === "virtual" ? "Online" : experience.location || "Location details provided by host"}</span></p>
                    <p className="flex items-start gap-2"><Users size={14} className="mt-0.5 shrink-0 text-teal-700" /><span><strong className="text-slate-800">Participants</strong><br />{booking.participant_count}</span></p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-2.5 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-slate-800"><IndianRupee size={13} className="text-teal-700" />{formatCurrency(booking.amount, booking.currency)}</span>
                    <span className="text-slate-500">Payment: {booking.payment_status.replaceAll("_", " ")}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Booking reference: <span className="font-semibold text-slate-700">{booking.booking_reference}</span> · Provider: {experience.provider?.display_name || "Mindful experience host"}</p>
                  <details className="group rounded-xl bg-white/80 px-3 py-2">
                        <summary className="cursor-pointer list-none text-xs font-semibold text-teal-800 marker:hidden">Experience and arrival details <span className="float-right group-open:rotate-180">⌄</span></summary>
                        <div className="mt-2 space-y-2 border-t border-slate-100 pt-2 text-xs leading-5 text-slate-600">
                          {experience.description && <p>{experience.description}</p>}
                          <p><strong className="text-slate-800">Event time zone:</strong> {experience.timezone_name}</p>
                          {experience.venue_details && <p><strong className="text-slate-800">Venue:</strong> {experience.venue_details}</p>}
                          {experience.included?.length > 0 && <p><strong className="text-slate-800">Included:</strong> {experience.included.join(", ")}</p>}
                          {experience.what_to_bring?.length > 0 && <p><strong className="text-slate-800">Bring along:</strong> {experience.what_to_bring.join(", ")}</p>}
                          {experience.accessibility_information && <p><strong className="text-slate-800">Accessibility:</strong> {experience.accessibility_information}</p>}
                          {experience.safety_information && <p><strong className="text-slate-800">Safety:</strong> {experience.safety_information}</p>}
                          {experience.cancellation_policy && <p><strong className="text-slate-800">Cancellation:</strong> {experience.cancellation_policy}</p>}
                          {experience.refund_before_hours > 0 && <p><strong className="text-slate-800">Refund window:</strong> Up to {experience.refund_before_hours} hours before the retreat.</p>}
                          <p><strong className="text-slate-800">Price per participant:</strong> {formatCurrency(experience.price, experience.currency)} · Capacity {experience.capacity}</p>
                          {experience.registration_closes_at && <p><strong className="text-slate-800">Registration closed:</strong> {new Date(experience.registration_closes_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>}
                          {experience.virtual_access_instructions && <p><strong className="text-slate-800">Online access:</strong> {experience.virtual_access_instructions}</p>}
                          {experience.virtual_link && <p><a href={experience.virtual_link} target="_blank" rel="noreferrer" className="font-semibold text-teal-800 underline">Open private session link</a></p>}
                          <p className="border-t border-slate-100 pt-2"><strong className="text-slate-800">Booking placed:</strong> {new Date(booking.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}{booking.expires_at ? ` · Payment deadline ${new Date(booking.expires_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}` : ""}</p>
                          {booking.cancelled_at && <p><strong className="text-slate-800">Cancelled:</strong> {new Date(booking.cancelled_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>}
                          {booking.cancellation_reason && <p><strong className="text-slate-800">Cancellation note:</strong> {booking.cancellation_reason}</p>}
                        </div>
                  </details>
                  {experience.slug && (
                    <Link href={`/wellness/${encodeURIComponent(experience.slug)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline">
                      View retreat <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-[#f6f9f7] px-4 py-5 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-white text-teal-700"><Mountain size={21} /></span>
          <p className="mt-3 text-sm font-medium text-slate-700">Your next retreat could start here</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Bookings you make through the Wellness Hub will appear here with dates, venue, payment, and host details.</p>
        </div>
      )}
      <Link href="/wellness" className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900">Explore and book a retreat <ArrowRight size={15} /></Link>
    </section>
  );
}

function ActivityTimeline({ bookings, diaryEntries, chatActivity }) {
  const events = [
    ...bookings.map((booking) => ({
      id: `booking-${booking.id}`,
      label: booking.status === "confirmed"
        ? `Booked ${booking.experience.title}`
        : booking.status === "pending_payment"
          ? `Started booking ${booking.experience.title} · payment pending`
          : booking.status === "cancelled"
            ? `Cancelled ${booking.experience.title}`
            : `${bookingStatusLabel(booking)} booking · ${booking.experience.title}`,
      date: booking.created_at,
      Icon: CalendarDays,
      kind: "retreat",
    })),
    ...diaryEntries.map((entry) => ({
      id: `diary-${entry.id}`,
      label: "Added a private diary entry",
      date: entry.created_at,
      Icon: BookHeart,
      kind: "diary",
    })),
    ...chatActivity.map((chat) => ({
      id: `chat-${chat.id}`,
      label: `Chatted in ${chat.community_name} · ${chat.message_count} ${chat.message_count === 1 ? "message" : "messages"}`,
      date: chat.date,
      Icon: MessageCircle,
      kind: "community_chat",
    })),
  ].filter((event) => event.date)
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    ;
  const [showAll, setShowAll] = useState(false);
  const visibleEvents = showAll ? events : events.slice(0, 4);

  return (
    <section className="rounded-3xl border border-white bg-white/90 p-5 shadow-[0_10px_30px_rgba(29,78,70,0.07)] sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Your private activity</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Your MindHaven journey</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">Only your diary entries, retreat bookings, and community chats appear here.</p>
      </div>
      {events.length ? (
        <ol className="mt-5 space-y-3">
          {visibleEvents.map(({ id, label, date, Icon, kind }) => (
            <li key={id} className="flex items-start gap-3">
              <span className="relative mt-0.5 grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#eff8f3] text-white shadow-sm">
                <Image src={ACTIVITY_COLORS[kind].image} alt="" fill sizes="44px" className="object-cover" />
                <span className="absolute inset-0 bg-slate-950/30" />
                <Icon size={17} className="relative z-10 drop-shadow" />
              </span>
              <div className="min-w-0 flex-1 border-b border-slate-100 pb-3">
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <time dateTime={date} className="mt-1 block text-xs text-slate-500">
                  {new Date(date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-2xl bg-[#f6f9f7] p-4 text-sm leading-6 text-slate-600">
          Your diary entries, retreat bookings, and community chats will appear here.
        </p>
      )}
      {events.length > 4 && (
        <button type="button" onClick={() => setShowAll((current) => !current)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:underline">
          {showAll ? "Show less" : `View more (${events.length - 4} more)`}
          {showAll ? <ChevronLeft size={15} className="rotate-90" /> : <ArrowRight size={15} />}
        </button>
      )}
    </section>
  );
}

function RecentMood({ moodHistory, loading, error }) {
  const recent = useMemo(() => moodHistory.slice(0, 7).reverse(), [moodHistory]);
  const latest = moodHistory[0];
  const latestEmotion = latest?.type === "ai_prediction"
    ? AI_EMOTIONS[latest.primary_emotion]
    : MOOD_PRESENTATION[latest?.mood];
  const chartPoints = recent.map((checkIn, index) => {
    const emotion = checkIn.type === "ai_prediction"
      ? AI_EMOTIONS[checkIn.primary_emotion]
      : MOOD_PRESENTATION[checkIn.mood];
    const x = recent.length === 1 ? 180 : 24 + index * (312 / (recent.length - 1));
    const y = 98 - ((emotion?.score || 3) - 1) * 19;
    return { ...checkIn, emotion, x, y };
  });
  const linePoints = chartPoints.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <section className="rounded-3xl border border-white bg-white/90 p-5 shadow-[0_10px_30px_rgba(29,78,70,0.07)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent mood check-ins</h2>
          <p className="mt-1 text-xs text-slate-500">Your saved check-ins and mood reflections, shown as gentle signals — not a diagnosis.</p>
        </div>
        <span className="rounded-full bg-[#eff8f1] px-3 py-1.5 text-xs font-semibold text-teal-900">{moodHistory.length} in the last 30 days</span>
      </div>
      {loading ? <div className="mt-5 h-36 animate-pulse rounded-xl bg-slate-100" aria-label="Loading mood check-ins" /> : error ? <p role="alert" className="mt-4 text-sm text-rose-800">{error}</p> : recent.length ? (
        <div className="mt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Latest saved mood</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {latest.status === "unclear" ? "Your reflection signal was unclear" : latestEmotion?.label || "Mood saved"}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  {latest.type === "ai_prediction" ? "from a reflection" : "from your check-in"}
                </span>
              </p>
            </div>
            <time dateTime={latest.created_at} className="text-xs text-slate-500">
              {new Date(latest.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
            </time>
          </div>
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#f4faf6] to-[#f7f5fb] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500"><Sparkles size={14} className="text-violet-500" /> Mood trend · last {recent.length} reflections</div>
            <svg viewBox="0 0 360 112" role="img" aria-label={`Mood trend: ${chartPoints.map((point) => point.emotion?.label || "Mood").join(", ")}`} className="h-28 w-full">
              {[22, 41, 60, 79, 98].map((y, index) => <line key={y} x1="18" x2="342" y1={y} y2={y} stroke="#dce6e1" strokeDasharray="3 5" />)}
              {chartPoints.length > 1 && <polyline points={linePoints} fill="none" stroke="#549c88" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
              {chartPoints.map((point) => (
                <g key={`${point.type}-${point.id}`}>
                  <circle cx={point.x} cy={point.y} r="7" fill={point.emotion?.color || "#8b9ba7"} stroke="white" strokeWidth="3" />
                  <title>{`${point.emotion?.label || "Mood"} · ${new Date(point.created_at).toLocaleDateString()}`}</title>
                </g>
              ))}
            </svg>
            <div className="flex justify-between px-1 text-[10px] text-slate-500">
              <span>Low</span><span>Steady</span><span>Bright</span>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[...chartPoints].reverse().map((checkIn) => (
              <div key={`${checkIn.type}-${checkIn.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-[#fbfdfb] px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: checkIn.emotion?.color || "#8b9ba7" }} />
                  <span className="truncate text-sm font-semibold text-slate-800">{checkIn.emotion?.label || "Mood saved"}</span>
                  <span className="truncate text-[10px] text-slate-500">{checkIn.type === "ai_prediction" ? "Reflection" : "Check-in"}</span>
                </span>
                <time dateTime={checkIn.created_at} className="shrink-0 text-[11px] text-slate-500">{new Date(checkIn.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}</time>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#f6f9f7] p-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white text-teal-700"><Heart size={17} /></span>
          <p className="text-sm leading-6 text-slate-600">No saved check-ins yet. Your dashboard will reflect them when you choose to add one.</p>
        </div>
      )}
    </section>
  );
}

function RecentMoments({ diaryEntries, chatActivity, loading }) {
  const diaryDates = useMemo(() => {
    const grouped = new Map();
    diaryEntries.forEach((entry) => {
      const date = localDateKey(entry.created_at);
      if (date) grouped.set(date, (grouped.get(date) || 0) + 1);
    });
    return [...grouped.entries()].sort(([left], [right]) => right.localeCompare(left)).slice(0, 4);
  }, [diaryEntries]);
  const recentChats = chatActivity.slice(0, 4);

  return (
    <section className="rounded-3xl border border-white bg-white/90 p-5 shadow-[0_10px_30px_rgba(29,78,70,0.07)] sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Little moments that count</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Your diary & community days</h2>
          <p className="mt-1 text-xs text-slate-500">Only dates and chat counts are shown here—not diary or message contents.</p>
        </div>
        <svg viewBox="0 0 100 84" role="img" aria-label="A smiling sun peeking over a happy cloud" className="h-16 w-20 shrink-0 sm:h-20 sm:w-24">
          <g className="origin-center" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <circle cx="68" cy="27" r="15" fill="#F7C95D" />
            <path d="M68 5v-3M68 52v-3M46 27h-4M94 27h-4M52 11l-3-3M87 46l-3-3M84 11l3-3M49 46l3-3" stroke="#E6A83B" strokeWidth="3" strokeLinecap="round" />
            <circle cx="63" cy="27" r="1.5" fill="#614D45" /><circle cx="73" cy="27" r="1.5" fill="#614D45" />
            <path d="M63 33q5 5 10 0" fill="none" stroke="#614D45" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          <path d="M20 65c-8 0-13-5-13-12 0-7 6-12 13-12 2-9 10-15 19-15 10 0 18 7 20 16 2-1 4-2 7-2 8 0 14 6 14 13s-6 12-14 12H20Z" fill="#D9F0E8" stroke="#82BDA9" strokeWidth="2" />
          <circle cx="34" cy="48" r="1.8" fill="#355A54" /><circle cx="48" cy="48" r="1.8" fill="#355A54" />
          <path d="M36 54q5 5 10 0" fill="none" stroke="#355A54" strokeWidth="2" strokeLinecap="round" />
          <circle cx="29" cy="53" r="3" fill="#F3A9A0" opacity=".75" /><circle cx="53" cy="53" r="3" fill="#F3A9A0" opacity=".75" />
        </svg>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-amber-50/80 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-950"><BookHeart size={16} /> Diary dates</h3>
          {loading ? <p className="mt-3 text-xs text-slate-500">Loading your private dates…</p> : diaryDates.length ? (
            <ul className="mt-3 space-y-2">
              {diaryDates.map(([date, count]) => (
                <li key={date} className="flex items-center justify-between gap-2 text-xs text-slate-700">
                  <time dateTime={date}>{new Date(`${date}T12:00:00`).toLocaleDateString([], { dateStyle: "medium" })}</time>
                  <span className="rounded-full bg-white/80 px-2 py-1">{count} {count === 1 ? "entry" : "entries"}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-xs leading-5 text-slate-600">Your diary dates will show up here when you write an entry.</p>}
        </div>
        <div className="rounded-2xl bg-sky-50/80 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-sky-950"><MessageCircle size={16} /> Community chat dates</h3>
          {loading ? <p className="mt-3 text-xs text-slate-500">Loading your chat dates…</p> : recentChats.length ? (
            <ul className="mt-3 space-y-2">
              {recentChats.map((chat) => (
                <li key={chat.id} className="flex items-center justify-between gap-2 text-xs text-slate-700">
                  <span className="min-w-0 truncate">{chat.community_name} · {new Date(`${chat.date}T12:00:00`).toLocaleDateString([], { dateStyle: "medium" })}</span>
                  <span className="shrink-0 rounded-full bg-white/80 px-2 py-1">{chat.message_count} {chat.message_count === 1 ? "message" : "messages"}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-xs leading-5 text-slate-600">When you chat with your community, the date will appear here. Your conversation stays private.</p>}
        </div>
      </div>
      <p className="mt-4 rounded-2xl bg-[#f2f8f4] px-4 py-3 text-xs leading-5 text-teal-950">
        Tiny joy break: why did the cloud take a nap? It needed a little <strong>rest-cast</strong>. ☁️
      </p>
    </section>
  );
}

export default function ActivitiesSection() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [chatActivity, setChatActivity] = useState([]);
  const [privateActivityLoading, setPrivateActivityLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const activitySnapshot = useSyncExternalStore(
    subscribeToDashboardActivity,
    getDashboardActivitySnapshot,
    () => "[]",
  );
  const explored = useMemo(() => {
    try {
      const parsed = JSON.parse(activitySnapshot);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [activitySnapshot]);
  const [bookingError, setBookingError] = useState("");
  const [moodError, setMoodError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(true);
  const [moodLoading, setMoodLoading] = useState(true);
  const [scheduleReload, setScheduleReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMoodHistory(30, 100)
      .then((data) => {
        if (!cancelled) {
          setMoodHistory(data);
          setCheckIns(data.filter((item) => item.type === "self_reported"));
        }
      })
      .catch((error) => { if (!cancelled) setMoodError(error.message); })
      .finally(() => { if (!cancelled) setMoodLoading(false); });
    const token = localStorage.getItem("mh_token");
    if (token) {
      getUserProfile()
        .then((profile) => { if (!cancelled) setUser({ name: profile.display_name }); })
        .catch((error) => console.error("Failed to load dashboard profile:", error))
        .finally(() => { if (!cancelled) setPrivateActivityLoading(false); });
      getCommunityChatActivity()
        .then((data) => { if (!cancelled) setChatActivity(data.results || data); })
        .catch((error) => console.error("Failed to load private community chat dates:", error));
      const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
      fetch(`${apiBase}/api/diary/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          if (!response.ok) throw new Error("Private diary dates could not be loaded.");
          return response.json();
        })
        .then((data) => {
          if (!cancelled) {
            setDiaryEntries(data.map(({ id, created_at }) => ({ id, created_at })));
          }
        })
        .catch((error) => console.error("Failed to load private diary activity:", error));
      getUserMemberships()
        .then((data) => { if (!cancelled) setMemberships(data.results || data); })
        .catch((error) => console.error("Failed to load community activity:", error));
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getWellnessBookings()
      .then((data) => { if (!cancelled) setBookings(data.results || data); })
      .catch((error) => { if (!cancelled) setBookingError(error.message); })
      .finally(() => { if (!cancelled) setBookingLoading(false); });
    return () => { cancelled = true; };
  }, [scheduleReload]);

  const retrySchedule = () => {
    setBookingLoading(true);
    setBookingError("");
    setScheduleReload((current) => current + 1);
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Your MindHaven space</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">A little room to breathe</h1>
          <p className="mt-1 text-sm text-slate-600">Your wellbeing tools and upcoming plans, gathered in one place.</p>
        </div>
        <Link href="/wellness" className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-900 transition hover:bg-teal-50">Explore wellness <ArrowRight size={15} /></Link>
      </header>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
            <CheckInCard user={user} />
            <UpcomingBookings bookings={bookings} loading={bookingLoading} error={bookingError} onRetry={retrySchedule} />
          </div>
          <RecentMood moodHistory={moodHistory} loading={moodLoading} error={moodError} />
          <RecentMoments diaryEntries={diaryEntries} chatActivity={chatActivity} loading={privateActivityLoading && user !== null} />
        </div>
        <div className="space-y-5">
          <CalendarCard
            bookings={bookings}
            checkIns={checkIns}
            diaryEntries={diaryEntries}
            memberships={memberships}
            chatActivity={chatActivity}
            explored={explored}
          />
          <section className="rounded-3xl bg-[linear-gradient(135deg,#dff3ea,#f1f8ee)] p-6 shadow-[0_10px_30px_rgba(29,78,70,0.07)]">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/80 text-teal-800"><Sprout size={21} /></span>
              <h2 className="text-lg font-semibold text-slate-900">Make space for you</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Try a short guided practice or explore an upcoming retreat. Every activity is optional; choose what feels right.</p>
            <div className="mt-5 grid gap-2">
              <Link href="/wellness" className="flex items-center justify-between rounded-2xl bg-white/75 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-white"><span className="flex items-center gap-2"><Wind size={16} className="text-teal-700" /> Browse mindful practices</span><ArrowRight size={15} /></Link>
              <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("switch-section", { detail: "diary" }))} className="flex items-center justify-between rounded-2xl bg-white/75 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-white"><span className="flex items-center gap-2"><BookOpen size={16} className="text-teal-700" /> Open your private diary</span><ArrowRight size={15} /></button>
            </div>
          </section>
          <ActivityTimeline
            bookings={bookings}
            diaryEntries={diaryEntries}
            chatActivity={chatActivity}
          />
        </div>
      </div>
    </section>
  );
}
