"use client";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Shield,
  Brain,
  Users,
  Linkedin,
  Instagram,
  Mail,
  Sparkles,
} from "lucide-react";
import Harshit from "../../public/landingpage/myimg.jpeg";
import About from "../../public/landingpage/about.png";
import Story from "../../public/landingpage/story.png";

export default function AboutPage() {
  return (
    <div className="bg-linear-to-br from-[#F9FFFB] via-[#FFF8F1] to-[#E8F9FF] min-h-screen font-[Outfit] text-gray-800 relative overflow-hidden">
      {/* 🌈 Floating Gradient Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-teal-300/30 blur-3xl rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-200/30 blur-3xl rounded-full animate-pulse-slower"></div>
      <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-amber-100/30 blur-2xl rounded-full animate-softPulse"></div>

      {/* 🧠 Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-center gap-12 px-8 md:px-16 py-28 mt-16 relative z-10">
        <div className="flex-1 space-y-6 animate-fadeInUp">
          <h1 className="text-5xl md:text-6xl font-[Playfair_Display] font-extrabold leading-tight text-gray-800">
            A Place Where <br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-teal-500 to-emerald-400">
              Healing Meets Technology
            </span>
          </h1>
          <p className="text-gray-700 text-lg leading-relaxed max-w-xl font-[Outfit]">
            MindHaven is your serene digital retreat for emotional wellness —
            blending compassion, community, and cutting-edge AI to create a
            comforting experience that helps you heal, reflect, and grow.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-linear-to-r from-teal-400 to-emerald-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 hover:brightness-110 transition-all duration-300"
          >
            <Sparkles size={20} className="animate-spin-slow" /> Get Started
          </Link>
        </div>

        {/* Hero Image */}
        <div className="flex-1 flex justify-center relative">
          <div className="absolute -inset-6 bg-linear-to-r from-teal-100 to-emerald-100 blur-3xl rounded-full opacity-50"></div>
          <Image
            src={About}
            alt="Mindfulness and healing concept"
            width={480}
            height={480}
            className="rounded-4xl shadow-2xl object-cover border border-white/60 relative z-10 hover:scale-105 transition-transform duration-700"
          />
        </div>
      </section>

      {/* 🌸 Creative Story Section */}
      <section className="relative py-36 px-6 md:px-20 bg-linear-to-b from-[#E9FDF4] via-[#F8FFFB] to-[#FFF9F4] overflow-hidden">
        {/* Floating glows */}
        <div className="absolute top-16 left-24 w-60 h-60 bg-emerald-100/40 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-32 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl animate-pulse-slower"></div>

        {/* Curved top divider */}
        <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-transparent to-white rounded-b-[50%]"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10 space-y-10">
          <h2 className="text-5xl md:text-6xl font-[Playfair_Display] font-extrabold text-gray-800">
            Our{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-500 to-teal-400">
              Story
            </span>
          </h2>

          <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-700 leading-relaxed font-[Outfit]">
            What started as a small spark of compassion has blossomed into a
            mindful movement — where <strong>technology listens</strong>,
            <strong> empathy guides</strong>, and <strong>healing feels human</strong>.
          </p>

          {/* 🌼 Floating Glass Story Card */}
          <div className="relative mt-16 flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 relative">
              <div className="absolute -inset-6 bg-linear-to-tr from-teal-100 to-emerald-100 blur-3xl rounded-3xl opacity-70"></div>
              <Image
                src={Story}
                alt="Our journey illustration"
                width={500}
                height={500}
                className="rounded-4xl shadow-2xl object-cover relative z-10 border border-white/60 hover:scale-[1.03] transition-transform duration-700"
              />
            </div>

            {/* ✨ Floating Glass Text Box */}
            <div className="flex-1 backdrop-blur-xl bg-white/70 border border-teal-100 shadow-2xl rounded-3xl p-10 space-y-6 hover:shadow-emerald-100/40 transition-all duration-500">
              <p className="text-lg md:text-xl text-gray-700 font-[Outfit] leading-relaxed">
                MindHaven was born from a simple belief — that mental wellness
                shouldn’t feel clinical. It should feel <em>warm</em>,
                <em>personal</em>, and <em>alive</em>.  
              </p>

              <blockquote className="italic text-2xl text-teal-600 font-[Playfair_Display] leading-relaxed">
                “Technology can heal when guided by empathy.”
              </blockquote>

              <p className="text-lg md:text-xl text-gray-700 font-[Outfit]">
                We don’t just build tools — we craft calm. Our goal is to be the
                space you turn to when you need to breathe, reflect, and find
                peace.
              </p>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-linear-to-r from-emerald-400 to-teal-500 text-white px-8 py-3 rounded-full font-semibold shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Sparkles size={18} className="animate-pulse" /> Join the Journey
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 🌿 Our Core Values Section */} 
      <section className="relative py-32 px-8 md:px-16 bg-linear-to-br from-[#E8F9FF] via-[#F8FFFB] to-[#FFF8F1] text-center overflow-hidden">
        {/* Animated floating glows */}
        <div className="absolute top-20 left-1/3 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-16 right-1/4 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl animate-pulse-slower"></div>

        <h2 className="text-5xl md:text-6xl font-[Playfair_Display] font-extrabold text-gray-800 mb-20 relative z-10">
          Our{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-emerald-400">
            Core Values
          </span>
        </h2>

        <div className="flex flex-wrap justify-center gap-14 max-w-6xl mx-auto relative z-10">
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
              className="group relative w-60 h-60 bg-linear-to-br hover:shadow-2xl transition-all duration-700 rounded-full p-0.5 hover:scale-110"
              style={{
                backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
              }}
            >
              {/* 3D Card Glow Layer */}
              <div
                className={`absolute inset-0 rounded-full bg-linear-to-br ${value.color} blur-xl opacity-70 group-hover:opacity-90 transition-all`}
              ></div>

              {/* Card Inner */}
              <div className="absolute inset-0.5 rounded-full bg-white/90 backdrop-blur-md flex flex-col items-center justify-center text-center shadow-lg transition-all duration-500 group-hover:-translate-y-2 group-hover:rotate-[4deg]">
                <div className="mb-3 transform group-hover:scale-110 transition-transform">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {value.title}
                </h3>
                <p className="text-sm text-gray-600 px-5 mt-2 leading-snug">
                  {value.desc}
                </p>

                {/* Ambient Light Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-linear-to-r from-white/50 to-transparent rounded-full blur-lg opacity-70 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating background icons for depth */}
        <div className="absolute inset-0 opacity-10">
          <Heart className="absolute top-10 left-10 w-20 h-20 text-pink-400 animate-float-slow" />
          <Shield className="absolute bottom-20 right-20 w-16 h-16 text-teal-400 animate-float-slower" />
          <Brain className="absolute top-1/2 right-10 w-14 h-14 text-indigo-300 animate-float-slow" />
        </div>
      </section>
      {/* 👨‍💻 Founder Section */}{" "}
      <section className="py-32 px-8 md:px-16 bg-linear-to-br from-[#F8FFFB] to-[#E8F9FF] text-center relative">
        {" "}
        <h2 className="text-4xl md:text-5xl font-[Playfair_Display] font-extrabold text-gray-800 mb-6">
          {" "}
          Meet the <span className="text-teal-500 italic">Founder</span>{" "}
        </h2>{" "}
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-12 mt-12 bg-white/70 p-10 rounded-3xl shadow-2xl backdrop-blur-md border border-white/50">
          {" "}
          <Image
            src={Harshit}
            alt="Harshit Aggarwal"
            width={380}
            height={380}
            className="rounded-3xl object-cover shadow-xl border-4 border-teal-200 hover:scale-105 transition-transform duration-500"
          />{" "}
          <div className="text-left space-y-5">
            {" "}
            <h3 className="text-3xl font-bold text-gray-900 font-[Playfair_Display]">
              {" "}
              Harshit Aggarwal{" "}
            </h3>{" "}
            <p className="text-gray-700 text-lg leading-relaxed">
              {" "}
              The visionary behind <strong>MindHaven</strong>, Harshit is
              committed to fusing technology and empathy to make emotional care
              accessible for all. His mission is to empower people to heal
              freely and live mindfully.{" "}
            </p>{" "}
            <blockquote className="border-l-4 border-teal-400 pl-4 italic text-gray-700 text-lg">
              {" "}
              “Healing doesn’t need to be clinical — it needs to be kind.”{" "}
            </blockquote>{" "}
            {/* 🌐 Social Links */}{" "}
            <div className="flex space-x-6 mt-6">
              {" "}
              <Link
                href="mailto:harshitagg2003@gmail.com"
                target="_blank"
                className="text-teal-600 hover:text-emerald-500 transition"
              >
                {" "}
                <Mail size={26} />{" "}
              </Link>{" "}
              <Link
                href="https://linkedin.com/in/harshit-aggarwal-8727b4227"
                target="_blank"
                className="text-teal-600 hover:text-emerald-500 transition"
              >
                {" "}
                <Linkedin size={26} />{" "}
              </Link>{" "}
              <Link
                href="https://instagram.com/harshit_agg_"
                target="_blank"
                className="text-teal-600 hover:text-emerald-500 transition"
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
