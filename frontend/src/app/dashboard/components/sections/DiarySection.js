"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Lock } from "lucide-react";
import QuillEditor from "@/components/QuillEditor";
import { encrypt } from "@/lib/crypto";

const API = "http://localhost:8000/api";

/**
 * LOCK STATES
 * CREATE     → user has no diary
 * SHOW_PIN   → show pin once
 * LOCKED     → diary exists but locked
 * UNLOCKED   → editor visible
 */

export default function DiarySection() {
  const quillRef = useRef(null);

  // ================= CORE STATE =================
  const [lockState, setLockState] = useState("CREATE");

  const [anonToken, setAnonToken] = useState(null);
  const [anonId, setAnonId] = useState(null);

  // ⚠️ PIN NEVER stored in localStorage
  const pinRef = useRef(null);

  // ================= DIARY =================
  const [title, setTitle] = useState("");
  const [editorHtml, setEditorHtml] = useState("");

  // ================= UI =================
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  function toastMsg(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  // ================= RESET PER USER (Option B) =================
  useEffect(() => {
    localStorage.removeItem("mh_anon_token");
  }, []);

  // ================= CREATE DIARY =================
  async function handleCreateDiary() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`${API}/diary/anon/create/`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error();

      setAnonToken(data.anon_token);
      setAnonId(data.anon_id);
      pinRef.current = data.pin;

      localStorage.setItem("mh_anon_token", data.anon_token);

      setLockState("SHOW_PIN");
      toastMsg("success", "Diary created");
    } catch {
      toastMsg("error", "Failed to create diary");
    } finally {
      setLoading(false);
    }
  }

  // ================= UNLOCK =================
  function unlockDiary() {
    const entered = prompt("Enter your diary PIN");
    if (entered !== pinRef.current) {
      alert("⚠️ Wrong PIN. This diary is protected.");
      return;
    }
    setLockState("UNLOCKED");
  }

  // ================= SAVE ENTRY =================
  async function handleSave() {
    const entered = prompt("Confirm PIN to save & lock diary");
    if (entered !== pinRef.current) {
      alert("⚠️ Wrong PIN. Entry not saved.");
      return;
    }

    const encTitle = encrypt(title, entered);
    const encContent = encrypt(editorHtml, entered);

    try {
      const res = await fetch(`${API}/diary/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ANON-TOKEN": anonToken,
        },
        body: JSON.stringify({
          title: encTitle.data,
          content_encrypted: encContent.data,
          iv: encContent.iv,
          tag: encContent.tag,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      toastMsg("success", "Diary saved & locked 🔒");
      setTitle("");
      setEditorHtml("");
      setLockState("LOCKED");
    } catch (err) {
      console.error(err);
      toastMsg("error", "Failed to save diary");
    }
  }

  // ================= UI =================
  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-2xl font-semibold mb-4">Digital Diary</h2>

        {lockState === "LOCKED" && (
          <button
            onClick={unlockDiary}
            className="text-sm text-teal-600 underline mb-3"
          >
            Unlock diary
          </button>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={lockState !== "UNLOCKED"}
          placeholder="Entry title"
          className="w-full p-3 border rounded mb-4 disabled:bg-gray-100"
        />

        {lockState === "UNLOCKED" ? (
          <QuillEditor
            ref={quillRef}
            value={editorHtml}
            onChange={setEditorHtml}
          />
        ) : (
          <div className="p-10 border rounded text-center text-gray-500">
            🔒 Diary locked
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={lockState !== "UNLOCKED"}
            className="bg-teal-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
          >
            Save Entry
          </button>
        </div>
      </div>

      {/* CREATE */}
      <AnimatePresence>
        {lockState === "CREATE" && (
          <Modal>
            <h3 className="text-xl font-semibold mb-3">
              Create Anonymous Diary
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              ⚠️ No email. No recovery. Your PIN is the only key.
            </p>
            <button
              onClick={handleCreateDiary}
              className="w-full bg-teal-600 text-white py-3 rounded"
            >
              {loading ? "Creating..." : "Create Diary"}
            </button>
          </Modal>
        )}
      </AnimatePresence>

      {/* SHOW PIN ONCE */}
      <AnimatePresence>
        {lockState === "SHOW_PIN" && (
          <Modal>
            <h3 className="text-lg font-semibold mb-3">Save this PIN 🔐</h3>
            <div className="bg-gray-100 p-4 rounded font-mono text-center">
              <strong>{pinRef.current}</strong>
            </div>
            <p className="text-xs text-red-600 mt-3">
              Shown only once. Required every time.
            </p>
            <button
              onClick={() => setLockState("UNLOCKED")}
              className="mt-4 w-full bg-teal-600 text-white py-2 rounded"
            >
              I have saved it
            </button>
          </Modal>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded shadow flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {toast.type === "success" ? <Check /> : <X />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ================= MODAL =================
function Modal({ children }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/40 grid place-items-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
        {children}
      </motion.div>
    </motion.div>
  );
}
