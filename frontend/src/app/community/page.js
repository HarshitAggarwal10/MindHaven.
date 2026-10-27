"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  HeartHandshake,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { getCommunities, joinCommunity, getUserMemberships } from "@/lib/community-api";
import JoinCommunityDialog from "./components/JoinCommunityDialog";
import CommunityIcon from "./components/CommunityIcon";

export default function CommunitiesPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState([]);
  const [membershipMap, setMembershipMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState({});
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [joinError, setJoinError] = useState("");
  const searchTimeout = useRef(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      setAuthRequired(false);
      const [communitiesResult, membershipResult] = await Promise.allSettled([getCommunities(), getUserMemberships()]);
      if (communitiesResult.status === "rejected") throw communitiesResult.reason;
      const communitiesData = communitiesResult.value;
      setCommunities(communitiesData.results || communitiesData);
      if (membershipResult.status === "fulfilled") {
        const memberMap = {};
        (membershipResult.value.results || membershipResult.value).forEach((m) => {
          memberMap[m.community.id] = m;
        });
        setMembershipMap(memberMap);
      } else {
        console.error("Failed to load community memberships:", membershipResult.reason);
        setMembershipMap({});
        setLoadError(membershipResult.reason.message || "Your memberships could not be loaded.");
        setAuthRequired(membershipResult.reason.status === 401);
      }
    } catch (error) {
      console.error("Failed to load communities:", error);
      setLoadError(error.message || "Communities could not be loaded. Please try again.");
      setAuthRequired(error.status === 401);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (value) => {
    setSearch(value);
    setLoadError("");
    setAuthRequired(false);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await getCommunities(value);
        setCommunities(data.results || data);
      } catch (error) {
        console.error("Failed to search communities:", error);
        setLoadError(error.message || "Search is temporarily unavailable.");
        setAuthRequired(error.status === 401);
      }
    }, 300);
  };

  const handleJoin = async (displayAnonymously) => {
    if (!selectedCommunity) return;
    const communityId = selectedCommunity.id;
    const slug = selectedCommunity.slug;
    try {
      setJoinError("");
      setJoining((prev) => ({ ...prev, [communityId]: true }));
      const membership = await joinCommunity(communityId, displayAnonymously);
      setMembershipMap((previous) => ({ ...previous, [communityId]: membership }));
      setSelectedCommunity(null);
      router.push(`/community/${slug}`);
    } catch (error) {
      console.error("Failed to join community:", error);
      setJoinError(error.message || "We couldn't complete your request. Please try again.");
      setAuthRequired(error.status === 401);
    } finally {
      setJoining((prev) => ({ ...prev, [communityId]: false }));
    }
  };

  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EAF7F3] to-[#F1F8F6] pt-6 pb-16 font-[Quicksand]">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition duration-200 hover:-translate-x-0.5 hover:border-teal-200 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" href="/dashboard">
          <ArrowLeft aria-hidden="true" size={16} />
          Back to dashboard
        </Link>
        {/* Hero Section */}
        <div className="mb-10 grid overflow-hidden rounded-[2rem] border border-teal-100/80 bg-[#fffdf9] shadow-[0_24px_70px_-38px_rgba(15,118,110,0.48)] lg:grid-cols-[1.2fr_0.8fr]">
          <div className="px-6 py-9 sm:px-10 sm:py-12">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-teal-800">
              <HeartHandshake size={15} aria-hidden="true" />
              A little less alone, together
            </p>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-slate-800 sm:text-5xl">
              You don&apos;t need perfect words to{" "}
              <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent">
                find your people.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Find a space for what you&apos;re going through. Listen first, say
              hello when you&apos;re ready, and choose how you show up.
            </p>
            <button
              type="button"
              onClick={() => document.getElementById("community-discovery")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Find a community
              <ArrowUpRight size={17} aria-hidden="true" />
            </button>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-teal-700" aria-hidden="true" /> Choose an anonymous identity</span>
              <span className="inline-flex items-center gap-1.5"><MessageCircle size={15} className="text-teal-700" aria-hidden="true" /> Real-time community chat</span>
            </div>
          </div>
          <div className="relative flex min-h-64 items-center justify-center overflow-hidden bg-gradient-to-br from-[#DDF3ED] via-[#EAF7F3] to-[#FFF2DF] p-7 sm:min-h-72">
            <div className="absolute -right-12 -top-16 size-56 rounded-full border border-white/70" aria-hidden="true" />
            <div className="absolute -bottom-24 -left-10 size-64 rounded-full border border-white/70" aria-hidden="true" />
            <div className="absolute right-10 top-9 size-3 rounded-full bg-amber-300 shadow-[0_0_0_8px_rgba(252,211,77,0.15)]" aria-hidden="true" />
            <div className="relative w-full max-w-sm rotate-[-2deg] rounded-3xl border border-white/90 bg-white/85 p-5 shadow-[0_24px_65px_-25px_rgba(15,118,110,0.4)] backdrop-blur-sm transition-transform duration-500 hover:rotate-0">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-800">
                  <Sparkles size={15} aria-hidden="true" /> A note for you
                </span>
                <span className="size-2 rounded-full bg-emerald-400" aria-hidden="true" />
              </div>
              <p className="mt-5 font-[Quicksand] text-2xl font-bold leading-snug text-slate-800">
                There&apos;s room for your story here.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Your first message can be a hello. It can also wait until you&apos;re ready.
              </p>
              <div className="mt-5 flex items-center gap-2" aria-hidden="true">
                {[HeartHandshake, MessageCircle, ShieldCheck, Sparkles].map((Icon, index) => (
                  <span key={index} className={`flex size-9 items-center justify-center rounded-xl ${["bg-teal-100 text-teal-800", "bg-rose-100 text-rose-800", "bg-amber-100 text-amber-800", "bg-violet-100 text-violet-800"][index]}`}>
                    <Icon size={16} />
                  </span>
                ))}
                <span className="ml-1 text-xs font-semibold text-slate-500">A welcoming space, at your pace</span>
              </div>
            </div>
          </div>
        </div>

        {loadError && communities.length > 0 && (
          <p className="mb-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            {loadError}{" "}
            {authRequired ? (
              <Link className="font-bold underline underline-offset-2" href="/login">Sign in again</Link>
            ) : (
              <button
                type="button"
                className="font-bold underline underline-offset-2"
                onClick={() => search.trim() ? handleSearch(search) : loadData()}
              >
                Try again
              </button>
            )}
          </p>
        )}

        <div id="community-discovery" className="scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-800">Find your corner</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-800 sm:text-3xl">Communities that get it</h2>
              <p className="mt-1 text-sm text-slate-600">Browse by topic. Join only when it feels right.</p>
            </div>
            <p className="rounded-full border border-white bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-500">
              {communities.length} {communities.length === 1 ? "space" : "spaces"} to explore
            </p>
          </div>
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search communities by name or topic..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-full border border-teal-100 bg-white/90 px-6 py-4 pr-14 text-lg shadow-[0_12px_32px_-20px_rgba(15,118,110,0.5)] transition duration-300 placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
            />
            <Search aria-hidden="true" className="absolute right-6 top-1/2 -translate-y-1/2 text-teal-700" size={20} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-teal-500 animate-spin mb-4"></div>
            <p className="text-gray-500 text-lg">Loading communities...</p>
          </div>
        ) : communities.length > 0 ? (
          <>
            {/* Stats Bar */}
            <div className="mb-12 p-6 bg-white rounded-2xl shadow-md border border-gray-100">
              <div className="flex flex-wrap gap-6 justify-center md:justify-between text-center">
                <div>
                  <div className="text-3xl font-bold text-teal-600">{communities.length}</div>
                  <div className="text-gray-600 text-sm">Communities shown</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600">{Object.keys(membershipMap).length}</div>
                  <div className="text-gray-600 text-sm">Your Memberships</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600">
                    {communities.reduce((sum, c) => sum + (c.member_count || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-gray-600 text-sm">Members in these spaces</div>
                </div>
              </div>
            </div>

            {/* Communities Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {communities.map((community) => (
                <motion.div key={community.id} variants={itemVariants}>
                  <div className="h-full">
                      <div className="group relative h-full overflow-hidden rounded-[1.75rem] border border-teal-100/80 bg-[#fffdf9]/95 p-6 shadow-[0_12px_32px_-22px_rgba(15,118,110,0.48)] transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_24px_48px_-24px_rgba(15,118,110,0.38)]">
                        {/* Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Content */}
                        <div className="relative z-10">
                          {/* Icon & Header */}
                          <div className="flex items-start justify-between mb-4">
                            <CommunityIcon className="h-14 w-14 shadow-sm transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-110" name={community.name} slug={community.slug} size={28} />
                            {community.is_public && (
                              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Public</span>
                            )}
                          </div>

                          {/* Title & Description */}
                          <h3 className="mb-2 line-clamp-2 text-xl font-bold text-slate-800">{community.name}</h3>
                          <p className="mb-4 line-clamp-3 min-h-12 text-sm leading-6 text-slate-600">{community.description}</p>

                          {/* Meta */}
                          <div className="mb-5 flex items-center gap-5 border-y border-teal-50 py-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5"><UsersRound aria-hidden="true" className="text-teal-700" size={16} /> {community.member_count || 0} members</span>
                            <span className="flex items-center gap-1.5"><MessageCircle aria-hidden="true" className="text-teal-700" size={16} /> {community.post_count || 0} posts</span>
                          </div>
                          <p className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                            <span aria-hidden="true" className={`size-2 rounded-full ${community.online_count ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" : "bg-slate-300"}`} />
                            {community.online_count || 0} members online now
                          </p>
                          <p className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800">
                            <ShieldCheck size={14} aria-hidden="true" />
                            Choose anonymous or your signup name
                          </p>

                          {/* Action Button */}
                          <button
                            onClick={() => {
                              if (authRequired) {
                                router.push("/login");
                              } else if (membershipMap[community.id]) {
                                router.push(`/community/${community.slug}`);
                              } else {
                                setJoinError("");
                                setSelectedCommunity(community);
                              }
                            }}
                            disabled={joining[community.id]}
                            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 text-sm md:text-base ${
                              membershipMap[community.id]
                                ? "cursor-pointer bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                : joining[community.id]
                                  ? "bg-gray-200 text-gray-600 cursor-wait"
                                  : "bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:-translate-y-0.5 hover:shadow-lg"
                            }`}
                          >
                            <span className="inline-flex items-center justify-center gap-2">
                              {joining[community.id] ? "Joining..." : authRequired ? "Sign in to join" : membershipMap[community.id] ? "Open community" : "Join community"}
                              {!joining[community.id] && <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" size={16} />}
                            </span>
                          </button>
                        </div>
                      </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-24 px-4"
          >
            <UsersRound aria-hidden="true" className="mx-auto mb-4 text-teal-600" size={42} strokeWidth={1.5} />
            <p className="text-2xl font-semibold text-gray-700 mb-2">No communities found</p>
            <p className="text-gray-500 text-lg">Try adjusting your search or check back later</p>
          </motion.div>
        )}
        </div>
      </motion.div>
      {selectedCommunity && (
        <JoinCommunityDialog
          community={selectedCommunity}
          joining={joining[selectedCommunity.id]}
          onClose={() => setSelectedCommunity(null)}
          joinError={joinError}
          onJoin={handleJoin}
          open
        />
      )}
    </div>
  );
}
