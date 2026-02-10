"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { User, LogOut, Settings } from "lucide-react";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setUser(data.user);
      } catch (e) {}
    })();
    return () => (mounted = false);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-3 px-3 py-1 rounded-full bg-white/60 backdrop-blur border border-white/30 shadow"
      >
        <div className="w-9 h-9 rounded-full bg-linear-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-white font-semibold">
          {user?.name ? user.name.charAt(0).toUpperCase() : "M"}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-semibold">{user?.name || user?.email || "Guest"}</div>
          <div className="text-xs text-gray-500">Member</div>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-48 bg-white/90 backdrop-blur rounded-xl shadow-lg p-2 border border-white/40">
          <Link href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-md">
            <Settings size={16} /> Settings
          </Link>
          <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-md">
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
