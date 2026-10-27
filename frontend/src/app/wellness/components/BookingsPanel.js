"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cancelWellnessBooking,
  createWellnessReflection,
  getWellnessBookings,
  getWellnessReflections,
} from "@/lib/wellness-api";

const MOODS = [
  ["very_low", "Low"],
  ["low", "A little low"],
  ["steady", "Steady"],
  ["good", "Good"],
  ["very_good", "Very good"],
];

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-teal-200 bg-white/75 px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-slate-900">No experiences booked yet</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Explore the Wellness Hub to find an experience that feels right for you.</p>
    </div>
  );
}

function ReflectionForm({ booking, onSubmitted }) {
  const [mood, setMood] = useState("steady");
  const [reflection, setReflection] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createWellnessReflection({
        booking_id: booking.id,
        mood,
        reflection_text: reflection,
      });
      setSaved(true);
      onSubmitted(booking.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (saved) return <p className="mt-4 text-sm font-medium text-teal-800" role="status">Your private reflection was saved.</p>;
  return (
    <form className="mt-4 rounded-2xl bg-[#f3faf6] p-4" onSubmit={submit}>
      <p className="text-sm font-semibold text-slate-800">Take a moment to reflect (optional)</p>
      <label className="mt-3 block text-sm text-slate-700">
        How are you feeling?
        <select value={mood} onChange={(event) => setMood(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2">
          {MOODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="mt-3 block text-sm text-slate-700">
        A private note (encrypted before storage)
        <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} rows={3} maxLength={4000} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3" />
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
      <button disabled={busy} className="mt-3 rounded-full bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save reflection"}</button>
      <p className="mt-2 text-xs leading-5 text-slate-500">Your mood is added to your MindHaven mood history. This note is private to you and is not sent to an AI service or organizer.</p>
    </form>
  );
}

export default function BookingsPanel() {
  const [bookings, setBookings] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bookingData, reflectionData] = await Promise.all([
        getWellnessBookings(),
        getWellnessReflections(),
      ]);
      setBookings(bookingData.results || bookingData);
      setReflections(reflectionData.results || reflectionData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cancel = async (booking) => {
    setBusyId(booking.id);
    setError("");
    try {
      await cancelWellnessBooking(booking.id);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <div className="h-40 animate-pulse rounded-3xl bg-white/80" aria-label="Loading bookings" />;
  if (error && !bookings.length) return <p role="alert" className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-800">{error} <button onClick={load} className="font-semibold underline">Try again</button></p>;
  if (!bookings.length) return <EmptyState />;

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {bookings.map((booking) => {
        const experience = booking.experience;
        const hasReflection = reflections.some((reflection) => reflection.booking === booking.id);
        const canCancel = ["confirmed", "pending_payment"].includes(booking.status);
        const eligibleToReflect = experience.status === "completed" && booking.status === "confirmed" && !hasReflection;
        return (
          <article key={booking.id} className="rounded-3xl border border-white bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{booking.status.replace("_", " ")} · {booking.payment_status.replace("_", " ")}</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">{experience.title}</h2>
                {experience.is_demo && <p className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">Demo registration · no real event</p>}
                <p className="mt-1 text-sm text-slate-600">{new Date(experience.start_at).toLocaleString()}</p>
                <p className="mt-2 text-xs text-slate-500">Booking reference: <span className="font-mono font-semibold text-slate-700">{booking.booking_reference}</span></p>
              </div>
              <p className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-900">
                {Number(booking.amount) === 0 ? "Free" : `${booking.currency} ${Number(booking.amount).toLocaleString()}`}
              </p>
            </div>
            {experience.virtual_link && booking.status === "confirmed" && (
              <div className="mt-4 rounded-xl bg-teal-50 p-4 text-sm text-teal-950">
                <p className="font-semibold">Private session access</p>
                <a href={experience.virtual_link} target="_blank" rel="noreferrer" className="mt-1 block break-all underline">{experience.virtual_link}</a>
                {experience.virtual_access_instructions && <p className="mt-2 whitespace-pre-line">{experience.virtual_access_instructions}</p>}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {canCancel && <button disabled={busyId === booking.id} onClick={() => cancel(booking)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{busyId === booking.id ? "Cancelling…" : "Cancel booking"}</button>}
              {eligibleToReflect && <a href="#reflection" className="text-sm font-semibold text-teal-800 underline">Add a reflection</a>}
            </div>
            {eligibleToReflect && <div id="reflection"><ReflectionForm booking={booking} onSubmitted={(id) => setReflections((items) => [...items, { booking: id }])} /></div>}
          </article>
        );
      })}
    </div>
  );
}
