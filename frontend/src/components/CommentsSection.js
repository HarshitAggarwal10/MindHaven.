"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getPostComments, createPostComment } from "@/lib/community-api";

export default function CommentsSection({ communitySlug, postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    loadComments();
  }, [postId, communitySlug]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getPostComments(communitySlug, postId);
      setComments(data.results || data);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setPosting(true);
      await createPostComment(communitySlug, postId, newComment);
      setNewComment("");
      setReplyingTo(null);
      await loadComments();
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500 text-sm">Loading comments...</p>;
  }

  return (
    <div className="mt-6">
      {/* Add Comment Form */}
      <form onSubmit={handlePostComment} className="mb-6">
        <textarea
          placeholder="Share your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
        {newComment.trim() && (
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={posting}
              className="px-3 py-1 bg-teal-500 text-white text-sm rounded hover:bg-teal-600 transition-all disabled:opacity-50"
            >
              {posting ? "Posting..." : "Comment"}
            </button>
            <button
              type="button"
              onClick={() => setNewComment("")}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment, index) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="border-l-2 border-teal-200 pl-4 py-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{comment.author_handle}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(comment.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mt-2">{comment.body}</p>
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-teal-600 text-xs mt-2 hover:underline"
            >
              Reply
            </button>

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3 pl-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="border-l-2 border-teal-100 pl-3 py-1">
                    <p className="text-xs font-medium text-gray-700">{reply.author_handle}</p>
                    <p className="text-gray-600 text-xs mt-1">{reply.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(reply.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No comments yet. Be the first to share!</p>
        </div>
      )}
    </div>
  );
}
