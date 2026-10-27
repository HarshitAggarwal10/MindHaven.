"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, BookHeart, Search, Sparkles, Plus, Heart, Trash2, Eye, Download, Lock, Check, X, Loader2, Pencil } from "lucide-react";
import QuillEditor from "@/components/QuillEditor";

const API = "http://localhost:8000/api/diary";

export default function DiarySection() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState(null);

  function getAuthHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("mh_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function toastMsg(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchEntries() {
    setLoading(true);
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      toastMsg("error", "Please sign in to load your diary");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/list/`, {
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(data);
    } catch {
      toastMsg("error", "Unable to load diary entries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEntries();
  }, []);

  const filteredEntries = useMemo(() => {
    if (!query) return entries;
    return entries.filter((entry) => entry.title.toLowerCase().includes(query.toLowerCase()));
  }, [entries, query]);

  async function handleCreateOrUpdate() {
    if (!title.trim() && !content.trim()) {
      toastMsg("error", "Add a title or a few thoughts first");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ title, content, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Unable to save entry");
      setTitle("");
      setContent("");
      setPassword("");
      toastMsg("success", "Diary entry saved securely");
      await fetchEntries();
    } catch (err) {
      toastMsg("error", err.message || "Unable to save entry");
    } finally {
      setSaving(false);
    }
  }

  async function openEntry(entry) {
    setSelectedEntry(entry);
    setVerifyOpen(true);
  }

  async function verifyAndOpen() {
    if (unlocking) return;
    if (!email || !password) {
      toastMsg("error", "Email and password are required");
      return;
    }

    setUnlocking(true);
    try {
      const res = await fetch(`${API}/verify/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Verification failed");
      const detailRes = await fetch(`${API}/${selectedEntry.id}/`, {
        credentials: "include",
        headers: { "X-Diary-Password": password, ...getAuthHeaders() },
      });
      const detail = await detailRes.json();
      if (!detailRes.ok) throw new Error("Unable to open entry");
      setSelectedEntry(detail);
      setVerifyOpen(false);
      setEmail("");
      setPassword("");
      setPreviewOpen(true);
      toastMsg("success", "Entry unlocked");
    } catch (err) {
      toastMsg("error", err.message || "Verification failed");
    } finally {
      setUnlocking(false);
    }
  }

  async function toggleFavorite(entryId) {
    try {
      const res = await fetch(`${API}/${entryId}/favorite/`, {
        method: "POST",
        credentials: "include",
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error();
      await fetchEntries();
    } catch {
      toastMsg("error", "Unable to update favorite");
    }
  }

  async function deleteEntry(entryId) {
    if (!confirm("Delete this diary entry?")) return;
    try {
      const res = await fetch(`${API}/${entryId}/delete/`, {
        method: "DELETE",
        credentials: "include",
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error();
      await fetchEntries();
      toastMsg("success", "Entry deleted");
    } catch {
      toastMsg("error", "Unable to delete entry");
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[1.75rem] border border-[#e5eee8] bg-white/90 shadow-[0_12px_36px_rgba(42,91,80,0.07)]">
          <div className="relative isolate overflow-hidden bg-gradient-to-br from-[#eef7ef] via-[#f9f8ef] to-[#f8eee0] px-5 py-5 sm:px-7 sm:py-6">
            <div className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/60 blur-2xl" aria-hidden="true" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">
                  <Sparkles size={13} /> A quiet place for you
                </p>
                <h3 className="mt-1 font-[Playfair_Display] text-2xl font-semibold text-[#29483e] sm:text-3xl">Digital Diary</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">A private page for the thoughts, tiny victories, and feelings you want to keep.</p>
              </div>
              <div className="hidden shrink-0 items-center justify-center sm:flex" aria-hidden="true">
                <svg viewBox="0 0 148 112" className="h-24 w-32 md:h-28 md:w-36">
                  <path d="M24 25c15-8 31-7 48 2v63c-16-9-32-10-48-2V25Z" fill="#fffdf7" stroke="#90ad91" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M72 27c17-9 33-10 49-2v63c-16-8-32-7-49 2V27Z" fill="#f8f0df" stroke="#90ad91" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M35 41c9-3 17-3 25 0M35 51c9-3 17-3 25 0M85 42c9-3 17-3 25 0M85 52c9-3 17-3 25 0" fill="none" stroke="#bdc9a7" strokeWidth="2" strokeLinecap="round" />
                  <path d="M72 29v61" stroke="#d7a985" strokeWidth="2" />
                  <path d="M55 76c0-6 5-11 11-11s11 5 11 11c0 7-11 14-11 14S55 83 55 76Z" fill="#eaa99a" stroke="#cb8179" strokeWidth="1.5" />
                  <path d="m22 13 2 4 4 1-4 2-2 4-2-4-4-2 4-1 2-4ZM126 22l1.5 3 3.5 1-3.5 1.5-1.5 3-1.5-3-3.5-1.5 3.5-1 1.5-3Z" fill="#dfb96d" />
                  <path d="M25 99c6-8 12-10 18-9M110 101c5-7 10-9 16-8" fill="none" stroke="#79a186" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <span className="relative mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-teal-900 shadow-sm">
              <Lock size={13} /> Encrypted & personal
            </span>
          </div>

          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-[#e8eee8] bg-[#fbfcf9] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#f7ead7] text-[#527d66]"><Pencil size={17} /></span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">A fresh page</p>
                  <p className="text-xs text-slate-500">Write only what feels right today.</p>
                </div>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title"
                className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10"
              />
              <QuillEditor value={content} onChange={setContent} placeholder="Write what you need to process today…" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Account password for encryption"
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10"
              />
              <button
                onClick={handleCreateOrUpdate}
                disabled={saving}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#287966] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#206a58] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save entry
              </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#d8e6d9] bg-gradient-to-br from-[#427f70] via-[#568e78] to-[#82aa86] p-4 text-white sm:p-5">
              <div className="pointer-events-none absolute -right-7 -top-8 size-32 rounded-full border border-white/20" aria-hidden="true" />
              <div className="relative flex items-center gap-2 text-sm font-medium"><BookOpen className="h-4 w-4" /> Your timeline</div>
              <p className="relative mt-3 text-sm leading-6 text-white/90">Search previous entries, favorite them, and unlock them securely with your MindHaven account credentials.</p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2">
                <Search className="h-4 w-4" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search entries"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-white/70"
                />
              </div>
              <div className="relative mt-4 flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5">
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f7ead7] text-[#527d66] shadow-sm" aria-hidden="true">
                  <BookHeart size={20} />
                  <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-[#65967c] bg-white text-teal-800">
                    <Lock size={10} />
                  </span>
                </span>
                <span>
                  <span className="block text-xs font-semibold text-white">A secret journey, yours alone</span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-white/80">A private page for every thought.</span>
                </span>
                <Sparkles size={14} className="ml-auto shrink-0 text-amber-100" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[#e5eee8] bg-white/90 p-4 shadow-[0_10px_30px_rgba(42,91,80,0.05)] sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-[Playfair_Display] text-xl font-semibold text-[#29483e]">Your collected thoughts</h4>
              <p className="mt-1 text-sm text-slate-500">Private reflections, protected by your account</p>
            </div>
            <div className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800">{filteredEntries.length}</div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Loading your diary…</div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No entries yet. Start your first reflection.</div>
          ) : (
            <div className="grid gap-3">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="group rounded-2xl border border-[#e7eee8] bg-gradient-to-br from-white to-[#fbfaf5] p-4 transition hover:border-teal-200 hover:shadow-[0_8px_24px_rgba(42,91,80,0.07)]">
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => openEntry(entry)} className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f7ead7] text-[#66836a] transition group-hover:-rotate-3" aria-hidden="true">
                        <BookHeart size={17} />
                      </span>
                      <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{entry.title || "Untitled entry"}</span>
                        {entry.favorite && <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />}
                      </span>
                      <span className="mt-1 block truncate text-sm text-slate-500">{entry.preview}</span>
                      <span className="mt-2 block text-xs text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                      </span>
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => toggleFavorite(entry.id)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><Heart className={`h-4 w-4 ${entry.favorite ? "fill-rose-500 text-rose-500" : ""}`} /></button>
                      <button onClick={() => deleteEntry(entry.id)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {verifyOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_24px_70px_rgba(18,48,40,0.24)]">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#eef7ef] to-[#f8eee0] px-5 py-5">
                <div className="pointer-events-none absolute -right-7 -top-10 size-28 rounded-full border border-white/70" aria-hidden="true" />
                <div className="relative flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl border border-white/80 bg-white/75 text-teal-800 shadow-sm"><Lock className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-[Playfair_Display] text-xl font-semibold text-[#29483e]">Your page is private</h3>
                    <p className="mt-0.5 text-xs text-slate-600">Verify your account to open this reflection.</p>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6">
              <p className="mb-4 text-sm leading-6 text-slate-600">Use the same email and password from your MindHaven account to unlock this entry.</p>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" disabled={unlocking} placeholder="Email" className="mb-3 w-full rounded-xl border border-slate-200 bg-[#fbfcfa] px-4 py-3 text-sm outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" disabled={unlocking} placeholder="Password" className="mb-4 w-full rounded-xl border border-slate-200 bg-[#fbfcfa] px-4 py-3 text-sm outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60" />
              <div className="flex justify-end gap-2">
                <button type="button" disabled={unlocking} onClick={() => setVerifyOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
                <button type="button" onClick={verifyAndOpen} disabled={unlocking} aria-busy={unlocking} className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-[#287966] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#206a58] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-wait disabled:opacity-80">
                  {unlocking ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Unlocking…</> : <><Lock className="size-4" aria-hidden="true" /> Unlock diary</>}
                </button>
              </div>
              {unlocking && <p className="mt-3 text-right text-xs text-teal-800" role="status">Unlocking diary securely…</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewOpen && selectedEntry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-teal-600"><Eye className="h-5 w-5" /> Entry preview</div>
                  <h3 className="mt-2 text-xl font-semibold text-slate-800">{selectedEntry.title || "Untitled entry"}</h3>
                  <p className="text-sm text-slate-500">{new Date(selectedEntry.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setPreviewOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="prose max-w-none rounded-2xl border border-slate-200 p-4 text-sm" dangerouslySetInnerHTML={{ __html: selectedEntry.content }} />
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => toggleFavorite(selectedEntry.id)} className="rounded-full border border-slate-200 px-3 py-2 text-sm">{selectedEntry.favorite ? "Remove favorite" : "Favorite"}</button>
                <button className="rounded-full border border-slate-200 px-3 py-2 text-sm"><Download className="mr-1 inline h-4 w-4" />Export</button>
                <button onClick={() => setPreviewOpen(false)} className="rounded-full border border-slate-200 px-3 py-2 text-sm">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-sm text-white shadow-xl">
            {toast.type === "success" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
