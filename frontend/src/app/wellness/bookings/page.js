import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BookingsPanel from "../components/BookingsPanel";

export default function WellnessBookingsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,#f2faf7_0%,#f7fbf8_48%,#fff9ef_100%)] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/wellness" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:underline"><ArrowLeft size={16} /> Back to Wellness Hub</Link>
        <header className="my-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">MindHaven</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Your wellness journey</h1>
          <p className="mt-2 text-sm text-slate-600">Your registrations, payment status, and authorized virtual-session details.</p>
        </header>
        <BookingsPanel />
      </div>
    </main>
  );
}
