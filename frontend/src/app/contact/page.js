"use client";
import Image from "next/image";
import { Mail, Phone, MapPin, Instagram, Linkedin, Send, ArrowUpRight, MessageCircleHeart } from "lucide-react";
import Link from "next/link";
import ContactImg from "../../public/landingpage/copy1.png";

const contactDetails = [
  {
    icon: Mail,
    label: "Email",
    value: "harshitaggarwal100306@gmail.com",
    href: "mailto:harshitaggarwal100306@gmail.com",
  },
  { icon: Phone, label: "Call", value: "+91 80592 41824", href: "tel:+918059241824" },
  { icon: MapPin, label: "Based in", value: "Haryana, India" },
];

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fbfaf6] font-[Poppins] text-slate-800">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#eef7f1] via-[#f8f7f0] to-[#f8ecdf] px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:px-12 lg:pb-24 lg:pt-40">
        <div className="pointer-events-none absolute -right-24 top-20 size-80 rounded-full bg-teal-100/60 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-36 left-1/4 size-96 rounded-full bg-amber-100/60 blur-3xl" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3.5 py-2 text-xs font-semibold tracking-wide text-teal-800 shadow-sm backdrop-blur">
              <MessageCircleHeart size={15} />
              We’re here to listen
            </div>
            <div>
              <h1 className="max-w-2xl font-[Playfair_Display] text-4xl font-bold leading-[1.12] tracking-tight text-[#233f37] sm:text-5xl lg:text-6xl">
                Let’s make room for a{" "}
                <span className="text-teal-700">conversation.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Questions, ideas, or a small hello—whatever is on your mind, we’d be glad to hear from you.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-1">
              {contactDetails.map(({ icon: Icon, label, value, href }) => {
                const content = (
                  <>
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf5ee] text-teal-800 transition group-hover:bg-teal-100">
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span>
                      <span className="mt-0.5 block break-words text-sm font-medium text-slate-800 sm:text-base">{value}</span>
                    </span>
                    {href && <ArrowUpRight size={16} className="ml-auto shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-700" />}
                  </>
                );
                const className = "group flex items-center gap-4 rounded-2xl border border-white/85 bg-white/65 p-3.5 shadow-[0_8px_24px_rgba(46,83,66,0.05)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_12px_30px_rgba(46,83,66,0.09)]";

                return href ? (
                  <a key={label} href={href} className={className}>{content}</a>
                ) : (
                  <div key={label} className={className}>{content}</div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-sm font-medium text-slate-500">Say hello elsewhere</span>
              <Link
                href="https://instagram.com/harshit_agg_"
                target="_blank"
                rel="noreferrer"
                aria-label="MindHaven on Instagram"
                className="flex size-10 items-center justify-center rounded-full border border-white/80 bg-white/70 text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                <Instagram size={18} />
              </Link>
              <Link
                href="https://linkedin.com/in/harshit-aggarwal-8727b4227"
                target="_blank"
                rel="noreferrer"
                aria-label="Harshit on LinkedIn"
                className="flex size-10 items-center justify-center rounded-full border border-white/80 bg-white/70 text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                <Linkedin size={18} />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[34rem]">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-teal-100/80 via-white/40 to-amber-100/80 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-[2rem] border border-white/80 bg-white/55 p-3 shadow-[0_25px_70px_rgba(46,83,66,0.13)] backdrop-blur-sm sm:p-4">
              <Image
                src={ContactImg}
                alt="A calm, welcoming space to connect with MindHaven"
                width={620}
                height={560}
                className="aspect-[1.12/1] w-full rounded-[1.5rem] object-cover"
                priority
              />
              <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/75 bg-white/80 p-4 shadow-lg backdrop-blur-xl sm:bottom-8 sm:left-8 sm:right-8 sm:p-5">
                <p className="font-[Playfair_Display] text-lg font-semibold text-[#29483e] sm:text-xl">
                  “Every thoughtful change starts with listening.”
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">A note from the MindHaven team</p>
              </div>
            </div>
            <div className="absolute -right-2 -top-4 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-xs font-semibold text-teal-800 shadow-md backdrop-blur-xl sm:-right-4 sm:top-5">
              Your voice matters
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-[#e7eee7] bg-white/80 shadow-[0_18px_55px_rgba(46,83,66,0.08)] backdrop-blur-xl lg:grid-cols-[0.78fr_1.22fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#e9f4ed] to-[#f6f1e7] p-6 sm:p-9 lg:p-10">
            <div className="pointer-events-none absolute -bottom-20 -right-16 size-64 rounded-full border border-white/70" aria-hidden="true" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-800">Drop us a note</p>
              <h2 className="mt-3 font-[Playfair_Display] text-3xl font-bold leading-tight text-[#233f37] sm:text-4xl">
                We’ll meet you with care.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                Share what you need help with, what you’d love to see, or simply say hello. We’ll get back to you as soon as we can.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/55 px-3 py-2 text-xs font-medium text-slate-600">
                <span className="size-2 rounded-full bg-emerald-500" />
                A real person is ready to listen
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <form className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Your name</span>
                  <input
                    type="text"
                    placeholder="How should we address you?"
                    className="w-full rounded-xl border border-slate-200/90 bg-[#fbfcfa] px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-teal-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200/90 bg-[#fbfcfa] px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-teal-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">What’s on your mind?</span>
                <textarea
                  placeholder="Write us a little note..."
                  rows={5}
                  className="w-full resize-y rounded-xl border border-slate-200/90 bg-[#fbfcfa] px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-teal-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                />
              </label>
              <div className="flex flex-col items-start justify-between gap-4 pt-1 sm:flex-row sm:items-center">
                <p className="text-xs leading-5 text-slate-500">Your message is treated with care and respect.</p>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#267b69] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(38,123,105,0.2)] transition hover:-translate-y-0.5 hover:bg-[#1d6b5b] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:w-auto"
                >
                  Send a message <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
