"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Heart, Lock, LogIn, Mail, Sparkles } from "lucide-react";
import AuthIllustration from "../components/AuthIllustration";
import "../../styles/animation.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:8000/api/users/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error || "Invalid email or password");
        return;
      }

      if (!data.access) {
        setError("Login response was incomplete. Please try again.");
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("mh_token", data.access);
        localStorage.setItem("mh_user", JSON.stringify({ email: email.trim().toLowerCase() }));
      }

      router.push("/dashboard");
    } catch (requestError) {
      console.error("Login request failed:", requestError);
      setError("Could not reach the server. Check that the backend is running, then try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top_left,#e5f5ee_0%,transparent_44%),radial-gradient(ellipse_at_bottom_right,#f8ead7_0%,transparent_42%),#f7f8f2] px-4 py-6 font-[Poppins] sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute -left-24 top-1/3 size-72 rounded-full bg-teal-200/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-amber-100/50 blur-3xl" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 grid w-full max-w-6xl gap-3 rounded-[2rem] border border-white/80 bg-white/55 p-3 shadow-[0_30px_90px_-40px_rgba(43,83,68,0.3)] backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr] lg:gap-0 lg:p-4"
      >
        <AuthIllustration variant="login" />
        <section className="flex items-center justify-center px-3 py-7 sm:px-8 sm:py-10 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50/80 px-3 py-1.5 text-xs font-semibold text-teal-900">
              <Heart size={14} fill="currentColor" /> Welcome back to your space
            </div>
            <h1 className="font-[Playfair_Display] text-4xl font-bold tracking-tight text-[#233f37] sm:text-5xl">
              Let’s pick up gently.
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
              Sign in when you’re ready. Your MindHaven space will be here.
            </p>

            {error && (
              <div role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-7 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Email address
                <span className="relative mt-2 block">
                  <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-teal-700" aria-hidden="true" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-[#dce8df] bg-white/90 py-3.5 pl-11 pr-4 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </span>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Password
                <span className="relative mt-2 block">
                  <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-teal-700" aria-hidden="true" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-[#dce8df] bg-white/90 py-3.5 pl-11 pr-4 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#237c68] to-[#3f9878] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(35,124,104,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(35,124,104,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-wait disabled:opacity-60"
              >
                <LogIn size={18} /> {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              New to MindHaven?{" "}
              <Link href="/signup" className="font-bold text-teal-800 underline decoration-teal-300 underline-offset-4 hover:text-teal-950">
                Create an account
              </Link>
            </p>
            <Link href="/" className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-teal-50 hover:text-teal-900">
              <ArrowLeft size={14} /> Back to home <Sparkles size={13} />
            </Link>
          </div>
        </section>
      </motion.div>
    </main>
  );
}
