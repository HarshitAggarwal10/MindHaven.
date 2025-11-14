"use client";
import Image from "next/image";
import { Mail, Phone, MapPin, Instagram, Linkedin, Send } from "lucide-react";
import Link from "next/link";
import ContactImg from "../../public/landingpage/copy1.png";

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-linear-to-br from-[#E8FDF6] via-[#FFF9F4] to-[#E6F3FF] text-gray-800 font-[Poppins] overflow-hidden">

      {/* 🌈 Floating Gradient Orbs */}
      <div className="absolute top-20 left-10 w-60 h-60 bg-emerald-200/40 blur-3xl rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-300/30 blur-3xl rounded-full animate-pulse-slower"></div>

      {/* 🌿 Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between px-10 md:px-20 py-28 gap-14 relative z-10">
        {/* Left Section */}
        <div className="flex-1 space-y-8 animate-fadeInUp">
          <h1 className="text-5xl md:text-6xl font-[Playfair_Display] font-extrabold leading-tight text-gray-900">
            Let’s <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-emerald-400">Connect</span> 🌿
          </h1>
          <p className="text-gray-700 text-lg max-w-xl leading-relaxed">
            Whether you have a question, feedback, or just want to say hello — 
            we’d love to hear from you. Your thoughts matter, and we’re here to help.
          </p>

          {/* Contact Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Mail className="text-teal-600 w-6 h-6" />
              <a href="mailto:harshitaggarwal100306@gmail.com" className="text-gray-700 hover:text-teal-600 transition">
                harshitaggarwal100306@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="text-teal-600 w-6 h-6" />
              <span>+91 80592 41824</span>
            </div>
            <div className="flex items-center gap-4">
              <MapPin className="text-teal-600 w-6 h-6" />
              <span>Haryana, India</span>
            </div>

            {/* Socials */}
            <div className="flex gap-6 mt-6">
              <Link href="https://instagram.com/harshit_agg_" target="_blank" className="text-teal-600 hover:text-emerald-500 transition transform hover:scale-110">
                <Instagram size={26} />
              </Link>
              <Link href="https://linkedin.com/in/harshit-aggarwal-8727b4227" target="_blank" className="text-teal-600 hover:text-emerald-500 transition transform hover:scale-110">
                <Linkedin size={26} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="flex-1 flex justify-center relative">
          <div className="absolute -inset-6 bg-linear-to-tr from-teal-100 via-white to-emerald-100 blur-3xl rounded-full opacity-50"></div>
          <Image
            src={ContactImg}
            alt="MindHaven Contact"
            width={500}
            height={500}
            className="rounded-3xl hover:scale-105 transition-transform duration-700 relative z-10"
          />
        </div>
      </section>

      {/* 💌 Contact Form Section */}
      <section className="relative bg-white/70 backdrop-blur-md py-24 px-8 md:px-16 rounded-t-3xl shadow-inner z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-[Playfair_Display] font-bold text-gray-900">
            Send Us a <span className="text-teal-500 italic">Message</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            We’ll get back to you as soon as possible — because your peace of mind matters.
          </p>

          <form className="space-y-6 text-left mt-10">
            <div className="grid sm:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full bg-white/90 border border-teal-100 rounded-xl px-5 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full bg-white/90 border border-teal-100 rounded-xl px-5 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
              />
            </div>

            <textarea
              placeholder="Your Message..."
              rows="5"
              className="w-full bg-white/90 border border-teal-100 rounded-xl px-5 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 transition resize-none"
            ></textarea>

            <div className="text-center">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-linear-to-r from-teal-400 to-emerald-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Send size={18} /> Send Message
              </button>
            </div>
          </form>
        </div>

        {/* Decorative Glow */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-linear-to-t from-emerald-100/50 to-transparent blur-2xl"></div>
      </section>
    </div>
  );
}
