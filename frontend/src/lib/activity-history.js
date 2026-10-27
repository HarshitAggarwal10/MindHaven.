const STORAGE_KEY = "mh_dashboard_activity";
const MAX_ACTIVITIES = 40;
const listeners = new Set();

export function subscribeToDashboardActivity(listener) {
  if (typeof window === "undefined") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDashboardActivitySnapshot() {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem(STORAGE_KEY) || "[]";
  } catch {
    return "[]";
  }
}

export function getDashboardActivityHistory() {
  try {
    const activities = JSON.parse(getDashboardActivitySnapshot());
    return Array.isArray(activities) ? activities : [];
  } catch {
    return [];
  }
}

export function trackDashboardActivity(label) {
  if (typeof window === "undefined" || !label) return;
  try {
    const activities = getDashboardActivityHistory();
    const lastActivity = activities[0];
    const now = Date.now();
    if (
      lastActivity?.label === label
      && now - new Date(lastActivity.created_at).getTime() < 60_000
    ) {
      return;
    }
    activities.unshift({
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      created_at: new Date(now).toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities.slice(0, MAX_ACTIVITIES)));
    listeners.forEach((listener) => listener());
  } catch {
    // Browsing history is optional and stays on this device.
  }
}
