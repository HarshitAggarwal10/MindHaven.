"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar({ scrollToFAQ, scrollToREV }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hovered, setHovered] = useState(null);

  const smoothScrollTo = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNavigation = (section) => {
    if (pathname !== "/") {
      // Navigate to home page first
      router.push(`/#${section}`);

      // Wait for the route to load, then scroll smoothly
      setTimeout(() => smoothScrollTo(section), 600);
    } else {
      // Already on home — scroll instantly
      smoothScrollTo(section);
    }
  };

  const navItems = [
    { label: "About", href: "/about" },
    { label: "FAQ", onClick: () => handleNavigation("faq") },
    { label: "Reviews", onClick: () => handleNavigation("reviews") },
    { label: "Contact", href: "/contact", external: true },
  ];

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[80%] max-w-5xl z-50">
      <nav className="flex justify-between items-center rounded-2xl bg-white/30 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.1)] px-6 md:px-10 py-4 border border-white/40 transition-all duration-300 hover:shadow-lg">
        {/* Logo */}
        <div>
          <Link
            href="/"
            className="text-3xl font-bold text-teal-600 hover:text-teal-700 transition-colors"
          >
            MindHaven<span className="text-teal-400">.</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8 font-medium">
          {navItems.map((item, index) => (
            <div key={index} className="relative group">
              {item.href ? (
                <Link
                  href={item.href}
                  target={item.external ? "_blank" : "_self"}
                  className="text-gray-700 hover:text-teal-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  onClick={item.onClick}
                  className="text-gray-700 hover:text-teal-600 transition-colors"
                >
                  {item.label}
                </button>
              )}
              {/* underline animation */}
              <span className="absolute left-0 -bottom-1.5 h-0.5 w-0 bg-linear-to-r from-teal-400 to-teal-600 group-hover:w-full transition-all duration-300"></span>
            </div>
          ))}

          {/* Get Started Button */}
          <button
            onClick={() => router.push("/login")}
            className="relative overflow-hidden border-2 border-teal-500 text-teal-600 px-5 py-2 rounded-full font-semibold hover:text-white group transition-all duration-300"
          >
            <span className="relative z-10">Get Started</span>
            <span className="absolute inset-0 bg-linear-to-r from-teal-400 to-teal-600 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 rounded-full"></span>
          </button>
        </div>

        {/* Mobile Get Started Button */}
        <div className="md:hidden">
          <button
            onClick={() => router.push("/login")}
            className="bg-linear-to-r from-teal-400 to-teal-600 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-md hover:shadow-lg transition"
          >
            Get Started
          </button>
        </div>
      </nav>
    </div>
  );
}
