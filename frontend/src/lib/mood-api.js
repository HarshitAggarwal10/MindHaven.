const API_BASE = `${(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "")}/api/mood`;

function getHeaders() {
  const token = typeof window === "undefined" ? null : localStorage.getItem("mh_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function firstMessage(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(firstMessage).find(Boolean);
  if (value && typeof value === "object") {
    return Object.values(value).map(firstMessage).find(Boolean);
  }
  return null;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: "no-store",
    headers: { ...getHeaders(), ...options.headers },
  });
  const data = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      firstMessage(data?.detail) ||
      firstMessage(data) ||
      "The mood request could not be completed.",
    );
    error.code = data?.code || "request_failed";
    error.status = response.status;
    throw error;
  }
  return data;
}

export function getMoodConfig() {
  return request("/config/");
}

export function getMoodCheckIns(days = 30) {
  return request(`/check-ins/?days=${days}`);
}

export function createMoodCheckIn(mood) {
  return request("/check-ins/", {
    method: "POST",
    body: JSON.stringify({ mood }),
  });
}

export function updateMoodCheckIn(id, mood) {
  return request(`/check-ins/${encodeURIComponent(id)}/`, {
    method: "PATCH",
    body: JSON.stringify({ mood }),
  });
}

export function deleteMoodCheckIn(id) {
  return request(`/check-ins/${encodeURIComponent(id)}/`, { method: "DELETE" });
}

export function analyzeMoodText(text, consent, idempotencyKey) {
  return request("/analyze/", {
    method: "POST",
    body: JSON.stringify({ text, consent, idempotency_key: idempotencyKey }),
  });
}

export function getMoodAnalysis(id) {
  return request(`/analyses/${encodeURIComponent(id)}/`);
}

export function deleteMoodAnalysis(id) {
  return request(`/analyses/${encodeURIComponent(id)}/`, { method: "DELETE" });
}

export function getMoodHistory(days = 30, limit = 50) {
  return request(`/history/?days=${days}&limit=${limit}`);
}

export function getMoodStats(days = 7) {
  return request(`/stats/?days=${days}`);
}
