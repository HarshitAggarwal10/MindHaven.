"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowDownWideNarrow, BookOpenText, Globe2, Heart, LockKeyhole, MessageCircle, Pin, Sparkles, ThumbsUp, TrendingUp, UsersRound } from "lucide-react";
import CommentsSection from "@/components/CommentsSection";
import { getCommunityDetail, getCommunityPosts, createPost, reactToPost, leaveCommunity, getUserMemberships } from "@/lib/community-api";
import CommunityChat from "../components/CommunityChat";
import CommunityIcon from "../components/CommunityIcon";

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ title: "", body: "" });
  const [posting, setPosting] = useState(false);
  const [sort, setSort] = useState("newest");
  const [showPostForm, setShowPostForm] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [communityData, postsData, membershipData] = await Promise.all([
        getCommunityDetail(slug),
        getCommunityPosts(slug, sort),
        getUserMemberships(),
      ]);

      setCommunity(communityData);
      setPosts(postsData.results || postsData);
      const memberships = membershipData.results || membershipData;
      if (!memberships.some((membership) => membership.community.slug === slug)) {
        router.push("/community");
      }
    } catch (error) {
      console.error("Failed to load community:", error);
      router.push("/community");
    } finally {
      setLoading(false);
    }
  }, [router, slug, sort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.body.trim()) return;

    try {
      setPosting(true);
      await createPost(slug, newPost.title, newPost.body);
      setNewPost({ title: "", body: "" });
      setShowPostForm(false);
      await loadData();
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setPosting(false);
    }
  };

  const handleReact = async (postId, emoji) => {
    try {
      await reactToPost(slug, postId, emoji);
      await loadData();
    } catch (error) {
      console.error("Failed to react:", error);
    }
  };

  const handleLeave = async () => {
    if (confirm("Are you sure you want to leave this community?")) {
      try {
        await leaveCommunity(slug);
        router.push("/community");
      } catch (error) {
        console.error("Failed to leave community:", error);
      }
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
      <div className="p-6 text-center">
        <p className="text-gray-500">Community not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EAF7F3] to-[#F1F8F6] pt-32 pb-16 font-[Quicksand]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <button onClick={handleLeave} className="whitespace-nowrap rounded-full border border-rose-100 bg-rose-50 px-4 py-2 font-semibold text-rose-700 transition-colors hover:bg-rose-100">
                Leave
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-2xl font-bold text-teal-700"><UsersRound aria-hidden="true" size={19} /> {community.member_count || 0}</div>
                <div className="text-sm text-slate-600">Members</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-2xl font-bold text-teal-700"><MessageCircle aria-hidden="true" size={19} /> {posts.length}</div>
                <div className="text-sm text-slate-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-lg font-semibold text-teal-700"><Globe2 aria-hidden="true" size={19} /></div>
                <div className="text-sm text-slate-600">Public</div>
              </div>
            </div>
          </div>
        </motion.div>

        <CommunityChat slug={slug} />

        {/* Create Post Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="mb-8">
          {!showPostForm ? (
            <button
              onClick={() => setShowPostForm(true)}
              className="w-full bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all text-left text-gray-600 hover:text-teal-600 border border-gray-100 hover:border-teal-300 font-medium flex items-center gap-3"
            >
              <MessageCircle aria-hidden="true" className="text-teal-700" size={22} />
              What&apos;s on your mind?
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
                <BookOpenText aria-hidden="true" className="text-teal-700" size={20} /> Share Your Thoughts
              </h2>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <input
                  type="text"
                  placeholder="Post title..."
                  value={newPost.title}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium"
                />
                <textarea
                  placeholder="Share your thoughts, question, or experience (keep it kind and supportive)..."
                  value={newPost.body}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, body: e.target.value }))}
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPostForm(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={posting || !newPost.title.trim() || !newPost.body.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>

        {/* Sort Options */}
        <div className="mb-8 flex gap-3 flex-wrap">
          {["newest", "trending", "helpful"].map((option) => (
            <button
              key={option}
              onClick={() => setSort(option)}
              className={`px-5 py-2 rounded-lg capitalize font-medium transition-all ${
                sort === option
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {sort === option && <span aria-hidden="true" className="mr-1">✓</span>}
              {option === "newest" ? <ArrowDownWideNarrow aria-hidden="true" size={16} /> : option === "trending" ? <TrendingUp aria-hidden="true" size={16} /> : <Sparkles aria-hidden="true" size={16} />}
              {option}
            </button>
          ))}
        </div>

        {/* Posts Feed */}
        <div className="space-y-5">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all border border-gray-100 hover:border-teal-200"
              >
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.is_pinned && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800"><Pin aria-hidden="true" size={13} /> Pinned</span>}
                    {post.is_locked && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"><LockKeyhole aria-hidden="true" size={13} /> Locked</span>}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-800">{post.title}</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    by <span className="text-teal-600 font-medium">{post.author_handle || post.author?.username || "Anonymous"}</span> • {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-5 leading-relaxed">{post.body}</p>

              {/* Post Actions */}
              <div className="flex items-center gap-6 text-sm text-gray-500 pt-4 border-t border-gray-100">
                <button onClick={() => handleReact(post.id, "like")} className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-teal-50 hover:text-teal-700">
                  <ThumbsUp aria-hidden="true" size={17} /> <span className="font-medium">{post.reaction_count || 0}</span>
                </button>
                <button onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)} className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-teal-50 hover:text-teal-700">
                  <MessageCircle aria-hidden="true" size={17} /> <span className="font-medium">{post.comment_count || 0}</span>
                </button>
              </div>

              {/* Comments Section (Expanded View) */}
              {expandedPost === post.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2 }} className="border-t pt-4">
                  <CommentsSection communitySlug={slug} postId={post.id} />
                </motion.div>
              )}
            </motion.div>
            ))
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100">
              <Heart aria-hidden="true" className="mx-auto mb-4 text-teal-600" size={42} strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No posts yet</h3>
              <p className="text-gray-600 text-lg mb-6">Be the first to share something! Click above to create a post.</p>
              <button
                onClick={() => setShowPostForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                Create First Post
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
