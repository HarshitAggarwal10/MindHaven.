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

  const navLinkClass = (href) =>
    `rounded-full px-3 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
      pathname === href
        ? "bg-teal-50/90 text-teal-800"
        : "text-slate-600 hover:bg-white/70 hover:text-teal-800"
    }`;

  return (
    <div className="fixed left-1/2 top-3 z-50 w-[calc(100%-1.25rem)] max-w-6xl -translate-x-1/2 sm:top-5 sm:w-[calc(100%-2.5rem)]">
      <nav className="relative flex items-center justify-between gap-2 rounded-[1.35rem] border border-white/75 bg-white/65 px-3 py-2.5 shadow-[0_12px_42px_rgba(31,67,58,0.12)] backdrop-blur-2xl backdrop-saturate-150 sm:gap-4 sm:px-5 sm:py-3 md:px-6">
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-r from-white/25 via-transparent to-teal-50/30" aria-hidden="true" />
        <Link
          href="/"
          className="relative z-10 shrink-0 rounded-lg text-xl font-bold tracking-tight text-[#246b5e] transition hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 sm:text-2xl"
        >
          MindHaven<span className="text-amber-500">.</span>
        </Link>

        <div className="relative z-10 hidden items-center gap-1 rounded-full border border-white/65 bg-white/35 p-1 text-[13px] font-semibold lg:flex">
          <Link href="/about" className={navLinkClass("/about")}>About</Link>
          <button onClick={() => router.push("/#faq")} className={navLinkClass("/faq")}>FAQ</button>
          <button onClick={() => router.push("/#reviews")} className={navLinkClass("/reviews")}>Reviews</button>
          <Link href="/contact" className={navLinkClass("/contact")}>Contact</Link>

          {user && (
            <Link
              href="/dashboard"
              className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-white/70 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full border border-white/70 bg-white/40 p-1 pr-2 transition hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:gap-3 sm:py-1 sm:pl-2"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-500 text-xs font-bold text-white shadow-sm sm:size-9">
                  {user.name
                    ? user.name.split(" ").map((x) => x[0]).join("").slice(0, 2)
                    : (user.email || "U")[0].toUpperCase()}
                </div>
                <div className="hidden text-left md:block">
                  <div className="max-w-28 truncate text-xs font-semibold text-slate-800">{user.name || user.email}</div>
                  <div className="text-[10px] text-slate-500">MindHaven member</div>
                </div>
              </button>

              {open && (
                <div role="menu" className="absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border border-white/80 bg-white/90 py-2 shadow-[0_16px_45px_rgba(31,67,58,0.17)] backdrop-blur-2xl">
                  <Link role="menuitem" href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-teal-50">
                    <UserIcon size={16} /> Profile
                  </Link>

                  <Link role="menuitem" href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-teal-50">
                    <Settings size={16} /> Settings
                  </Link>

                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="hidden rounded-full bg-[#267b69] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_7px_18px_rgba(38,123,105,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1d6b5b] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:inline-flex sm:px-5 sm:text-sm"
            >
              Get started
            </button>
          )}

          <button
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/70 bg-white/45 text-slate-700 transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 lg:hidden"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label={mobileMenu ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenu}
            aria-controls="public-mobile-menu"
          >
            {mobileMenu ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>

      {mobileMenu && (
        <div id="public-mobile-menu" className="mt-2 grid gap-1 rounded-[1.35rem] border border-white/75 bg-white/85 p-2 shadow-[0_16px_45px_rgba(31,67,58,0.15)] backdrop-blur-2xl lg:hidden">
          <Link href="/about" onClick={() => setMobileMenu(false)} className={`${navLinkClass("/about")} text-left`}>About</Link>
          <button onClick={() => { setMobileMenu(false); router.push("/#faq"); }} className={`${navLinkClass("/faq")} text-left`}>FAQ</button>
          <button onClick={() => { setMobileMenu(false); router.push("/#reviews"); }} className={`${navLinkClass("/reviews")} text-left`}>Reviews</button>
          <Link href="/contact" onClick={() => setMobileMenu(false)} className={`${navLinkClass("/contact")} text-left`}>Contact</Link>

          {user && (
            <Link href="/dashboard" onClick={() => setMobileMenu(false)} className="rounded-full px-3 py-2 text-left font-semibold text-slate-600 transition hover:bg-white/70 hover:text-teal-800">
              Dashboard
            </Link>
          )}

          {!user ? (
            <button
              onClick={() => { setMobileMenu(false); router.push("/login"); }}
              className="mt-1 w-full rounded-xl bg-[#267b69] py-3 font-semibold text-white shadow-sm transition hover:bg-[#1d6b5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:hidden"
            >
              Get started
            </button>
          ) : null}
          {user && (
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 sm:hidden"
            >
              <LogOut size={16} /> Sign out
            </button>
          )}
        </div>
      )}
    </div>
  );
}
