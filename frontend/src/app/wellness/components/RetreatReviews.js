"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Star, Trash2, Upload, Video } from "lucide-react";
import {
  createRetreatReview,
  deleteRetreatReview,
  getRetreatReviews,
  getWellnessBookings,
} from "@/lib/wellness-api";

function formatReviewDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export default function RetreatReviews({ experience }) {
  const [reviews, setReviews] = useState([]);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const [media, setMedia] = useState(null);
  const [ownReviewId, setOwnReviewId] = useState(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hasToken = Boolean(localStorage.getItem("mh_token"));
    setSignedIn(hasToken);
    Promise.allSettled([
      getRetreatReviews(experience.slug),
      hasToken ? getWellnessBookings() : Promise.resolve([]),
    ])
      .then(([reviewResult, bookingResult]) => {
        if (cancelled) return;
        if (reviewResult.status === "fulfilled") {
          const reviewData = reviewResult.value.results || reviewResult.value;
          setReviews(reviewData);
          setOwnReviewId(reviewData.find((item) => item.is_mine)?.id || null);
        } else {
          setError(reviewResult.reason.message);
        }
        if (bookingResult.status === "fulfilled") {
          const bookingData = bookingResult.value.results || bookingResult.value;
          const eligibleBooking = bookingData.find((item) => (
            item.experience.id === experience.id
            && item.status === "confirmed"
            && (
              item.experience.status === "completed"
              || new Date(item.experience.end_at) <= new Date()
            )
          ));
          if (eligibleBooking) setBooking(eligibleBooking);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [experience.id, experience.slug]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!booking) return;
    setPosting(true);
    setError("");
    const formData = new FormData();
    formData.set("booking_id", booking.id);
    formData.set("rating", rating);
    formData.set("review", reviewText);
    if (media) formData.set("media", media);
    try {
      const created = await createRetreatReview(experience.slug, formData);
      setReviews((current) => [created, ...current]);
      setOwnReviewId(created.id);
      setReviewText("");
      setMedia(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPosting(false);
    }
  };

  const removeReview = async () => {
    if (!ownReviewId) return;
    setError("");
    try {
      await deleteRetreatReview(ownReviewId);
      setReviews((current) => current.filter((item) => item.id !== ownReviewId));
      setOwnReviewId(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const averageRating = reviews.length
    ? (reviews.reduce((total, item) => total + item.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="mt-7 rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_16px_42px_rgba(28,91,80,0.08)] sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Shared by participants</p>
          <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-950">
            Retreat reflections <MessageCircle size={21} className="text-teal-700" />
          </h2>
        </div>
        {averageRating && (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">
            <Star size={16} fill="currentColor" className="text-amber-500" /> {averageRating} <span className="font-normal text-slate-600">· {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
          </p>
        )}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      {loading ? (
        <div className="mt-5 h-24 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading retreat reviews" />
      ) : reviews.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {reviews.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-[#fbfdfb]">
              {item.media && item.media_kind === "image" && (
                <div className="relative h-52 bg-slate-100">
                  <Image src={item.media} alt="Participant-shared retreat memory" fill sizes="(max-width: 768px) 100vw, 50vw" unoptimized className="object-cover" />
                </div>
              )}
              {item.media && item.media_kind === "video" && (
                <video className="max-h-72 w-full bg-slate-950" controls preload="metadata">
                  <source src={item.media} />
                  Your browser does not support embedded video.
                </video>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">MindHaven participant</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700" aria-label={`${item.rating} out of 5 stars`}>
                    {Array.from({ length: item.rating }, (_, index) => <Star key={index} size={14} fill="currentColor" />)}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{item.review}</p>
                <p className="mt-3 text-xs text-slate-500">{formatReviewDate(item.created_at)} · Verified booking</p>
                {item.id === ownReviewId && (
                  <button type="button" onClick={removeReview} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700">
                    <Trash2 size={13} /> Remove my review
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-[#f6f9f7] p-4 text-sm leading-6 text-slate-600">
          No participant reviews yet. After attending, you can share an honest reflection if you’d like.
        </p>
      )}

      {ownReviewId ? (
        <p className="mt-5 rounded-xl bg-teal-50 p-4 text-sm text-teal-900">Thanks for sharing your experience. Your review is visible to other visitors.</p>
      ) : booking ? (
        <form onSubmit={submitReview} className="mt-6 rounded-2xl bg-[#f4f9f6] p-4 sm:p-5">
          <h3 className="font-semibold text-slate-900">Share your retreat experience</h3>
          <p className="mt-1 text-sm text-slate-600">Reviews are public as soon as you post. Your account name is not shown.</p>
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-slate-700">Your rating</legend>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: 5 }, (_, index) => {
                const value = String(index + 1);
                const selected = Number(rating) >= index + 1;
                return (
                  <button key={value} type="button" onClick={() => setRating(value)} aria-label={`Rate ${value} out of 5`} aria-pressed={rating === value} className="rounded p-1 text-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700">
                    <Star size={23} fill={selected ? "currentColor" : "none"} />
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Your review
            <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} required minLength={10} maxLength={2000} rows={4} placeholder="What would you like other participants to know?" className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
          </label>
          <label className="mt-4 flex cursor-pointer flex-wrap items-center gap-3 rounded-xl border border-dashed border-teal-300 bg-white p-4 text-sm text-slate-700 hover:border-teal-600">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-800">{media?.type.startsWith("video/") ? <Video size={19} /> : <Upload size={19} />}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Add a photo or short video (optional)</span>
              <span className="mt-1 block text-xs text-slate-500">{media ? media.name : "JPG, PNG, WebP up to 12 MB · MP4, WebM up to 50 MB"}</span>
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(event) => setMedia(event.target.files?.[0] || null)} className="sr-only" />
          </label>
          <button type="submit" disabled={posting} className="mt-4 rounded-full bg-teal-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50">
            {posting ? "Posting review…" : "Post review"}
          </button>
        </form>
      ) : (
        <div className="mt-5 rounded-xl bg-[#f6f9f7] p-4 text-sm leading-6 text-slate-600">
          Reviews are available to participants after a confirmed booking has ended.
          {!signedIn && <> <Link href="/login" className="font-semibold text-teal-800 underline">Sign in</Link> to check your eligibility.</>}
        </div>
      )}
    </section>
  );
}
