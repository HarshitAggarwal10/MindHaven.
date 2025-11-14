"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  MessageSquareHeart,
  Users2,
  HeartHandshake,
  NotebookPen,
  BarChart3,
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
    setActiveQuestion(activeQuestion === i ? null : i);
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

        <div className="grid md:grid-cols-3 gap-10 max-w-6xl z-10">
          <HealingStep
            icon={<MessageSquareHeart size={50} className="text-teal-700" />}
            title="Chat with Our AI"
            desc="Start by talking with our compassionate AI listener. It’s always there to listen, understand, and help you find your calm."
            gradient="from-[#77a8b1] to-[#a3d2ca]"
            delay="0"
          />
          <HealingStep
            icon={<Users2 size={50} className="text-emerald-600" />}
            title="Join the Community"
            desc="Connect with people who understand. Share stories, read, and heal together."
            gradient="from-[#B0BD9E] to-[#d0e1b9]"
            delay="100"
          />
          <HealingStep
            icon={<HeartHandshake size={50} className="text-pink-600" />}
            title="Connect with Therapists"
            desc="Get personalized guidance from verified professionals to help you move forward."
            gradient="from-[#F4D6BE] to-[#ffe4c9]"
            delay="200"
          />
          <HealingStep
            icon={<NotebookPen size={50} className="text-indigo-600" />}
            title="Encrypted Journaling"
            desc="Write privately in your encrypted diary. It’s safe, secure, and yours only."
            gradient="from-[#d1c4e9] to-[#ede7f6]"
            delay="300"
          />
          <HealingStep
            icon={<BarChart3 size={50} className="text-orange-500" />}
            title="Mood Tracking"
            desc="Visualize your emotional trends and take charge of your well-being."
            gradient="from-[#FFE5B4] to-[#FFF5E1]"
            delay="400"
          />
          <HealingStep
            icon={<Sparkles size={50} className="text-teal-500" />}
            title="Personalized Growth"
            desc="Receive AI-curated mindfulness exercises and mental wellness suggestions."
            gradient="from-[#C1E8E3] to-[#E0F7F4]"
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
      <div className="fixed bottom-6 right-6 z-1000">
        {!isChatOpen ? (
          <button
            onClick={toggleChat}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-linear-to-r from-teal-500 to-emerald-500 text-white shadow-lg hover:shadow-2xl transition-all"
          >
            <MessageCircle size={28} />
          </button>
        ) : (
          <div className="relative w-[380px] h-[480px] bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200 animate-fadeInUp">
            <div className="absolute top-2 right-2">
              <button
                onClick={toggleChat}
                className="text-gray-500 hover:text-teal-600 transition"
              >
                <XCircle size={24} />
              </button>
            </div>
            <iframe
              src="https://app.gpt-trainer.com/widget/8604f23ef96040eda432f7bd80d49440"
              width="100%"
              height="100%"
              className="rounded-3xl"
            />
          </div>
        )}
      </div>

      {/* 🌸 Safe Space Section */}
      <section className="relative py-28 bg-linear-to-b from-[#FFF9F3] to-[#E8F9F0] text-center overflow-hidden">
        {/* Floating Orbs for Depth */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl animate-softPulse"></div>
        <div className="absolute bottom-10 right-32 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl animate-softPulse"></div>

        {/* Text Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-5xl font-extrabold text-gray-800 mb-8 leading-snug">
            Your{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-400 to-emerald-500">
              Safe Space
            </span>{" "}
            Awaits
          </h2>

          <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-16">
            MindHaven isn’t just an app — it’s a sanctuary for your thoughts.
            Whether you’re struggling, growing, or reflecting, you’ll always
            find empathy, understanding, and peace here.
          </p>
        </div>

        {/* Illustration (Yoga Girl + Icons + Plants) */}
        <div className="relative flex justify-center z-10">
          <div className="absolute -inset-6 bg-teal-200/40 blur-3xl rounded-full animate-softPulse"></div>
          <Image
            src={Copy}
            alt="Meditation and Peaceful Space Illustration"
            width={"100%"}
            height={600}
            className="rounded-3xl shadow-2xl object-contain border border-white/40"
          />
        </div>

        {/* Decorative Glow Line */}
        <div className="mt-24 h-1 w-1/2 mx-auto bg-linear-to-r from-teal-400 to-emerald-400 rounded-full animate-pulse"></div>
      </section>

      {/* 🌿 The MindHaven Experience Section */}
      <section className="relative py-28 bg-linear-to-b from-[#E8F9F0] to-[#F7FDF9] px-8 overflow-hidden">
        {/* Decorative Orbs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl animate-softPulse"></div>
        <div className="absolute bottom-10 right-20 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl animate-softPulse"></div>

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <h2 className="text-5xl font-extrabold text-gray-800 mb-8">
            The{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-emerald-400">
              MindHaven
            </span>{" "}
            Experience
          </h2>

          <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-20">
            MindHaven is more than therapy — it’s a journey from stress to
            serenity, from isolation to connection, and from uncertainty to
            inner peace.
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
          <div className="mt-20">
            <button className="relative group px-12 py-4 text-lg font-semibold rounded-full overflow-hidden text-white shadow-lg bg-linear-to-r from-teal-400 to-emerald-500 hover:scale-105 transition-transform duration-300">
              <span className="relative z-10">Begin Your Journey</span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 blur-md transition-all"></div>
            </button>
          </div>
        </div>
      </section>

      {/* 🌿 Reviews Section */}
      <section id="reviews" className="relative bg-linear-to-b from-[#E8F9F0] via-[#F9F9FF] to-[#FFF9F3] py-24 px-6 text-center overflow-hidden">
        {/* Floating glow orbs */}
        <div className="absolute top-10 left-10 w-60 h-60 bg-teal-200/30 rounded-full blur-3xl animate-softPulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl animate-softPulse"></div>

        {/* Header */}
        <div className="relative z-10 mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">
            What Our{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-emerald-400">
              Users Say
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Real stories of healing, growth, and transformation from our
            MindHaven community.
          </p>
        </div>

        {/* Review Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto relative z-10">
          {[
            {
              name: "Emma I.",
              text: "MindHaven changed my perspective on therapy. The AI support helped me take the first step without fear.",
              img:  Review1 ,
            },
            {
              name: "Jason K.",
              text: "I’ve found my people here. The community is supportive, empathetic, and genuinely kind.",
              img:  Review2 ,
            },
            {
              name: "Aisha R.",
              text: "Journaling securely and tracking my mood has helped me see my growth every week. So grateful!",
              img:  Review3 ,
            },
          ].map((review, i) => (
            <div
              key={i}
              className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-transform transform hover:-translate-y-2 animate-fadeInUp"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flex flex-col items-center text-center">
                {review.img ? (
                  <Image
                    src={review.img}
                    alt={review.name || "MindHaven user"}
                    width={100}
                    height={100}
                    className="rounded-full mx-auto border-4 border-teal-200"
                    unoptimized
                  />
                ) : (
                  <div className="w-[100px] h-[100px] rounded-full bg-linear-to-r from-teal-200 to-emerald-200 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                    MH
                  </div>
                )}

                <h4 className="text-xl font-semibold text-gray-800 mb-2 mt-4">
                  {review.name || "MindHaven User"}
                </h4>
                <p className="text-gray-600 italic text-sm">{review.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Decorative Divider Line */}
        <div className="mt-20 h-1 w-1/3 mx-auto bg-linear-to-r from-teal-400 to-emerald-400 rounded-full animate-pulse"></div>
      </section>

      {/* ❓ FAQ Section */}
      <section id="faq" className="relative py-24 bg-linear-to-t from-[#FFF9F3] via-[#F8FAFC] to-[#E8F9F0] px-8 flex flex-col items-center text-center">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-transparent via-white/40 to-white/60 backdrop-blur-sm z-0"></div>

        {/* Heading */}
        <div className="relative z-10 mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6">
            Frequently{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-emerald-400">
              Asked Questions
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Have questions about how MindHaven works? We’ve got you covered.
          </p>
        </div>

        {/* FAQ Cards */}
        <div className="relative z-10 max-w-3xl w-full space-y-6">
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
              className="group bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 animate-fadeInUp"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <h5 className="flex justify-between items-center text-left text-lg font-semibold text-gray-800">
                {faq.q}
                <span className="text-teal-500 transition-transform group-hover:rotate-180">
                  ⌄
                </span>
              </h5>
              <p className="text-gray-600 text-sm mt-3 opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-40 transition-all duration-500 ease-in-out text-left">
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
function HealingStep({ icon, title, desc, gradient, delay }) {
  return (
    <div
      className={`relative flex flex-col items-center text-center max-w-sm bg-linear-to-br ${gradient} text-gray-800 rounded-3xl shadow-xl p-8 transition-transform duration-500 hover:-translate-y-2 hover:shadow-2xl animate-fadeInUp`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-gray-700 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
