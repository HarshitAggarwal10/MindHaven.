"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, UsersRound } from "lucide-react";
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

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const [communitiesData, membershipData] = await Promise.all([getCommunities(), getUserMemberships()]);

      const communityList = communitiesData.results || communitiesData;
      setCommunities(communityList.slice(0, 3));

      const memberMap = {};
      const memberships = membershipData.results || membershipData;
      memberships.forEach((m) => {
        memberMap[m.community.id] = m;
      });
      setMembershipMap(memberMap);
    } catch (error) {
      console.error("Failed to load communities:", error);
    } finally {
      setLoading(false);
    }
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
                          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500" /> Live</span>
                        </div>

                        {/* Join Button */}
                        <button
                          onClick={() => membershipMap[community.id]
                            ? router.push(`/community/${community.slug}`)
                            : setSelectedCommunity(community)}
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
                            {joining[community.id] ? "Joining..." : membershipMap[community.id] ? "Open chat" : "Join & chat"}
                            {!joining[community.id] && <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" size={15} />}
                          </span>
                        </button>
                      </div>
                    </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
          onClose={() => setSelectedCommunity(null)}
          onJoin={handleJoin}
          open
        />
      )}
    </motion.section>
  );
}
