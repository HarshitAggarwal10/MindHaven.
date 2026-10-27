"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  MessageSquareHeart,
  Users2,
  HeartHandshake,
  NotebookPen,
  BarChart3,
  Heart,
  Sparkles,
  XCircle,
  MessageCircle,
} from "lucide-react";
import "../styles/animation.css";
import ArrowIcon from "../public/landingpage/arrow.svg";
import Copy from "../public/landingpage/copy.png";
import B4MH from "../public/landingpage/before-mindhaven.png";
import AMH from "../public/landingpage/after-mindhaven.png";
import Review1 from "../public/community/pro1.webp";
import Review2 from "../public/community/pro2.webp";
import Review3 from "../public/community/pro3.webp";

export default function LandingPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const faqRef = useRef(null);
  const reviewRef = useRef(null);

  const toggleChat = () => setIsChatOpen((p) => !p);
  const toggleAnswer = (i) =>
    setActiveQuestion((current) => (current === i ? null : i));
  const scrollToFAQ = () =>
    faqRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToREV = () =>
    reviewRef.current?.scrollIntoView({ behavior: "smooth" });

  // Close chat on scroll
  useEffect(() => {
    const handleScroll = () => isChatOpen && setIsChatOpen(false);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isChatOpen]);

  return (
    <div className="font-[Quicksand] bg-[#F8FAFC] text-gray-800 overflow-hidden relative">
      {/* Hero Section */}
      <section className="relative h-screen bg-[url('../public/landingpage/back.png')] bg-cover bg-center flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-white/60 via-white/20 to-white/70 backdrop-blur-[3px]" />
        <div className="absolute top-10 left-16 w-52 h-52 bg-teal-300/30 rounded-full blur-3xl animate-softPulse"></div>
        <div className="absolute bottom-10 right-24 w-72 h-72 bg-teal-400/30 rounded-full blur-3xl animate-softPulse"></div>

        <div className="relative z-10 flex flex-col items-center justify-center text-gray-800 mt-28 md:mt-32 animate-fadeInUp">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 drop-shadow-sm leading-tight tracking-tight">
            You deserve to be{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-400 to-teal-600">
              happy
            </span>
          </h1>
          <p className="max-w-3xl text-lg md:text-xl text-gray-700 font-medium leading-relaxed mb-10 px-4 md:px-0">
            “Discover a calm, safe space designed for your mental well-being.
            Connect, express, and grow with a community that truly cares —
            because your happiness matters.”
          </p>

          <button
            onClick={() =>
              document
                .getElementById("healsteps")
                .scrollIntoView({ behavior: "smooth" })
            }
            className="relative px-10 py-4 rounded-full font-semibold text-lg text-white bg-linear-to-r from-teal-400 to-teal-600 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10">Get Started</span>
            <span className="absolute inset-0 rounded-full bg-white/10 blur-md opacity-60"></span>
          </button>

          <div className="mt-20 flex flex-col items-center space-y-2 animate-float">
            <Image
              src={ArrowIcon}
              alt="Scroll Arrow"
              width={40}
              height={40}
              className="opacity-80 hover:opacity-100 transition"
            />
            <p className="text-gray-600 text-sm font-medium tracking-wider animate-fadeInUp">
              Scroll Down
            </p>
          </div>
        </div>
      </section>

      {/* Healing Steps Section */}
      <section
        id="healsteps"
        className="relative bg-linear-to-b from-[#F7F0E0] to-[#FFF9F3] py-28 px-6 flex flex-col items-center overflow-hidden"
      >
        {/* Full Spiral Background */}
        {/* Full Spiral Background */}
        <div className="absolute inset-0 flex justify-center items-center opacity-60 pointer-events-none">
          <svg
            className="w-[130%] md:w-full h-[130%] animate-drawSpiral"
            viewBox="0 0 1000 1000"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M500,500 m-400,0 a400,400 0 1,1 800,0 a400,400 0 1,1 -800,0 
         M500,500 m-300,0 a300,300 0 1,1 600,0 a300,300 0 1,1 -600,0 
         M500,500 m-200,0 a200,200 0 1,1 400,0 a200,200 0 1,1 -400,0 
         M500,500 m-100,0 a100,100 0 1,1 200,0 a100,100 0 1,1 -200,0"
              stroke="url(#spiralGradient)"
              strokeWidth="1.2"
              strokeDasharray="2500"
              strokeDashoffset="2500"
            />
            <defs>
              <linearGradient
                id="spiralGradient"
                x1="0"
                y1="0"
                x2="1000"
                y2="1000"
              >
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute top-10 left-10 w-40 h-40 bg-teal-300/20 rounded-full blur-3xl animate-softPulse"></div>
        <div className="absolute bottom-20 right-20 w-56 h-56 bg-amber-200/20 rounded-full blur-3xl animate-softPulse"></div>

        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-16 text-center leading-snug animate-fadeInUp">
          Your Journey to Mental Wellness <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-emerald-400">
            A 6-Step Path to Healing
          </span>
        </h2>

        <div className="grid w-full max-w-6xl gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          <HealingStep
            icon={<MessageSquareHeart size={50} className="text-teal-700" />}
            title="Chat with Our AI"
            desc="Start by talking with our compassionate AI listener. It’s always there to listen, understand, and help you find your calm."
            gradient="from-[#77a8b1] to-[#a3d2ca]"
            art="listen"
            step="01"
            delay="0"
          />
          <HealingStep
            icon={<Users2 size={50} className="text-emerald-600" />}
            title="Join the Community"
            desc="Connect with people who understand. Share stories, read, and heal together."
            gradient="from-[#B0BD9E] to-[#d0e1b9]"
            art="community"
            step="02"
            delay="100"
          />
          <HealingStep
            icon={<HeartHandshake size={50} className="text-pink-600" />}
            title="Connect with Therapists"
            desc="Get personalized guidance from verified professionals to help you move forward."
            gradient="from-[#F4D6BE] to-[#ffe4c9]"
            art="care"
            step="03"
            delay="200"
          />
          <HealingStep
            icon={<NotebookPen size={50} className="text-indigo-600" />}
            title="Encrypted Journaling"
            desc="Write privately in your encrypted diary. It’s safe, secure, and yours only."
            gradient="from-[#d1c4e9] to-[#ede7f6]"
            art="journal"
            step="04"
            delay="300"
          />
          <HealingStep
            icon={<BarChart3 size={50} className="text-orange-500" />}
            title="Mood Tracking"
            desc="Visualize your emotional trends and take charge of your well-being."
            gradient="from-[#FFE5B4] to-[#FFF5E1]"
            art="mood"
            step="05"
            delay="400"
          />
          <HealingStep
            icon={<Sparkles size={50} className="text-teal-500" />}
            title="Personalized Growth"
            desc="Receive AI-curated mindfulness exercises and mental wellness suggestions."
            gradient="from-[#C1E8E3] to-[#E0F7F4]"
            art="growth"
            step="06"
            delay="500"
          />
        </div>

        <div className="mt-20 animate-fadeInUp">
          <button
            onClick={toggleChat}
            className="relative group px-12 py-4 text-lg font-semibold rounded-full overflow-hidden text-white shadow-lg bg-linear-to-r from-teal-400 to-emerald-500 hover:scale-105 transition-transform duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              <MessageSquareHeart size={22} /> Chat with Our AI
            </span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 blur-md transition-all"></div>
          </button>
        </div>
      </section>

      {/* 💬 Floating Chat Widget */}
      <div className="fixed bottom-4 right-4 z-[1000] sm:bottom-6 sm:right-6">
        {!isChatOpen ? (
          <button
            onClick={toggleChat}
            aria-label="Open MindHaven AI companion"
            className="flex size-14 items-center justify-center rounded-full border-4 border-white/75 bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-[0_12px_30px_rgba(27,104,86,0.28)] transition hover:-translate-y-1 hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
          >
            <MessageCircle size={25} />
          </button>
        ) : (
          <div className="relative flex h-[min(78vh,560px)] w-[min(92vw,390px)] flex-col overflow-hidden rounded-[1.65rem] border border-white/80 bg-white shadow-[0_24px_70px_rgba(24,62,54,0.24)] animate-fadeInUp">
            <div className="flex shrink-0 items-center gap-3 border-b border-teal-100/80 bg-gradient-to-r from-[#eef8f3] to-[#fffaf0] px-4 py-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white text-teal-800 shadow-sm">
                <MessageSquareHeart size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">MindHaven companion</span>
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> Here to listen
                </span>
              </span>
              <button
                onClick={toggleChat}
                aria-label="Close MindHaven AI companion"
                className="flex size-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                <XCircle size={20} />
              </button>
            </div>
            <iframe
              src="https://app.gpt-trainer.com/widget/8604f23ef96040eda432f7bd80d49440"
              title="MindHaven AI companion chat"
              className="min-h-0 flex-1 border-0"
              loading="eager"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="clipboard-write"
            />
          </div>
        )}
      </div>

      {/* 🌸 Safe Space Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fffaf4] via-[#f7fbf6] to-[#eaf5ee] py-20 text-center sm:py-24 lg:py-28">
        {/* Floating Orbs for Depth */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl animate-softPulse"></div>
        <div className="absolute bottom-10 right-32 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl animate-softPulse"></div>

        {/* Text Content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl border border-teal-100 bg-white/80 text-teal-700 shadow-sm">
            <Heart size={19} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">A softer place to land</p>
          <h2 className="mt-3 mb-5 font-[Playfair_Display] text-4xl font-bold leading-tight text-[#233f37] sm:text-5xl">
            Your safe space{" "}
            <span className="text-teal-700">awaits.</span>
          </h2>

          <p className="mx-auto mb-10 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            MindHaven is a gentle place for your thoughts. Whether you’re struggling, growing, or simply reflecting, you can find tools and connection at your own pace.
          </p>
        </div>

        {/* Illustration (Yoga Girl + Icons + Plants) */}
        <div className="relative flex justify-center z-10">
          <div className="absolute -inset-6 rounded-full bg-teal-200/40 blur-3xl animate-softPulse"></div>
          <Image
            src={Copy}
            alt="Meditation and Peaceful Space Illustration"
            width={1100}
            height={600}
            className="relative z-10 mx-auto h-auto max-h-[34rem] w-[min(92%,68rem)] rounded-[2rem] border border-white/70 object-contain shadow-[0_22px_60px_rgba(47,76,62,0.12)]"
          />
        </div>

        {/* Decorative Glow Line */}
        <div className="mx-auto mt-14 h-px w-[min(70%,34rem)] bg-gradient-to-r from-transparent via-teal-400 to-transparent sm:mt-20"></div>
      </section>

      {/* 🌿 The MindHaven Experience Section */}
      <section className="relative py-28 bg-linear-to-b from-[#E8F9F0] to-[#F7FDF9] px-8 overflow-hidden">
        {/* Decorative Orbs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl animate-softPulse"></div>
        <div className="absolute bottom-10 right-20 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl animate-softPulse"></div>

        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Small steps, real support</p>
          <h2 className="mb-5 mt-3 font-[Playfair_Display] text-4xl font-bold leading-tight text-[#233f37] sm:text-5xl">
            The <span className="text-teal-700">MindHaven</span> experience
          </h2>

          <p className="mx-auto mb-16 max-w-3xl text-base leading-7 text-slate-600 sm:mb-20 sm:text-lg sm:leading-8">
            A journey from stress to serenity, from isolation to connection, and from uncertainty toward a little more inner peace.
          </p>

          {/* Timeline */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-16">
            {/* Before MindHaven */}
            <div className="relative bg-white/80 rounded-3xl shadow-xl p-8 max-w-sm transition-all hover:-translate-y-2 hover:shadow-2xl backdrop-blur-md">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-rose-200 text-rose-700 font-bold rounded-full px-4 py-1 shadow-md">
                Before
              </div>
              <Image
                src={B4MH}
                alt="Before MindHaven"
                width={350}
                height={350}
                className="rounded-2xl mx-auto mb-6"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Feeling Lost & Overwhelmed
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Anxiety, stress, and endless thoughts can make life feel like a
                constant storm. You don’t have to face it alone.
              </p>
            </div>

            {/* Transition Line */}
            <div className="hidden md:block w-16 h-1 bg-linear-to-r from-rose-300 via-gray-300 to-emerald-300 rounded-full animate-pulse"></div>

            {/* After MindHaven */}
            <div className="relative bg-white/90 rounded-3xl shadow-xl p-8 max-w-sm transition-all hover:-translate-y-2 hover:shadow-2xl backdrop-blur-md">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-emerald-200 text-emerald-700 font-bold rounded-full px-4 py-1 shadow-md">
                After
              </div>
              <Image
                src={AMH}
                alt="After MindHaven"
                width={350}
                height={350}
                className="rounded-2xl mx-auto mb-6"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Calm, Confident & Connected
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                With mindful tools, therapy access, and a caring community,
                MindHaven helps you rediscover balance and joy every day.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-16 sm:mt-20">
            <Link href="/login" className="group inline-flex items-center gap-2 rounded-full bg-[#267b69] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(38,123,105,0.2)] transition hover:-translate-y-0.5 hover:bg-[#1d6b5b] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 sm:px-10 sm:py-4 sm:text-base">
              Begin your journey <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* 🌿 Reviews Section */}
      <section
        id="reviews"
        className="relative overflow-hidden bg-gradient-to-b from-[#f2f8f3] via-[#f8faf7] to-[#fffaf3] px-6 py-20 text-center"
      >
        <div className="relative z-10 mb-16">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl border border-teal-100 bg-white/80 text-teal-700 shadow-sm">
            <HeartHandshake size={20} />
          </div>
          <h2 className="mb-3 text-3xl font-bold text-slate-800 md:text-4xl">
            What Our{" "}
            <span className="text-teal-700">
              Users Say
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Real stories of healing, growth, and transformation from our
            MindHaven community.
          </p>
        </div>

        <div className="relative z-10 mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "Emma I.",
              text: "MindHaven changed my perspective on therapy. The AI support helped me take the first step without fear.",
              img: Review1,
            },
            {
              name: "Jason K.",
              text: "I’ve found my people here. The community is supportive, empathetic, and genuinely kind.",
              img: Review2,
            },
            {
              name: "Aisha R.",
              text: "Journaling securely and tracking my mood has helped me see my growth every week. So grateful!",
              img: Review3,
            },
          ].map((review, i) => (
            <div
              key={i}
              className="group rounded-[1.6rem] border border-[#e6ede7] bg-white/85 p-6 text-left shadow-[0_8px_24px_rgba(47,76,62,0.05)] transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_14px_32px_rgba(47,76,62,0.09)]"
            >
              <div className="flex h-full flex-col">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#eff7f1] text-teal-700" aria-hidden="true">
                  <MessageSquareHeart size={17} />
                </span>
                <p className="mt-4 flex-1 text-sm leading-7 text-slate-700">
                  “{review.text}”
                </p>
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  {review.img ? (
                  <Image
                    src={review.img}
                    alt={review.name || "MindHaven user"}
                    width={44}
                    height={44}
                    className="size-11 rounded-full border-2 border-[#dceee2] object-cover"
                    unoptimized
                  />
                ) : (
                    <div className="flex size-11 items-center justify-center rounded-full bg-[#e5f2e8] font-bold text-teal-800">
                      MH
                    </div>
                )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {review.name || "MindHaven User"}
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500">MindHaven community</p>
                  </div>
                  <Heart size={15} className="ml-auto text-rose-300 transition group-hover:scale-110 group-hover:text-rose-400" aria-hidden="true" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
          <span className="h-px w-8 bg-teal-200" />
          A little kindness goes a long way
          <span className="h-px w-8 bg-teal-200" />
        </div>
      </section>

      {/* ❓ FAQ Section */}
      <section
        id="faq"
        className="relative flex flex-col items-center overflow-hidden bg-gradient-to-b from-[#f3f8f2] via-[#fbfaf6] to-[#f8f0e5] px-6 py-20 text-center sm:px-8 sm:py-24"
      >
        <div className="pointer-events-none absolute -right-24 top-16 size-72 rounded-full bg-teal-100/50 blur-3xl" aria-hidden="true" />

        {/* Heading */}
        <div className="relative z-10 mb-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">A few helpful answers</p>
          <h2 className="mb-4 font-[Playfair_Display] text-3xl font-bold text-slate-800 sm:text-4xl md:text-5xl">
            Frequently{" "}
            <span className="text-teal-700">
              Asked Questions
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Have questions about how MindHaven works? We’ve got you covered.
          </p>
        </div>

        {/* FAQ Cards */}
        <div className="relative z-10 w-full max-w-3xl space-y-3">
          {[
            {
              q: "Is my data private and secure?",
              a: "Absolutely. We use AES-256 encryption and hashing to ensure your thoughts and records stay only yours.",
            },
            {
              q: "Can I connect with real therapists?",
              a: "Yes. MindHaven partners with certified professionals available for online and in-person sessions.",
            },
            {
              q: "How does the AI mood tracker work?",
              a: "It uses behavioral patterns and journaling data to help visualize your emotional growth over time.",
            },
            {
              q: "Is the community anonymous?",
              a: "Yes. You can share, chat, and connect anonymously with complete safety.",
            },
            {
              q: "Do I have to pay for every feature?",
              a: "Core tools like journaling, community, and AI chat are free. Therapy sessions may have additional costs.",
            },
          ].map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#e7eee7] bg-white/85 px-4 shadow-[0_6px_20px_rgba(46,83,66,0.05)] transition-colors hover:border-teal-200 hover:bg-white sm:px-6"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <button
                type="button"
                onClick={() => toggleAnswer(i)}
                aria-expanded={activeQuestion === i}
                aria-controls={`faq-answer-${i}`}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:py-5 sm:text-base"
              >
                {faq.q}
                <span
                  className={`shrink-0 text-xl font-normal text-teal-700 transition-transform ${activeQuestion === i ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  ⌄
                </span>
              </button>
              <p
                id={`faq-answer-${i}`}
                aria-hidden={activeQuestion !== i}
                className={`overflow-hidden text-left text-sm leading-6 text-slate-600 transition-all duration-300 ${activeQuestion === i ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"}`}
              >
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        {/* Decorative Bottom Glow */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-linear-to-t from-emerald-100/40 via-transparent to-transparent blur-2xl"></div>
      </section>
    </div>
  );
}

/* Subcomponent */
function HealingStep({ icon, title, desc, gradient, art, step, delay }) {
  return (
    <div
      className={`group relative flex min-h-72 flex-col items-center overflow-hidden rounded-[1.8rem] border border-white/65 bg-gradient-to-br ${gradient} px-6 pb-7 pt-5 text-center text-slate-800 shadow-[0_12px_30px_rgba(48,72,61,0.09)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(48,72,61,0.14)]`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full border border-white/35 transition-transform duration-500 group-hover:scale-110" aria-hidden="true" />
      <div className="relative flex w-full items-center justify-between">
        <span className="rounded-full border border-white/55 bg-white/40 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-slate-700/80">
          STEP {step}
        </span>
        <StepDoodle type={art} />
      </div>
      <div className="relative mt-3 flex size-[4.25rem] items-center justify-center rounded-[1.35rem] border border-white/70 bg-white/65 text-teal-800 shadow-sm transition duration-300 group-hover:-rotate-3 group-hover:scale-105">
        {icon}
      </div>
      <h3 className="relative mt-4 text-xl font-bold sm:text-[1.35rem]">{title}</h3>
      <p className="relative mt-2 max-w-sm text-sm font-medium leading-6 text-slate-700/90">{desc}</p>
    </div>
  );
}

function StepDoodle({ type }) {
  const drawings = {
    listen: (
      <>
        <path d="M5 10c0-4 3-7 7-7h9c4 0 7 3 7 7s-3 7-7 7h-5l-5 4v-5c-4-1-6-3-6-6Z" fill="#fffdf8" stroke="#548d84" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M15.5 13s-4-2.5-4-5a2.1 2.1 0 0 1 4-1 2.1 2.1 0 0 1 4 1c0 2.5-4 5-4 5Z" fill="#f3a5a0" stroke="#d87978" strokeWidth="1" />
      </>
    ),
    community: (
      <>
        <circle cx="11" cy="8" r="3.5" fill="#f8d48c" stroke="#8c9f69" strokeWidth="1.5" />
        <circle cx="22" cy="9" r="3" fill="#f0aaa0" stroke="#8c9f69" strokeWidth="1.5" />
        <path d="M4.5 22c.5-5 2.5-7.5 6.5-7.5s6 2.5 6.5 7.5m.5-6.5c4.5-.8 7.2 1.4 7.8 6.5" fill="#fffdf8" stroke="#6b9476" strokeWidth="1.7" strokeLinecap="round" />
      </>
    ),
    care: (
      <>
        <path d="M16 5v17m0-10c-6-6-10-2-9 2 3 3 7 2 9-2Zm0-3c5-5 9-2 8 2-3 2-6 2-8-2Z" fill="#a5c89c" stroke="#688d6b" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 5c0-2 2-3.5 4-3.5S20 3 20 5c0 2.5-4 4.5-4 4.5S12 7.5 12 5Z" fill="#eea3a0" />
      </>
    ),
    journal: (
      <>
        <rect x="7" y="4" width="17" height="21" rx="3" fill="#fffdf8" stroke="#8274ad" strokeWidth="1.7" />
        <path d="M11 10h8m-8 4h8m-8 4h5" stroke="#b09ccf" strokeWidth="1.7" strokeLinecap="round" />
        <path d="m20 6 3-3 3 3-3 3" fill="#f3c878" stroke="#c89b56" strokeWidth="1.2" strokeLinejoin="round" />
      </>
    ),
    mood: (
      <>
        <path d="M6 22V12m7 10V7m7 15V10m5 12V4" stroke="#c17d47" strokeWidth="3" strokeLinecap="round" />
        <path d="M5 5c3-2 5-2 8 0m8 2c2-1 4-1 6 0" fill="none" stroke="#edb65e" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
    growth: (
      <>
        <path d="M16 23V11m0 7c-8-8-13-3-11 2 4 4 8 3 11-2Zm0-5c7-8 12-4 10 1-3 3-7 3-10-1Z" fill="#91bd8e" stroke="#59896b" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="m7 5 1.3 2.7L11 9l-2.7 1.3L7 13l-1.3-2.7L3 9l2.7-1.3L7 5Z" fill="#fff5cf" stroke="#d5aa5e" strokeWidth="1" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 32 28" className="size-8 opacity-75 transition duration-300 group-hover:rotate-3 group-hover:opacity-100" fill="none" aria-hidden="true">
      {drawings[type]}
    </svg>
  );
}
