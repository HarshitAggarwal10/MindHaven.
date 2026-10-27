"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Globe2, HeartHandshake, LogOut, MessageCircle, ShieldCheck, UsersRound, X } from "lucide-react";
import { getCommunityDetail, leaveCommunity, getUserMemberships } from "@/lib/community-api";
import CommunityChat from "../components/CommunityChat";
import CommunityIcon from "../components/CommunityIcon";

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [community, setCommunity] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const [communityData, membershipData] = await Promise.all([
        getCommunityDetail(slug),
        getUserMemberships(),
      ]);

      setCommunity(communityData);
      const memberships = membershipData.results || membershipData;
      const currentMembership = memberships.find((item) => item.community.slug === slug);
      if (!currentMembership) {
        router.push("/community");
        return;
      }
      setMembership(currentMembership);
    } catch (error) {
      console.error("Failed to load community:", error);
      setLoadError(error.message || "This community could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [router, slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLeave = async () => {
    try {
      setLeaving(true);
      setActionError("");
      await leaveCommunity(slug);
      router.push("/community");
    } catch (error) {
      console.error("Failed to leave community:", error);
      setActionError(error.message || "We couldn't leave this community. Your membership is unchanged.");
      setConfirmLeave(false);
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Loading community...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-[#EAF7F3] to-[#F1F8F6] p-6 font-[Quicksand]">
        <div className="w-full max-w-lg rounded-[1.75rem] border border-teal-100 bg-[#fffdf9] p-8 text-center shadow-xl">
          <HeartHandshake aria-hidden="true" className="mx-auto mb-4 text-teal-700" size={36} />
          <h1 className="text-2xl font-extrabold text-slate-800">We couldn&apos;t open this community</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{loadError || "It may have moved, or your membership may no longer be active."}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-5 py-2.5 text-sm font-bold text-teal-800 transition hover:bg-teal-50" href="/community">
              <ArrowLeft aria-hidden="true" size={16} /> All communities
            </Link>
            {loadError.includes("sign in again") && (
              <Link className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5" href="/login">
                Sign in <ArrowRight aria-hidden="true" size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EAF7F3] to-[#F1F8F6] pt-6 pb-16 font-[Quicksand]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition duration-200 hover:-translate-x-0.5 hover:border-teal-200 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" href="/community">
          <ArrowLeft aria-hidden="true" size={16} />
          All communities
        </Link>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
          <div className="rounded-[1.75rem] border border-teal-100/80 bg-[#fffdf9] p-6 shadow-[0_18px_48px_-28px_rgba(15,118,110,0.45)] md:p-8">
            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CommunityIcon className="h-14 w-14" name={community.name} size={30} slug={community.slug} />
                  <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent md:text-5xl">{community.name}</h1>
                </div>
                <p className="mt-3 text-lg leading-7 text-slate-600">{community.description}</p>
              </div>
              <button onClick={() => setConfirmLeave(true)} className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-rose-100 bg-rose-50 px-4 py-2 font-semibold text-rose-700 transition duration-200 hover:-translate-y-0.5 hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700">
                <LogOut aria-hidden="true" size={16} />
                Leave
              </button>
            </div>

            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-teal-100/80 bg-gradient-to-r from-[#E6F6F1] via-white to-[#FFF7E9] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
                  <HeartHandshake aria-hidden="true" size={19} />
                </span>
                <div>
                  <p className="font-bold text-slate-800">You&apos;re in. Take this space at your own pace.</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">Read, chat, or share when you feel ready. You can change your mind and leave anytime.</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-teal-800">
                    <ShieldCheck aria-hidden="true" size={14} />
                    You appear as {membership?.display_anonymously ? "an anonymous nickname" : "your signup name"}
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-emerald-100 bg-white/80 px-3 py-1.5 text-xs font-bold text-emerald-800 sm:self-auto">
                <Check aria-hidden="true" size={14} /> Member
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-2xl font-bold text-teal-700"><UsersRound aria-hidden="true" size={19} /> {community.member_count || 0}</div>
                <div className="text-sm text-slate-600">Members</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-2xl font-bold text-teal-700"><UsersRound aria-hidden="true" size={19} /> {community.online_count || 0}</div>
                <div className="text-sm text-slate-600">Online now</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-lg font-semibold text-teal-700"><Globe2 aria-hidden="true" size={19} /></div>
                <div className="text-sm text-slate-600">{community.is_public ? "Public" : "Private"}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {actionError && <p className="mb-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{actionError}</p>}
        <CommunityChat slug={slug} />
      </div>
      <AnimatePresence>
        {confirmLeave && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !leaving) setConfirmLeave(false);
            }}
            role="presentation"
          >
            <motion.section
              aria-labelledby="leave-community-title"
              aria-modal="true"
              className="w-full max-w-md rounded-[1.75rem] border border-white/80 bg-[#fffdf9] p-6 shadow-[0_28px_90px_-25px_rgba(31,93,84,0.4)] sm:p-7"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              role="dialog"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700"><LogOut aria-hidden="true" size={22} /></span>
                <button aria-label="Keep membership" className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" disabled={leaving} onClick={() => setConfirmLeave(false)} type="button">
                  <X aria-hidden="true" size={19} />
                </button>
              </div>
              <h2 className="mt-5 text-xl font-extrabold text-slate-800" id="leave-community-title">Leave {community.name}?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">You&apos;ll leave this space and can rejoin later. If you do, you can choose an anonymous nickname or your signup name again.</p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50" disabled={leaving} onClick={() => setConfirmLeave(false)} type="button">
                  Stay here
                </button>
                <button aria-busy={leaving} className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition duration-200 hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60" disabled={leaving} onClick={handleLeave} type="button">
                  {leaving ? "Leaving..." : "Leave community"}
                  {!leaving && <LogOut aria-hidden="true" size={15} />}
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
