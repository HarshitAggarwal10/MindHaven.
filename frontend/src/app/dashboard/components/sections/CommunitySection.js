"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, HeartHandshake, MessageCircle, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { getCommunities, joinCommunity, getUserMemberships } from "@/lib/community-api";
import JoinCommunityDialog from "@/app/community/components/JoinCommunityDialog";
import CommunityIcon from "@/app/community/components/CommunityIcon";

export default function CommunitySection() {
  const router = useRouter();
  const [communities, setCommunities] = useState([]);
  const [membershipMap, setMembershipMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState({});
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [joinError, setJoinError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoadError("");
      setAuthRequired(false);
      const [communitiesResult, membershipResult] = await Promise.allSettled([getCommunities(), getUserMemberships()]);
      if (communitiesResult.status === "rejected") throw communitiesResult.reason;
      const communitiesData = communitiesResult.value;
      const communityList = communitiesData.results || communitiesData;
      const featuredSlugs = ["anxiety-support", "depression-support", "general-wellness"];
      const featured = featuredSlugs
        .map((slug) => communityList.find((community) => community.slug === slug))
        .filter(Boolean);
      setCommunities([...featured, ...communityList.filter((community) => !featuredSlugs.includes(community.slug))].slice(0, 3));

      if (membershipResult.status === "fulfilled") {
        const memberMap = {};
        (membershipResult.value.results || membershipResult.value).forEach((membership) => {
          memberMap[membership.community.id] = membership;
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.section className="font-[Quicksand]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
      <div className="rounded-3xl border border-teal-100 bg-gradient-to-br from-white via-[#EFF8F5] to-[#F7FAF7] p-8 shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <h2 className="font-[Quicksand] text-3xl font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Community</h2>
            <p className="mt-2 text-slate-600">Join a supportive circle and connect through live chat</p>
          </div>
          <Link href="/community" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            View All <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" size={16} />
          </Link>
        </div>

        <div className="relative mb-7 overflow-hidden rounded-[1.75rem] border border-teal-100/80 bg-gradient-to-br from-[#DDF4EE] via-[#F1FAF6] to-[#FFF2DE] p-5 shadow-[0_18px_45px_-30px_rgba(15,118,110,0.45)] sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-20 size-56 rounded-full border border-white/70" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 right-24 size-48 rounded-full border border-white/60" aria-hidden="true" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-teal-800">
                <Sparkles aria-hidden="true" size={14} /> A space to belong
              </span>
              <h3 className="mt-3 text-2xl font-extrabold leading-tight text-slate-800 sm:text-3xl">Small steps. Shared strength.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                Find people who understand. Join quietly, listen first, or share when you&apos;re ready.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700">
                <ShieldCheck aria-hidden="true" className="text-teal-700" size={17} />
                Private by choice
              </div>
              <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" href="/community">
                Explore spaces <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap gap-2 border-t border-white/70 pt-4 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/65 px-3 py-1.5"><HeartHandshake aria-hidden="true" className="text-teal-700" size={14} /> Kindness first</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/65 px-3 py-1.5"><UsersRound aria-hidden="true" className="text-teal-700" size={14} /> Peer support</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/65 px-3 py-1.5"><MessageCircle aria-hidden="true" className="text-teal-700" size={14} /> Real-time chat</span>
          </div>
        </div>

        {loadError && communities.length > 0 && (
          <p className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            <span>{loadError}</span>
            {authRequired ? (
              <Link className="font-bold underline underline-offset-2" href="/login">Sign in again</Link>
            ) : (
              <button className="font-bold underline underline-offset-2" onClick={loadCommunities} type="button">Try again</button>
            )}
          </p>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 rounded-full border-3 border-gray-200 border-t-teal-500 animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Loading communities...</p>
          </div>
        ) : communities.length > 0 ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {communities.map((community) => (
              <motion.div key={community.id} variants={itemVariants}>
                <div className="h-full">
                    <div className="group relative h-full overflow-hidden rounded-2xl border border-teal-100/80 bg-[#fffdf9] p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl">
                      {/* Animated Background Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Content */}
                      <div className="relative z-10">
                        {/* Icon */}
                        <CommunityIcon className="mb-3 h-12 w-12 shadow-sm transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-110" name={community.name} slug={community.slug} size={24} />

                        {/* Title & Description */}
                        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-slate-800">{community.name}</h3>
                        <p className="mb-4 line-clamp-2 min-h-10 text-sm leading-6 text-slate-600">{community.description}</p>

                        {/* Stats */}
                        <div className="mb-4 flex items-center gap-4 border-y border-teal-50 py-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1"><UsersRound aria-hidden="true" className="text-teal-700" size={14} /> {community.member_count || 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle aria-hidden="true" className="text-teal-700" size={14} /> {community.post_count || 0}</span>
                          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800">
                            <span aria-hidden="true" className={`size-2 rounded-full ${community.online_count ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" : "bg-slate-300"}`} />
                            {community.online_count || 0} online
                          </span>
                        </div>

                        {/* Join Button */}
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
                          className={`w-full py-2.5 rounded-lg font-semibold transition-all duration-300 text-sm ${
                            membershipMap[community.id]
                              ? "bg-emerald-50 text-emerald-800"
                              : joining[community.id]
                                ? "bg-gray-100 text-gray-600 cursor-wait"
                                : "bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:-translate-y-0.5 hover:shadow-lg"
                          }`}
                        >
                          <span className="inline-flex items-center justify-center gap-2">
                            {joining[community.id] ? "Joining..." : authRequired ? "Sign in to join" : membershipMap[community.id] ? "Open chat" : "Join & chat"}
                            {!joining[community.id] && <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" size={15} />}
                          </span>
                        </button>
                      </div>
                    </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : loadError ? (
          <div className="rounded-2xl border border-teal-100 bg-white/75 px-5 py-8 text-center">
            <UsersRound aria-hidden="true" className="mx-auto mb-3 text-teal-600" size={34} strokeWidth={1.5} />
            <p className="font-bold text-slate-800">{authRequired ? "Sign in to explore communities" : "Communities are temporarily unavailable"}</p>
            <p className="mt-1 text-sm text-slate-600">{authRequired ? "Your community session needs a quick refresh before you can join or chat." : "Please try again in a moment."}</p>
            <div className="mt-4 flex justify-center gap-3">
              {authRequired ? (
                <Link className="rounded-full bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800" href="/login">Sign in</Link>
              ) : (
                <button className="rounded-full bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800" onClick={loadCommunities} type="button">Try again</button>
              )}
              <Link className="rounded-full border border-teal-100 bg-white px-4 py-2 text-sm font-bold text-teal-800 transition hover:bg-teal-50" href="/community">Community page</Link>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            <UsersRound aria-hidden="true" className="mx-auto mb-3 text-teal-600" size={38} strokeWidth={1.5} />
            <p className="text-lg font-medium text-gray-700">No communities yet</p>
            <p className="text-gray-500 text-sm">Explore and join communities to start chatting!</p>
          </motion.div>
        )}
      </div>
      {selectedCommunity && (
        <JoinCommunityDialog
          community={selectedCommunity}
          joining={joining[selectedCommunity.id]}
          joinError={joinError}
          onClose={() => setSelectedCommunity(null)}
          onJoin={handleJoin}
          open
        />
      )}
    </motion.section>
  );
}
