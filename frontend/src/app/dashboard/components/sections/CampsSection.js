"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, CalendarDays, Compass, Heart, MapPin, Wind } from "lucide-react";
import { getWellnessBookings, getWellnessExperiences } from "@/lib/wellness-api";
import ExperienceCard from "@/app/wellness/components/ExperienceCard";

export default function CampsSection() {
  const [bookings, setBookings] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [experiencesLoading, setExperiencesLoading] = useState(true);
  const [experiencesError, setExperiencesError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getWellnessBookings({ upcoming: true })
      .then((data) => { if (!cancelled) setBookings(data.results || data); })
      .catch((requestError) => { if (!cancelled) setError(requestError.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getWellnessExperiences({ sort: "featured", page_size: 3 })
      .then((data) => {
        if (!cancelled) setExperiences(data.results || data);
      })
      .catch((requestError) => {
        if (!cancelled) setExperiencesError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setExperiencesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const upcoming = bookings
    .filter((booking) => ["confirmed", "pending_payment"].includes(booking.status))
    .sort((left, right) => new Date(left.experience.start_at) - new Date(right.experience.start_at));

  return (
    <section className="space-y-5">
      <header className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#173f38] p-7 text-white shadow-[0_18px_45px_rgba(18,63,53,0.18)] sm:p-9">
        <Image
          src="/images/wellness/nature.jpg"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 90vw"
          className="absolute inset-0 -z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#102f2c]/95 via-[#173f38]/80 to-[#173f38]/35" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-teal-50"><Compass size={14} /> MindHaven Wellness Hub</p>
            <h1 className="mt-4 font-[Quicksand] text-3xl font-semibold sm:text-4xl">A little space to feel like yourself</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">Picture an easier morning, a gentle stretch, or a quiet moment in nature. Explore real experiences when one feels right for you.</p>
          </div>
          <Link href="/wellness" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-teal-950 shadow transition hover:-translate-y-0.5 hover:bg-teal-50">Explore retreats <ArrowRight size={16} /></Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Yoga & gentle movement", detail: "A softer way to stretch, breathe, and move at your own pace.", image: "/images/wellness/yoga.jpg", alt: "Yoga practice in natural surroundings", icon: Wind },
          { title: "Meditation & stillness", detail: "Make room for a quiet pause, whether online or away.", image: "/images/wellness/meditation.jpg", alt: "Person sitting in a calm meditation practice", icon: Compass },
          { title: "Nature & a fresh start", detail: "Step outside, slow down, and find a little breathing room.", image: "/images/wellness/nature.jpg", alt: "Warm sunrise across a peaceful landscape", icon: Heart },
        ].map(({ title, detail, image, alt, icon: Icon }) => (
          <Link key={title} href="/wellness" className="group relative isolate flex min-h-48 flex-col justify-end overflow-hidden rounded-[1.35rem] border border-white shadow-sm">
            <Image src={image} alt={alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="absolute inset-0 -z-20 object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
            <div className="p-5 text-white">
              <span className="grid size-9 place-items-center rounded-xl border border-white/30 bg-white/15 backdrop-blur"><Icon size={17} /></span>
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 max-w-sm text-sm leading-5 text-white/85">{detail}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">Explore ideas <ArrowUpRight size={14} /></span>
            </div>
          </Link>
        ))}
      </section>
      <p className="-mt-2 text-right text-xs text-slate-500">
        Illustrative photography from <a href="https://unsplash.com/license" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-teal-800">Unsplash</a>.
      </p>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-700">Real, provider-published experiences</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">A place to begin</h2>
          </div>
          <Link href="/wellness" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline">Browse all experiences <ArrowRight size={15} /></Link>
        </div>
        {experiencesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading published experiences">
            {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-80 animate-pulse rounded-3xl bg-white" />)}
          </div>
        ) : experiencesError ? (
          <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{experiencesError}</p>
        ) : experiences.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {experiences.map((experience) => <ExperienceCard key={experience.id} experience={experience} />)}
          </div>
        ) : (
          <div className="grid gap-5 overflow-hidden rounded-[1.5rem] border border-white bg-white p-5 shadow-sm sm:grid-cols-[minmax(0,1fr)_15rem] sm:items-center sm:p-7">
            <div>
              <p className="text-sm font-semibold text-slate-900">Your next pause can start with a small idea</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">We don’t have a published retreat to book just yet. Explore the inspiration gallery, or check back when a verified provider shares an experience.</p>
              <Link href="/wellness#retreat-inspiration" className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900">Get inspired <ArrowRight size={15} /></Link>
            </div>
            <div className="relative h-36 overflow-hidden rounded-2xl">
              <Image src="/images/wellness/movement.jpg" alt="Gentle outdoor movement in warm morning light" fill sizes="240px" className="object-cover" />
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Your upcoming registrations</h2>
            <p className="mt-1 text-sm text-slate-600">Booking dates and statuses from your account.</p>
          </div>
          <Link href="/wellness/bookings" className="text-sm font-semibold text-teal-800 underline">View all bookings</Link>
        </div>
        {loading ? (
          <div className="mt-5 h-20 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading registrations" />
        ) : error ? (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>
        ) : upcoming.length ? (
          <div className="mt-4 divide-y divide-slate-100">
            {upcoming.slice(0, 4).map((booking) => (
              <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#f2f8f4] text-teal-800"><CalendarDays size={18} /></span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{booking.experience.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(booking.experience.start_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · {booking.booking_reference}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{booking.status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-[#f7faf8] p-5 text-center">
            <p className="text-sm font-medium text-slate-700">No experiences booked yet</p>
            <p className="mt-1 text-sm text-slate-500">Explore the Wellness Hub to find an experience that feels right for you.</p>
          </div>
        )}
      </section>
    </section>
  );
}
