"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Sparkles, Plus, Heart, Trash2, Eye, Download, Lock, Check, X, Loader2 } from "lucide-react";
import QuillEditor from "@/components/QuillEditor";

const API = "http://localhost:8000/api/diary";

export default function DiarySection() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    if (!email || !password) {
      toastMsg("error", "Email and password are required");
      return;
    }

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
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-teal-600">Private reflections</p>
              <h3 className="text-2xl font-semibold text-slate-800">Digital Diary</h3>
            </div>
            <div className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-700">Encrypted & personal</div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Sparkles className="h-4 w-4 text-teal-500" /> New entry
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title"
                className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              />
              <QuillEditor value={content} onChange={setContent} placeholder="Write what you need to process today…" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Account password for encryption"
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={handleCreateOrUpdate}
                disabled={saving}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save entry
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-500 to-emerald-500 p-4 text-white">
              <div className="flex items-center gap-2 text-sm font-medium opacity-90"><BookOpen className="h-4 w-4" /> Your timeline</div>
              <p className="mt-3 text-sm opacity-90">Search previous entries, favorite them, and unlock them securely with your MindHaven account credentials.</p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2">
                <Search className="h-4 w-4" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search entries"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-white/70"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-slate-800">Previous entries</h4>
              <p className="text-sm text-slate-500">Protected and organized by your account</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{filteredEntries.length}</div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Loading your diary…</div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No entries yet. Start your first reflection.</div>
          ) : (
            <div className="grid gap-3">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-teal-300 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => openEntry(entry)} className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-slate-800">{entry.title || "Untitled entry"}</h5>
                        {entry.favorite && <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{entry.preview}</p>
                      <p className="mt-2 text-xs text-slate-400">{new Date(entry.created_at).toLocaleString()}</p>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-2 text-teal-600"><Lock className="h-5 w-5" /> Verify account access</div>
              <p className="mb-4 text-sm text-slate-500">Use the same email and password from your MindHaven account to unlock this entry.</p>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setVerifyOpen(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Cancel</button>
                <button onClick={verifyAndOpen} className="rounded-xl bg-teal-600 px-3 py-2 text-sm text-white">Unlock</button>
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
