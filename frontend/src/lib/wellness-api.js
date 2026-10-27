const API_BASE = `${(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "")}/api/wellness`;

function headers() {
  const token =
    typeof window === "undefined" ? null : localStorage.getItem("mh_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const requestHeaders = { ...headers(), ...options.headers };
  if (typeof FormData !== "undefined" && options.body instanceof FormData) {
    delete requestHeaders["Content-Type"];
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: "no-store",
    headers: requestHeaders,
  });
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : typeof data === "object" && data
          ? Object.values(data).flat().find((value) => typeof value === "string")
          : null;
    const error = new Error(detail || "The wellness request could not be completed.");
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }
  return data;
}

function queryString(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getWellnessCategories() {
  return request("/categories/");
}

export function getWellnessExperiences(filters = {}) {
  const { format, ...remainingFilters } = filters;
  return request(`/experiences/${queryString({ ...remainingFilters, experience_format: format })}`);
}

export function getWellnessExperience(slug) {
  return request(`/experiences/${encodeURIComponent(slug)}/`);
}

export function getRetreatReviews(slug) {
  return request(`/experiences/${encodeURIComponent(slug)}/reviews/`);
}

export function createRetreatReview(slug, formData) {
  return request(`/experiences/${encodeURIComponent(slug)}/reviews/`, {
    method: "POST",
    body: formData,
  });
}

export function deleteRetreatReview(reviewId) {
  return request(`/reviews/${encodeURIComponent(reviewId)}/`, {
    method: "DELETE",
  });
}

export function getWellnessResources(filters = {}) {
  return request(`/resources/${queryString(filters)}`);
}

export function getWellnessResource(slug) {
  return request(`/resources/${encodeURIComponent(slug)}/`);
}

export function createWellnessBooking(payload) {
  return request("/bookings/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getWellnessBookings({ upcoming = false } = {}) {
  return request(`/bookings/${queryString({ page_size: 48, upcoming: upcoming ? "true" : "" })}`);
}

export function verifyWellnessPayment(bookingId, payment) {
  return request(`/bookings/${encodeURIComponent(bookingId)}/verify-payment/`, {
    method: "POST",
    body: JSON.stringify(payment),
  });
}

export function cancelWellnessBooking(bookingId, reason = "") {
  return request(`/bookings/${encodeURIComponent(bookingId)}/cancel/`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function getWellnessReflections() {
  return request("/reflections/");
}

export function createWellnessReflection(payload) {
  return request("/reflections/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
