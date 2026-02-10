"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, User as UserIcon, Menu, X } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);           // profile dropdown
  const [mobileMenu, setMobileMenu] = useState(false); // hamburger menu
  const dropdownRef = useRef();

  /** Fetch logged-in user */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (mounted && data?.user) setUser(data.user);
      } catch {}
    })();
    return () => (mounted = false);
  }, []);

  /** Close dropdown on outside click */
  useEffect(() => {
    function onDoc(e) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] md:w-[80%] max-w-6xl z-50">
      <nav className="flex justify-between items-center rounded-2xl bg-white/30 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.07)] px-6 md:px-10 py-3 border border-white/40 transition-all duration-300">

        {/* LOGO */}
        <Link href="/" className="text-2xl md:text-3xl font-bold text-teal-600 hover:text-teal-700">
          MindHaven<span className="text-teal-400">.</span>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center space-x-8 font-medium text-sm">

          <Link href="/about" className="text-gray-700 hover:text-teal-600">About</Link>
          <button onClick={() => router.push("/#faq")} className="text-gray-700 hover:text-teal-600">FAQ</button>
          <button onClick={() => router.push("/#reviews")} className="text-gray-700 hover:text-teal-600">Reviews</button>
          <Link href="/contact" className="text-gray-700 hover:text-teal-600">Contact</Link>

          {/* DASHBOARD Button (only if logged in) */}
          {user && (
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-teal-600 font-semibold transition"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center space-x-4">

          {/* USER DROPDOWN */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 px-3 py-1 rounded-full hover:shadow-md transition"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center font-semibold">
                  {user.name
                    ? user.name.split(" ").map((x) => x[0]).join("").slice(0, 2)
                    : (user.email || "U")[0].toUpperCase()}
                </div>

                {/* User info */}
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-800">{user.name || user.email}</div>
                  <div className="text-xs text-gray-500">Member</div>
                </div>
              </button>

              {/* DROPDOWN MENU */}
              {open && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border py-2 z-50">
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50">
                    <UserIcon size={16} /> Profile
                  </Link>

                  <Link href="/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50">
                    <Settings size={16} /> Settings
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-red-600"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* GET STARTED BUTTON */
            <button
              onClick={() => router.push("/login")}
              className="
                relative px-5 py-2 rounded-full font-semibold text-white
                bg-linear-to-r from-teal-400 to-teal-600 shadow-lg
                hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <span className="relative z-10">Get Started</span>
              <span className="absolute inset-0 bg-white/10 blur-xl opacity-60"></span>
            </button>
          )}

          {/* MOBILE HAMBURGER */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* ===================== MOBILE MENU ===================== */}
      {mobileMenu && (
        <div className="md:hidden mt-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 space-y-4 text-center">

          <Link href="/about" className="block text-gray-700 hover:text-teal-600">About</Link>
          <button onClick={() => router.push("/#faq")} className="block text-gray-700 hover:text-teal-600">FAQ</button>
          <button onClick={() => router.push("/#reviews")} className="block text-gray-700 hover:text-teal-600">Reviews</button>
          <Link href="/contact" className="block text-gray-700 hover:text-teal-600">Contact</Link>

          {user && (
            <Link href="/dashboard" className="block text-gray-700 hover:text-teal-600 font-semibold">
              Dashboard
            </Link>
          )}

          {!user && (
            <button
              onClick={() => router.push("/login")}
              className="w-full py-2 rounded-xl bg-linear-to-r from-teal-400 to-teal-600 text-white font-semibold shadow-md"
            >
              Get Started
            </button>
          )}
        </div>
      )}
    </div>
  );
}
