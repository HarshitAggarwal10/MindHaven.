const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/community`;

function getHeaders() {
  const token = typeof window === "undefined" ? null : localStorage.getItem("mh_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("mh_token");
    }
    const message = response.status === 401
      ? "Your sign-in session is invalid or expired. Please sign in again."
      : data?.detail || data?.error || "The community request could not be completed.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

export function getCommunities(search = "") {
  const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
  return request(`/list/${query}`);
}

export function getCommunityDetail(slug) {
  return request(`/${encodeURIComponent(slug)}/`);
}

export function joinCommunity(communityId, displayAnonymously) {
  return request("/membership/", {
    method: "POST",
    body: JSON.stringify({ community_id: communityId, display_anonymously: displayAnonymously }),
  });
}

export function leaveCommunity(slug) {
  return request(`/${encodeURIComponent(slug)}/leave/`, { method: "DELETE" });
}

export function getUserMemberships() {
  return request("/membership/");
}

export function getCommunityChatActivity() {
  return request("/chat-activity/");
}

export function getCommunityPosts(communitySlug, sort = "newest") {
  return request(`/${encodeURIComponent(communitySlug)}/posts?sort=${encodeURIComponent(sort)}`);
}

export function createPost(communitySlug, title, body) {
  return request(`/${encodeURIComponent(communitySlug)}/posts`, {
    method: "POST",
    body: JSON.stringify({ title, body }),
  });
}

export function getPostComments(communitySlug, postId) {
  return request(`/${encodeURIComponent(communitySlug)}/posts/${postId}/comments/`);
}

export function createPostComment(communitySlug, postId, body) {
  return request(`/${encodeURIComponent(communitySlug)}/posts/${postId}/comments/`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function reactToPost(communitySlug, postId, emoji) {
  return request(`/${encodeURIComponent(communitySlug)}/posts/${postId}/react`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });
}

export function getChatRoom(slug) {
  return request(`/${encodeURIComponent(slug)}/chat-room/`);
}

export function getChatMessages(roomId) {
  return request(`/chat/${roomId}/messages/`);
}

export function getNotifications() {
  return request("/notifications/");
}

export function markNotificationsAsRead() {
  return request("/notifications/read/", { method: "PUT" });
}

export function getUserProfile() {
  return request("/profile/");
}
