"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CalendarDays, MapPin, MonitorPlay, Users } from "lucide-react";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ExperienceCard({ experience }) {
  const virtual = experience.format === "virtual";

  return (
    <article className="overflow-hidden rounded-[1.4rem] border border-teal-950/5 bg-white shadow-[0_12px_32px_rgba(30,80,72,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(30,80,72,0.13)]">
      {experience.cover_image ? (
        <div className="relative h-44 w-full">
          <Image
            src={experience.cover_image}
            alt={`Cover image for ${experience.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-44 items-end bg-[radial-gradient(circle_at_75%_20%,#fff8d9_0,transparent_28%),linear-gradient(130deg,#d9f1e6,#c2e4df_55%,#e8eee3)] p-5">
          <span className="rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs font-semibold text-teal-900">
            {experience.category.name}
          </span>
        </div>
      )}
      <div className="p-5">
        {experience.is_demo && (
          <p className="mb-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900">
            Demo only · no real event
          </p>
        )}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-teal-700">
              {experience.format.replace("_", " ")}
            </p>
            <h3 className="mt-2 text-lg font-semibold leading-snug text-slate-900">
              {experience.title}
            </h3>
          </div>
          <span className="shrink-0 rounded-full bg-[#eff8f1] px-3 py-1.5 text-sm font-semibold text-teal-900">
            {Number(experience.price) === 0
              ? "Free"
              : `${experience.currency} ${Number(experience.price).toLocaleString()}`}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {experience.description}
        </p>
        {experience.is_demo && (
          <p className="mt-2 text-xs leading-5 text-amber-800">
            Free sample registration for testing. This camp is fictional; do not travel to the listed venue.
          </p>
        )}
        <div className="mt-4 grid gap-2 text-xs text-slate-600">
          <span className="flex items-center gap-2">
            {virtual ? <MonitorPlay size={15} /> : <MapPin size={15} />}
            {virtual ? "Online session" : experience.location}
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays size={15} />
            {formatDate(experience.start_at)}
          </span>
          <span className="flex items-center gap-2">
            <Users size={15} />
            {experience.is_available
              ? `${experience.remaining_capacity} places available`
              : "Registration unavailable"}
          </span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            Hosted by <span className="font-medium text-slate-700">{experience.provider.display_name}</span>
          </p>
          <Link
            href={`/wellness/${experience.slug}`}
            className="inline-flex items-center gap-1 rounded-full bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
          >
            Explore <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
