"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Shield,
  Brain,
  Users,
  Linkedin,
  Instagram,
  Mail,
  Sparkles,
  Leaf,
} from "lucide-react";
import Harshit from "../../public/landingpage/myimg.jpeg";
import About from "../../public/landingpage/about.png";
import Story from "../../public/landingpage/story.png";

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fbfaf6] font-[Outfit] text-slate-800">

      {/* 🧠 Hero Section */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#eff8f2] via-[#f9f8f1] to-[#f7ecdd] px-6 pb-16 pt-36 sm:px-10 sm:pb-20 sm:pt-40 lg:px-16 lg:pb-24">
        <div className="pointer-events-none absolute -right-20 top-20 size-80 rounded-full bg-[#d6eee0]/60 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-96 rounded-full bg-[#fae8c9]/45 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-10 lg:flex-row lg:gap-16">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white/70 px-3 py-1.5 text-xs font-semibold tracking-wide text-teal-800 shadow-sm lg:mx-0">
            <Leaf size={14} /> A little more room to breathe
          </div>
          <h1 className="text-4xl font-[Playfair_Display] font-bold leading-tight text-[#233f37] sm:text-5xl md:text-6xl">
            A place where <br className="hidden sm:block" />
            <span className="text-teal-700">
              care meets technology
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
            MindHaven brings mindful tools, supportive community, and thoughtful technology together in one gentle space for reflection and growth.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-[#237c68] px-6 py-3 font-semibold text-white shadow-[0_10px_24px_rgba(35,124,104,0.2)] transition hover:-translate-y-0.5 hover:bg-[#1d6b5b] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
          >
            <Sparkles size={18} /> Find your space <ArrowRight size={16} />
          </Link>
        </div>

        {/* Hero Image */}
        <div className="relative flex flex-1 justify-center">
          <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-teal-100/80 via-white/50 to-amber-100/70 blur-2xl" aria-hidden="true" />
          <Image
            src={About}
            alt="Mindfulness and healing concept"
            width={480}
            height={480}
            className="relative z-10 aspect-square w-full max-w-[28rem] rounded-[2rem] border-8 border-white/75 object-cover shadow-[0_24px_70px_rgba(46,83,66,0.16)] transition-transform duration-500 hover:-rotate-1 hover:scale-[1.02]"
          />
        </div>
        </div>
      </section>

      {/* 🌸 Creative Story Section */}
      <section className="relative overflow-hidden bg-[#fbfaf6] px-6 py-20 sm:px-10 sm:py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Why MindHaven began</p>
          <h2 className="mt-3 text-4xl font-[Playfair_Display] font-bold text-[#233f37] sm:text-5xl">
            Our{" "}
            <span className="text-teal-700">
              Story
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            A simple idea guides us: <strong className="font-semibold text-slate-800">technology can feel more human</strong> when empathy leads the way.
          </p>
          </div>

          <div className="relative mt-12 grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-3 rounded-[2.25rem] bg-gradient-to-br from-teal-100 to-amber-100 opacity-70 blur-xl" aria-hidden="true" />
              <Image
                src={Story}
                alt="Our journey illustration"
                width={500}
                height={500}
                className="relative z-10 aspect-[4/3] w-full rounded-[1.75rem] border-8 border-white/80 object-cover shadow-[0_20px_55px_rgba(46,83,66,0.12)] transition-transform duration-500 hover:scale-[1.015]"
              />
            </div>

            <div className="rounded-[1.75rem] border border-[#e7eee7] bg-white/85 p-6 shadow-[0_14px_38px_rgba(46,83,66,0.07)] sm:p-9">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eaf5ee] text-teal-800">
                <Heart size={20} />
              </div>
              <p className="mt-5 text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                MindHaven was born from a simple belief: emotional wellness should feel <em className="text-teal-800">warm</em>, <em className="text-teal-800">personal</em>, and welcoming.
              </p>

              <blockquote className="mt-5 border-l-2 border-teal-300 pl-4 font-[Playfair_Display] text-xl italic leading-relaxed text-teal-800 sm:text-2xl">
                “Technology can heal when guided by empathy.”
              </blockquote>

              <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
                We bring reflection, connection, and mindful practices together so you can find the tools that feel right for you—at your own pace.
              </p>

              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-5 py-2.5 text-sm font-semibold text-teal-900 transition hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
              >
                Join the journey <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 🌿 Our Core Values Section */} 
      <section className="relative overflow-hidden bg-gradient-to-br from-[#eef7f1] via-[#f7f8f2] to-[#f8f0e5] px-6 py-20 text-center sm:px-10 sm:py-24 lg:px-16">
        <div className="relative z-10 mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">What guides us</p>
        <h2 className="mt-3 font-[Playfair_Display] text-4xl font-bold text-[#233f37] sm:text-5xl">
          Our{" "}
          <span className="text-teal-700">
            Core Values
          </span>
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Empathy First",
              desc: "Every interaction starts with compassion and a human touch.",
              icon: <Heart className="w-10 h-10 text-pink-400" />,
              color: "from-pink-100 to-pink-200",
            },
            {
              title: "Privacy & Safety",
              desc: "Your emotions are sacred. Your trust is our foundation.",
              icon: <Shield className="w-10 h-10 text-teal-500" />,
              color: "from-teal-100 to-emerald-100",
            },
            {
              title: "Growth Together",
              desc: "We evolve with you — healing is a journey, not a destination.",
              icon: <Users className="w-10 h-10 text-emerald-500" />,
              color: "from-emerald-100 to-green-100",
            },
            {
              title: "AI with Heart",
              desc: "Blending technology and empathy to craft mindful connections.",
              icon: <Brain className="w-10 h-10 text-indigo-400" />,
              color: "from-indigo-100 to-purple-100",
            },
          ].map((value, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/80 p-6 text-left shadow-[0_8px_24px_rgba(46,83,66,0.06)] transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_16px_34px_rgba(46,83,66,0.1)]"
            >
              <div
                className={`absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br ${value.color} opacity-60 blur-2xl transition-opacity group-hover:opacity-90`}
                aria-hidden="true"
              />
              <div className="relative">
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-white bg-white/90 shadow-sm transition-transform group-hover:-rotate-3 group-hover:scale-105">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {value.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>
      {/* 👨‍💻 Founder Section */}{" "}
      <section className="relative bg-[#fbfaf6] px-6 py-20 text-center sm:px-10 sm:py-24 lg:px-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">The person behind the idea</p>
        <h2 className="mt-3 mb-8 font-[Playfair_Display] text-4xl font-bold text-[#233f37] sm:text-5xl">
          {" "}
          Meet the <span className="text-teal-700 italic">Founder</span>{" "}
        </h2>{" "}
        <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center justify-center gap-8 rounded-[1.75rem] border border-[#e7eee7] bg-white/85 p-6 text-left shadow-[0_14px_38px_rgba(46,83,66,0.07)] sm:p-9 lg:flex-row lg:gap-12">
          {" "}
          <Image
            src={Harshit}
            alt="Harshit Aggarwal"
            width={380}
            height={380}
            className="aspect-square w-full max-w-[19rem] rounded-[1.5rem] border-8 border-[#f1f7f1] object-cover shadow-lg transition-transform duration-500 hover:scale-[1.02]"
          />{" "}
          <div className="text-left space-y-5">
            {" "}
            <h3 className="text-2xl font-bold text-[#233f37] font-[Playfair_Display] sm:text-3xl">
              {" "}
              Harshit Aggarwal{" "}
            </h3>{" "}
            <p className="text-base leading-7 text-slate-600 sm:text-lg">
              {" "}
              The visionary behind <strong>MindHaven</strong>, Harshit is
              committed to fusing technology and empathy to make emotional care
              accessible for all. His mission is to empower people to heal
              freely and live mindfully.{" "}
            </p>{" "}
            <blockquote className="border-l-2 border-teal-300 pl-4 font-[Playfair_Display] text-lg italic leading-relaxed text-teal-800 sm:text-xl">
              {" "}
              “Healing doesn’t need to be clinical — it needs to be kind.”{" "}
            </blockquote>{" "}
            {/* 🌐 Social Links */}{" "}
            <div className="mt-6 flex gap-3">
              {" "}
              <Link
                href="mailto:harshitagg2003@gmail.com"
                target="_blank"
                aria-label="Email Harshit"
                className="rounded-full bg-teal-50 p-3 text-teal-800 transition hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
              >
                {" "}
                <Mail size={26} />{" "}
              </Link>{" "}
              <Link
                href="https://linkedin.com/in/harshit-aggarwal-8727b4227"
                target="_blank"
                aria-label="Harshit on LinkedIn"
                className="rounded-full bg-teal-50 p-3 text-teal-800 transition hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
              >
                {" "}
                <Linkedin size={26} />{" "}
              </Link>{" "}
              <Link
                href="https://instagram.com/harshit_agg_"
                target="_blank"
                aria-label="Harshit on Instagram"
                className="rounded-full bg-teal-50 p-3 text-teal-800 transition hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
              >
                {" "}
                <Instagram size={26} />{" "}
              </Link>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      {/* ✨ Subtle Bottom Glow */}{" "}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-linear-to-t from-[#E8F9FF] to-transparent"></div>{" "}
    </div>
  );
}
