"use client";

import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Check, Clock3, MapPin, MonitorPlay, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { createWellnessBooking, getWellnessExperience, verifyWellnessPayment } from "@/lib/wellness-api";
import RetreatReviews from "../components/RetreatReviews";

function formatDate(value, timeZone) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timeZone || undefined,
  }).format(new Date(value));
}

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Razorpay Checkout could not be loaded. Check your connection and try again."));
    document.body.appendChild(script);
  });
}

export default function WellnessExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [participants, setParticipants] = useState(1);
  const [bookingBusy, setBookingBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWellnessExperience(params.slug)
      .then((data) => {
        if (!cancelled) setExperience(data);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [params.slug]);

  const bookExperience = async () => {
    if (!localStorage.getItem("mh_token")) {
      router.push("/login");
      return;
    }
    setBookingBusy(true);
    setBookingError("");
    setBookingMessage("");
    let checkoutOpened = false;
    try {
      const response = await createWellnessBooking({
        experience_id: experience.id,
        participant_count: participants,
        idempotency_key: window.crypto.randomUUID(),
      });
      if (response.checkout) {
        await loadCheckout();
      } else if (response.booking.status === "confirmed") {
        setBookingMessage(`Registration confirmed. Your booking reference is ${response.booking.booking_reference}.`);
        setExperience((current) => ({
          ...current,
          remaining_capacity: Math.max(0, current.remaining_capacity - participants),
          is_available: current.remaining_capacity - participants > 0,
        }));
        return;
      } else {
        throw new Error("This booking still needs payment confirmation. Check My bookings before trying again.");
      }
      const checkout = new window.Razorpay({
        key: response.checkout.key_id,
        order_id: response.checkout.order_id,
        amount: response.checkout.amount,
        currency: response.checkout.currency,
        name: "MindHaven",
        description: experience.title,
        notes: { booking_reference: response.checkout.booking_reference },
        modal: {
          ondismiss: () => {
            setBookingMessage("Payment was not confirmed. Your place is held temporarily while the payment is pending.");
            setBookingBusy(false);
          },
        },
        handler: async (paymentResponse) => {
          try {
            const verified = await verifyWellnessPayment(response.booking.id, paymentResponse);
            setBookingMessage(`Payment confirmed. Your booking reference is ${verified.booking_reference}.`);
            setExperience((current) => ({
              ...current,
              remaining_capacity: Math.max(0, current.remaining_capacity - participants),
              is_available: current.remaining_capacity - participants > 0,
            }));
          } catch (verificationError) {
            setBookingError(`Payment was returned by checkout but could not yet be verified: ${verificationError.message}. Check My bookings before trying again.`);
          } finally {
            setBookingBusy(false);
          }
        },
      });
      checkout.on("payment.failed", (event) => {
        setBookingError(event.error?.description || "Payment was not completed. Your booking remains unconfirmed.");
        setBookingBusy(false);
      });
      checkout.open();
      checkoutOpened = true;
      return;
    } catch (requestError) {
      setBookingError(requestError.message);
    } finally {
      if (!checkoutOpened) setBookingBusy(false);
    }
  };

  if (loading) return <main className="min-h-screen bg-[#f3faf7] p-8"><div className="mx-auto h-96 max-w-5xl animate-pulse rounded-3xl bg-white" /></main>;
  if (error || !experience) return <main className="min-h-screen bg-[#f3faf7] px-5 py-12"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8"><p role="alert" className="text-rose-800">{error || "Experience not found."}</p><Link href="/wellness" className="mt-4 inline-block font-semibold text-teal-800 underline">Back to Wellness Hub</Link></div></main>;

  const virtual = experience.format === "virtual";
  const coldExposure = /ice bath|cold exposure|cold plunge|cold-water immersion/i.test(
    `${experience.title} ${experience.description} ${experience.category.slug}`,
  );

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <main className="min-h-screen bg-[linear-gradient(145deg,#f2faf7_0%,#f7fbf8_48%,#fff9ef_100%)] px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Link href="/wellness" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:underline"><ArrowLeft size={16} /> Back to experiences</Link>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <article className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_20px_55px_rgba(28,91,80,0.08)]">
              {experience.cover_image ? <div className="relative h-64 w-full sm:h-80"><Image src={experience.cover_image} alt={`Cover image for ${experience.title}`} fill sizes="(max-width: 768px) 100vw, 66vw" unoptimized className="object-cover" /></div> : <div className="h-56 bg-[radial-gradient(circle_at_75%_20%,#fff8d9_0,transparent_28%),linear-gradient(130deg,#d9f1e6,#c2e4df_55%,#e8eee3)] sm:h-72" />}
              <div className="p-6 sm:p-9">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">{experience.category.name} · {experience.format.replace("_", " ")}</p>
                <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">{experience.title}</h1>
                {experience.is_demo && (
                  <div role="note" className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                    <p className="font-bold">DEMO ONLY — fictional camp for booking-flow testing</p>
                    <p className="mt-1">This is not a real event. No host, venue, or live session will be available. Do not travel to the sample address. A free registration creates a test booking in your account only.</p>
                  </div>
                )}
                <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-600">{experience.description}</p>
                <div className="mt-6 grid gap-4 rounded-2xl bg-[#f5faf7] p-5 text-sm text-slate-700 sm:grid-cols-2">
                  <p className="flex items-start gap-3"><CalendarDays className="mt-0.5 shrink-0 text-teal-800" size={17} /><span>{formatDate(experience.start_at, experience.timezone_name)}<br />Until {formatDate(experience.end_at, experience.timezone_name)}</span></p>
                  <p className="flex items-start gap-3"><Clock3 className="mt-0.5 shrink-0 text-teal-800" size={17} /><span>{experience.duration_minutes} minutes · {experience.timezone_name}</span></p>
                  <p className="flex items-start gap-3"><MapPin className="mt-0.5 shrink-0 text-teal-800" size={17} /><span>{[virtual ? "Online session" : experience.location, experience.venue_details].filter(Boolean).join(" · ")}</span></p>
                  <p className="flex items-start gap-3"><Users className="mt-0.5 shrink-0 text-teal-800" size={17} /><span>{experience.is_available ? `${experience.remaining_capacity} of ${experience.capacity} places available` : `Registration unavailable · ${experience.capacity} places total`}</span></p>
                  {experience.registration_opens_at && <p className="flex items-start gap-3"><Clock3 className="mt-0.5 shrink-0 text-teal-800" size={17} /><span>Registration opens {formatDate(experience.registration_opens_at, experience.timezone_name)}</span></p>}
                  {experience.registration_closes_at && <p className="flex items-start gap-3"><Clock3 className="mt-0.5 shrink-0 text-teal-800" size={17} /><span>Registration closes {formatDate(experience.registration_closes_at, experience.timezone_name)}</span></p>}
                </div>
                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <section>
                    <h2 className="font-semibold text-slate-900">Hosted by</h2>
                    <p className="mt-2 text-sm text-slate-600">{experience.provider.display_name}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{experience.provider.description || "Provider information is available as supplied by the organizer."}</p>
                    {experience.provider.is_verified && !experience.is_demo && <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-800"><ShieldCheck size={14} /> Provider verified by MindHaven</p>}
                  </section>
                  <section>
                    <h2 className="font-semibold text-slate-900">What&apos;s included</h2>
                    {experience.included?.length ? <ul className="mt-2 space-y-2 text-sm text-slate-600">{experience.included.map((item) => <li key={item} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-teal-700" />{item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Details have not been provided.</p>}
                  </section>
                  <section>
                    <h2 className="font-semibold text-slate-900">What to bring</h2>
                    {experience.what_to_bring?.length ? <ul className="mt-2 space-y-2 text-sm text-slate-600">{experience.what_to_bring.map((item) => <li key={item}>· {item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No preparation items have been listed.</p>}
                  </section>
                  <section>
                    <h2 className="font-semibold text-slate-900">Access and accessibility</h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{experience.accessibility_information || "Ask the provider about accessibility needs before booking."}</p>
                  </section>
                </div>
                {(experience.safety_information || coldExposure) && <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-semibold text-amber-950">Safety information</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-900">{experience.safety_information}</p>{coldExposure && <p className="mt-3 text-sm leading-6 text-amber-950">Cold exposure can carry health risks and may not be suitable for everyone. If you have a health concern, ask a qualified healthcare professional before participating. Stop if you feel unwell; participation is always optional.</p>}</section>}
                {experience.cancellation_policy && <section className="mt-6"><h2 className="font-semibold text-slate-900">Cancellation and refund policy</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{experience.cancellation_policy} {experience.price > 0 ? `Refund requests are available until ${experience.refund_before_hours} hours before the experience, subject to provider processing.` : ""}</p></section>}
                {virtual && experience.virtual_link && <section className="mt-6 rounded-2xl bg-teal-50 p-5"><h2 className="flex items-center gap-2 font-semibold text-teal-950"><MonitorPlay size={18} /> Authorized session access</h2><a href={experience.virtual_link} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm font-semibold text-teal-800 underline">{experience.virtual_link}</a>{experience.virtual_access_instructions && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-teal-950">{experience.virtual_access_instructions}</p>}</section>}
              </div>
            </article>
            <aside className="h-fit rounded-[2rem] border border-white bg-white p-6 shadow-[0_20px_55px_rgba(28,91,80,0.08)] lg:sticky lg:top-6">
              <p className="text-sm font-semibold text-teal-700">YOUR EXPERIENCE</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{Number(experience.price) === 0 ? "Free" : `${experience.currency} ${Number(experience.price).toLocaleString()}`}</p>
              {Number(experience.price) > 0 && <p className="mt-1 text-xs text-slate-500">per participant</p>}
              <label className="mt-5 block text-sm font-medium text-slate-700">
                Participants
                <select value={participants} onChange={(event) => setParticipants(Number(event.target.value))} disabled={!experience.is_available} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3">
                  {Array.from({ length: Math.min(8, experience.remaining_capacity) }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
                </select>
              </label>
              <p className="mt-3 flex justify-between text-sm text-slate-600"><span>Total</span><strong className="text-slate-900">{Number(experience.price) === 0 ? "Free" : `${experience.currency} ${(Number(experience.price) * participants).toLocaleString()}`}</strong></p>
              {experience.is_demo && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">Test booking only. This fictional camp will not take place.</p>}
              <button onClick={bookExperience} disabled={!experience.is_available || bookingBusy} className="mt-5 w-full rounded-full bg-teal-800 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                {bookingBusy ? "Processing…" : experience.is_available ? Number(experience.price) === 0 ? "Register for free" : "Continue to secure payment" : "Registration unavailable"}
              </button>
              {bookingError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{bookingError}</p>}
              {bookingMessage && <p role="status" className="mt-3 rounded-xl bg-teal-50 p-3 text-sm text-teal-900">{bookingMessage} <Link href="/wellness/bookings" className="font-semibold underline">View bookings</Link></p>}
              <p className="mt-4 text-xs leading-5 text-slate-500">Payment is confirmed by MindHaven after server-side verification. Do not share payment details with providers.</p>
            </aside>
          </div>
          <RetreatReviews experience={experience} />
        </div>
      </main>
    </>
  );
}
