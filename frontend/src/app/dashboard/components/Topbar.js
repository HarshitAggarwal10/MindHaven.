/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  CheckCheck,
  ChevronDown,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Heart,
  Sparkles,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getNotifications, getUserProfile, markNotificationsAsRead } from "@/lib/community-api";

export default function Topbar({ user }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState("");
  const [latestNotification, setLatestNotification] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [cachedUser, setCachedUser] = useState(null);
  const [profileName, setProfileName] = useState("");
  const profileMenuRef = useRef(null);

  // Enable hydration-safe user initials
  useEffect(() => {
    setHydrated(true);
    try {
      const storedUser = localStorage.getItem("mh_user");
      if (storedUser) setCachedUser(JSON.parse(storedUser));
    } catch (error) {
      console.error("Could not read the saved account name:", error);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("mh_token")) return undefined;

    let cancelled = false;
    getUserProfile()
      .then((profile) => {
        if (!cancelled && profile.display_name?.trim()) {
          setProfileName(profile.display_name.trim());
        }
      })
      .catch((error) => {
        console.error("Failed to load dashboard profile name:", error);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnScroll = () => setOpen(false);
    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("scroll", closeOnScroll, true);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("scroll", closeOnScroll, true);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    const token = localStorage.getItem("mh_token");
    if (!token) return undefined;

    let cancelled = false;
    let socket;
    let reconnectTimer;
    let toastTimer;
    let refreshTimer;
    let retryDelay = 1000;

    const loadNotifications = async () => {
      try {
        const data = await getNotifications();
        if (!cancelled) {
          const fetchedNotifications = data.results || data;
          setNotifications((current) => {
            const notificationsById = new Map(current.map((notification) => [notification.id, notification]));
            fetchedNotifications.forEach((notification) => {
              const existing = notificationsById.get(notification.id);
              notificationsById.set(
                notification.id,
                existing?.is_read && !notification.is_read
                  ? { ...notification, is_read: true }
                  : notification,
              );
            });
            return [...notificationsById.values()].sort(
              (left, right) => new Date(right.created_at) - new Date(left.created_at),
            );
          });
          setNotificationError("");
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
        if (!cancelled) setNotificationError(error.message || "Notifications could not be loaded.");
      }
    };

    const connect = () => {
      if (cancelled) return;
      const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const url = new URL(apiOrigin);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.pathname = "/ws/notifications/";
      url.search = new URLSearchParams({ token }).toString();

      socket = new WebSocket(url.toString());
      socket.onopen = () => {
        retryDelay = 1000;
      };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type !== "notification.created" || !payload.notification) return;
          const notification = payload.notification;
          setNotifications((current) => current.some((item) => item.id === notification.id)
            ? current
            : [notification, ...current]);
          setLatestNotification(notification);
          clearTimeout(toastTimer);
          toastTimer = setTimeout(() => setLatestNotification(null), 6500);
        } catch (error) {
          console.error("Could not read live notification:", error);
        }
      };
      socket.onclose = (event) => {
        if (!cancelled && event.code !== 4401) {
          reconnectTimer = setTimeout(connect, retryDelay);
          retryDelay = Math.min(retryDelay * 2, 15000);
        }
      };
    };

    loadNotifications();
    connect();
    refreshTimer = setInterval(loadNotifications, 30000);
    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      clearTimeout(toastTimer);
      clearInterval(refreshTimer);
      socket?.close(1000, "Dashboard closed");
    };
  }, []);

  const displayName = profileName
    || user?.display_name?.trim()
    || user?.name?.trim()
    || cachedUser?.display_name?.trim()
    || cachedUser?.name?.trim()
    || "";
  const initials =
    hydrated && (displayName || user?.email)
      ? displayName
        ? displayName
            .trim()
            .split(/\s+/)
            .map((x) => x[0]?.toUpperCase())
            .slice(0, 2)
            .join("")
        : user?.email?.[0]?.toUpperCase() || "U"
      : "U";

  const logout = async () => {
    localStorage.removeItem("mh_token");
    localStorage.removeItem("mh_user");
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const markAllNotificationsRead = async () => {
    try {
      await markNotificationsAsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
      setNotificationError("");
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      setNotificationError(error.message || "Notifications could not be marked as read.");
    }
  };

  const openNotification = async (notification) => {
    if (!notification.is_read) await markAllNotificationsRead();
    setNotificationsOpen(false);
    if (notification.link) router.push(notification.link);
  };

  const unreadCount = notifications.reduce((count, notification) => count + (notification.is_read ? 0 : 1), 0);

  return (
    <header className="relative z-999 flex items-center justify-between gap-3 overflow-visible border-b border-white/70 px-3 py-3 sm:gap-5 sm:px-6 sm:py-4">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-r from-[#effaf6] via-[#f3f8f2] to-[#fff6e8]" aria-hidden="true">
        <div className="absolute -left-20 -top-32 size-72 rounded-full bg-[#d2eee5]/70 blur-3xl" />
        <div className="absolute right-[20%] -top-36 size-72 rounded-full bg-[#f8e9ca]/65 blur-3xl" />
        <svg viewBox="0 0 640 100" preserveAspectRatio="none" className="absolute bottom-0 right-[15rem] h-14 w-[min(42rem,48vw)] opacity-50 sm:h-[4.5rem]" aria-hidden="true">
          <circle cx="488" cy="30" r="20" fill="#F4C86E" />
          <path d="M0 72c95-47 169-33 244-8 74 24 147 31 230-6 63-28 107-26 166-7v49H0Z" fill="#C5E4D2" />
          <path d="M0 87c103-28 174-15 253 2 88 19 170 6 238-16 60-19 101-15 149-3v30H0Z" fill="#93C3A6" />
          <path d="M74 67c9-15 26-15 35 0m-23-1V53c0-7 11-7 11 0v12m2 0V47c0-7 12-7 12 0v20" fill="none" stroke="#659A7E" strokeWidth="4" strokeLinecap="round" />
          <path d="M370 78v-17m0 9c-9-9-15-3-13 2 5 4 10 3 13-2Zm0-4c8-8 14-3 12 2-4 3-9 3-12-2Z" fill="#6A9E79" />
        </svg>
      </div>

      <div className="flex min-w-0 flex-1 items-center">
        <div className="flex max-w-[min(30rem,70vw)] items-center gap-2 rounded-2xl border border-white/90 bg-white/80 py-1.5 pl-1.5 pr-3 shadow-[0_6px_18px_rgba(47,93,76,0.08)] backdrop-blur-xl sm:gap-4 sm:py-2 sm:pl-3 sm:pr-5">
          <svg viewBox="0 0 72 64" role="img" aria-label="A tiny smiling cloud holding a flower" className="h-11 w-12 shrink-0 sm:h-14 sm:w-14">
            <path d="M18 48c-7 0-12-5-12-11s5-11 12-11c2-8 8-13 17-13 8 0 15 6 17 14 6 0 11 5 11 11s-5 10-12 10H18Z" fill="#DDF4EE" stroke="#79B9A5" strokeWidth="2.5" />
            <circle cx="27" cy="35" r="1.8" fill="#385B55" /><circle cx="42" cy="35" r="1.8" fill="#385B55" />
            <path d="M29 40q5 5 10 0" fill="none" stroke="#385B55" strokeWidth="2" strokeLinecap="round" />
            <circle cx="22" cy="40" r="2.5" fill="#F3A9A0" /><circle cx="47" cy="40" r="2.5" fill="#F3A9A0" />
            <path d="M55 48V34m0 7c-6-6-10-3-10 1 4 2 8 1 10-1Zm0-4c5-5 9-2 9 1-3 2-6 2-9-1Z" fill="#91B881" stroke="#638F6B" strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="55" cy="29" r="3.2" fill="#F4C65F" /><circle cx="50" cy="29" r="2.7" fill="#F4C65F" /><circle cx="60" cy="29" r="2.7" fill="#F4C65F" /><circle cx="55" cy="24" r="2.7" fill="#F4C65F" /><circle cx="55" cy="34" r="2.7" fill="#F4C65F" /><circle cx="55" cy="29" r="1.8" fill="#E89B50" />
          </svg>
          <div className="min-w-0" style={{ fontFamily: "Quicksand" }}>
            <p className="truncate text-[9px] font-bold uppercase tracking-[0.15em] text-teal-800 sm:text-[11px]">A little MindHaven reminder</p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-700 sm:text-sm">You don’t have to bloom all at once.</p>
          </div>
        </div>
      </div>

      {/* 🔔 Notifications + Profile */}
      <div className="relative flex shrink-0 items-center gap-2 sm:gap-5">
        {/* Notification Button */}
        <div className="relative">
          <motion.button
            aria-expanded={notificationsOpen}
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            whileHover={{ scale: 1.06 }}
            onClick={() => setNotificationsOpen((current) => !current)}
            className={`relative flex size-11 items-center justify-center rounded-full border border-white/70 bg-white/75 shadow-sm backdrop-blur-xl transition-colors hover:bg-white ${unreadCount ? "text-teal-800" : "text-teal-700"}`}
            type="button"
          >
            {unreadCount ? <BellRing size={20} className="animate-[wiggle_1.8s_ease-in-out_infinite]" /> : <Bell size={20} />}
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-extrabold leading-none text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.section
                aria-label="Notifications"
                className="absolute right-0 top-14 z-[10001] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-teal-100 bg-[#fffdf9] shadow-[0_24px_70px_-24px_rgba(15,76,70,0.35)]"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18 }}
              >
                <div className="flex items-center justify-between gap-3 border-b border-teal-50 bg-gradient-to-r from-[#EAF8F3] to-[#FFF9EE] px-4 py-3">
                  <div>
                    <h2 className="font-[Quicksand] font-extrabold text-slate-800">A little note for you</h2>
                    <p className="text-xs text-slate-500">{unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "You’re all caught up"}</p>
                  </div>
                  {unreadCount > 0 && (
                    <button className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold text-teal-800 transition hover:bg-white/80" onClick={markAllNotificationsRead} type="button">
                      <CheckCheck size={14} /> Mark read
                    </button>
                  )}
                </div>

                {notificationError && <p className="px-4 py-2 text-xs text-rose-700" role="alert">{notificationError}</p>}

                <div className="max-h-80 overflow-y-auto p-2">
                  {notifications.length ? notifications.slice(0, 12).map((notification) => (
                    <button
                      className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-teal-50/80 ${notification.is_read ? "opacity-75" : "bg-teal-50/50"}`}
                      key={notification.id}
                      onClick={() => openNotification(notification)}
                      type="button"
                    >
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
                        <MessageCircle size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-slate-800">{notification.title}</span>
                          {!notification.is_read && <span className="size-2 shrink-0 rounded-full bg-teal-500" aria-label="Unread" />}
                        </span>
                        <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-600">{notification.body}</span>
                        <time className="mt-1 block text-[10px] font-medium text-slate-400" dateTime={notification.created_at}>
                          {new Date(notification.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                        </time>
                      </span>
                    </button>
                  )) : (
                    <div className="px-5 py-9 text-center">
                      <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Heart size={19} /></span>
                      <p className="mt-3 text-sm font-bold text-slate-700">A quiet moment</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Community updates will find their way here.</p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {latestNotification && !notificationsOpen && (
            <motion.div
              className="absolute right-0 top-14 z-[10002] flex w-[min(22rem,calc(100vw-2rem))] items-start gap-2 rounded-2xl border border-teal-100 bg-[#fffdf9] p-3 shadow-[0_22px_60px_-22px_rgba(15,76,70,0.4)]"
              initial={{ opacity: 0, y: -8, x: 8 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -8, x: 8 }}
            >
              <button
                className="flex min-w-0 flex-1 items-start gap-3 rounded-xl p-1 text-left transition hover:bg-teal-50/70"
                onClick={() => openNotification(latestNotification)}
                type="button"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-800"><MessageCircle size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-teal-800">Community update</span>
                  <span className="mt-1 block truncate text-sm font-bold text-slate-800">{latestNotification.title}</span>
                  <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-slate-600">{latestNotification.body}</span>
                </span>
              </button>
              <button
                onClick={() => setLatestNotification(null)}
                type="button"
                aria-label="Dismiss notification"
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Block */}
        <div className="relative z-9999" ref={profileMenuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`Account menu${displayName ? ` for ${displayName}` : ""}`}
            onClick={() => setOpen((s) => !s)}
            className={`group flex items-center gap-3 rounded-full border px-2 py-1.5 text-left shadow-sm backdrop-blur-xl transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              open
                ? "border-teal-200 bg-white shadow-md shadow-teal-950/10"
                : "border-white/80 bg-white/75 hover:-translate-y-0.5 hover:border-teal-100 hover:bg-white hover:shadow-md"
            }`}
          >
            <div             className="relative grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-300 via-teal-500 to-emerald-700 font-semibold text-white shadow-md shadow-teal-900/20 ring-2 ring-white sm:size-10">
              {initials}
              <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-400" aria-hidden="true" />
            </div>
            <div className="min-w-0 pr-1" style={{ fontFamily: "Quicksand" }}>
              <div className="max-w-36 truncate text-sm font-bold text-slate-800">
                {hydrated ? displayName || user?.email || cachedUser?.email || "Your account" : "…"}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-teal-700">
                <Sparkles size={11} aria-hidden="true" /> Your MindHaven space
              </div>
            </div>
            <ChevronDown size={16} className={`mr-1 shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-180 text-teal-700" : "group-hover:text-teal-800"}`} />
          </button>

          <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              aria-label="Account options"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-[calc(100%+0.75rem)] z-[10000] w-[min(19rem,calc(100vw-5.5rem))] overflow-hidden rounded-[1.35rem] border border-white/90 bg-[#fffefa] shadow-[0_24px_70px_-24px_rgba(15,76,70,0.38)] ring-1 ring-teal-950/5"
            >
              <div className="relative overflow-hidden bg-gradient-to-br from-[#e5f7f1] via-[#f3fbf8] to-[#fff6e9] px-4 pb-4 pt-5">
                <div className="absolute -right-8 -top-10 size-28 rounded-full border border-teal-700/10" aria-hidden="true" />
                <div className="absolute -right-2 -top-4 size-16 rounded-full border border-teal-700/10" aria-hidden="true" />
                <p className="relative text-[10px] font-bold uppercase tracking-[0.16em] text-teal-800">A space just for you</p>
                <p className="relative mt-1 truncate font-[Quicksand] text-lg font-bold text-slate-900">
                  {displayName ? `Hello, ${displayName.split(/\s+/)[0]}` : "Welcome back"}
                </p>
                <p className="relative mt-1 text-xs text-slate-600">Take things one gentle step at a time.</p>
              </div>
              <div className="space-y-1 p-2">
                <button
                  role="menuitem"
                  onClick={() => { setOpen(false); router.push("/profile"); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                  type="button"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-800"><User size={17} /></span>
                  <span>My profile</span>
                </button>
                <button
                  role="menuitem"
                  onClick={() => { setOpen(false); router.push("/settings"); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                  type="button"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><Settings size={17} /></span>
                  <span>Settings</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  role="menuitem"
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-600"
                  type="button"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-rose-50"><LogOut size={17} /></span>
                  <span>Log out</span>
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
