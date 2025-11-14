"use client";
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-linear-to-t from-[#F7FDF9] via-[#FFF8EF] to-[#FAFDFB] text-gray-700 px-8 md:px-20 py-20 overflow-hidden">
      {/* 🌸 Soft Floating Orbs for Serenity */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-teal-200/30 rounded-full blur-3xl animate-softPulse"></div>
      <div className="absolute bottom-10 right-10 w-60 h-60 bg-emerald-200/30 rounded-full blur-3xl animate-softPulse"></div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12">
        {/* MindHaven Brand Column */}
        <div>
          <h3 className="text-2xl font-extrabold text-teal-600 mb-4">
            MindHaven
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-5">
            Your safe space for emotional healing and personal growth. Find
            comfort, connection, and calm — all in one mindful place.
          </p>
          <Link
            href="/about_us"
            className="text-teal-500 hover:text-emerald-600 text-sm font-medium transition-colors"
          >
            Learn more about us →
          </Link>
        </div>

        {/* Explore */}
        <FooterColumn
          title="Explore"
          items={[
            "About MindHaven",
            "Community Support",
            "Mindfulness Tools",
            "Therapist Sessions",
          ]}
        />

        {/* Resources */}
        <FooterColumn
          title="Resources"
          items={[
            "Mental Health Articles",
            "Self-Care Guides",
            "Anxiety & Stress Tips",
            "Personal Growth Plans",
          ]}
        />

        {/* Support */}
        <FooterColumn
          title="Support"
          items={["FAQs", "Contact Us", "Privacy Policy", "Terms & Conditions"]}
        />

        {/* Newsletter */}
        <div className="flex flex-col items-start md:items-center">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Stay Mindful</h3>
          <p className="text-gray-600 mb-5 text-sm leading-relaxed max-w-xs md:max-w-sm text-center md:text-left">
            Join our mindful circle to receive calming reflections, self-growth
            reminders, and wellness updates every week.
          </p>

          {/* 💌 Newsletter Subscribe Box */}
          <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-teal-200 transition-all duration-300 px-4 py-2 mb-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-2 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-700 rounded-full"
            />
          </div>

          {/* Subscribe Button */}
          <button className="relative flex items-center justify-center gap-2 bg-linear-to-r from-teal-400 to-emerald-500 text-white px-8 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
            <Send
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
            <span className="text-sm font-semibold">Subscribe</span>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-12"></div>

      {/* Footer Bottom */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center text-sm">
        <p className="text-gray-500">
          © 2024 <span className="font-semibold text-teal-500">MindHaven</span>.
          Nurturing mental well-being with compassion and connection.
        </p>

        <div className="flex space-x-6 mt-4 md:mt-0">
          <SocialLink
            icon={<Facebook size={20} />}
            href="https://facebook.com/"
          />
          <SocialLink
            icon={<Instagram size={20} />}
            href="https://instagram.com/"
          />
          <SocialLink
            icon={<Linkedin size={20} />}
            href="https://linkedin.com/"
          />
        </div>
      </div>
    </footer>
  );
}

/* --- Footer Column Component --- */
function FooterColumn({ title, items }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-gray-600 hover:text-teal-600 transition-colors duration-200 cursor-pointer text-sm flex items-center space-x-2 group"
          >
            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full group-hover:scale-125 transition-transform"></span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --- Social Icons Component --- */
function SocialLink({ icon, href }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="text-gray-500 hover:text-teal-500 transition transform hover:scale-110"
    >
      {icon}
    </Link>
  );
}
