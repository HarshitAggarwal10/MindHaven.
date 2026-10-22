"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Search, UsersRound } from "lucide-react";
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
  const searchTimeout = useRef(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [communitiesData, membershipData] = await Promise.all([getCommunities(), getUserMemberships()]);

      setCommunities(communitiesData.results || communitiesData);
      const memberMap = {};
      (membershipData.results || membershipData).forEach((m) => {
        memberMap[m.community.id] = m;
      });
      setMembershipMap(memberMap);
    } catch (error) {
      console.error("Failed to load communities:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await getCommunities(value);
        setCommunities(data.results || data);
      } catch (error) {
        console.error("Failed to search communities:", error);
      }
    }, 300);
  };

  const handleJoin = async (displayAnonymously) => {
    if (!selectedCommunity) return;
    const communityId = selectedCommunity.id;
    const slug = selectedCommunity.slug;
    try {
      setJoining((prev) => ({ ...prev, [communityId]: true }));
      const membership = await joinCommunity(communityId, displayAnonymously);
      setMembershipMap((previous) => ({ ...previous, [communityId]: membership }));
      setSelectedCommunity(null);
      router.push(`/community/${slug}`);
    } catch (error) {
      console.error("Failed to join community:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EAF7F3] to-[#F1F8F6] pt-32 pb-16 font-[Quicksand]">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent mb-4 md:text-6xl">
            Join Our Communities
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Connect with others, share your story anonymously, and find support in our moderated mental health communities. Everyone&apos;s welcome here.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
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
                  <div className="text-gray-600 text-sm">Total Communities</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600">{Object.keys(membershipMap).length}</div>
                  <div className="text-gray-600 text-sm">Your Memberships</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600">
                    {communities.reduce((sum, c) => sum + (c.member_count || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-gray-600 text-sm">Total Members</div>
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
                          <div className="mb-6 flex items-center gap-5 border-y border-teal-50 py-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5"><UsersRound aria-hidden="true" className="text-teal-700" size={16} /> {community.member_count || 0}</span>
                            <span className="flex items-center gap-1.5"><MessageCircle aria-hidden="true" className="text-teal-700" size={16} /> {community.post_count || 0}</span>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => membershipMap[community.id]
                              ? router.push(`/community/${community.slug}`)
                              : setSelectedCommunity(community)}
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
                              {joining[community.id] ? "Joining..." : membershipMap[community.id] ? "Open community" : "Join community"}
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
      </motion.div>
      {selectedCommunity && (
        <JoinCommunityDialog
          community={selectedCommunity}
          joining={joining[selectedCommunity.id]}
          onClose={() => setSelectedCommunity(null)}
          onJoin={handleJoin}
          open
        />
      )}
    </div>
  );
}
