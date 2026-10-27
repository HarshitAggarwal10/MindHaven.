import Link from "next/link";
import { Facebook, Instagram, Linkedin, Send, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#eef5ef] via-[#f7f7f0] to-[#f7eee2] px-5 pb-6 pt-14 text-slate-700 sm:px-8 sm:pt-16 lg:px-12">
      <div className="pointer-events-none absolute -right-20 -top-32 size-96 rounded-full bg-teal-100/55 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 size-96 rounded-full bg-amber-100/50 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-10 rounded-[2rem] border border-white/80 bg-white/55 p-6 shadow-[0_14px_45px_rgba(47,76,62,0.07)] backdrop-blur-xl sm:p-9 lg:grid-cols-[1.25fr_0.75fr_0.8fr_1.2fr] lg:gap-8 lg:p-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 rounded-lg text-2xl font-bold tracking-tight text-[#246b5e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
              <span className="flex size-9 items-center justify-center rounded-xl bg-teal-100/80 text-teal-800"><Sparkles size={18} /></span>
              MindHaven<span className="text-amber-500">.</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
              Your safe space for emotional healing and personal growth. Find comfort, connection, and calm—all in one mindful place.
            </p>
            <Link
              href="/about"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-800 transition hover:gap-2 hover:text-teal-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
            >
              Learn about us <span aria-hidden="true">→</span>
            </Link>
          </div>

          <FooterColumn
            title="Explore"
            items={["About MindHaven", "Community Support", "Mindfulness Tools", "Therapist Sessions"]}
          />
          <FooterColumn
            title="Resources"
            items={["Mental Health Articles", "Self-Care Guides", "Anxiety & Stress Tips", "Personal Growth Plans"]}
          />

          <div>
            <h3 className="text-base font-semibold text-slate-800">Stay mindful</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
              Join our mindful circle for calming reflections, self-growth reminders, and wellness updates.
            </p>
            <div className="mt-4 flex w-full max-w-sm items-center gap-2 rounded-full border border-white/90 bg-white/85 p-1.5 shadow-sm transition focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-teal-500/10">
              <input
                type="email"
                aria-label="Email address for mindful updates"
                placeholder="Your email address"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                aria-label="Subscribe to mindful updates"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#267b69] text-white shadow-sm transition hover:bg-[#1d6b5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">A little calm, delivered gently.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-5 border-t border-teal-900/10 px-1 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
            © {new Date().getFullYear()} <span className="font-semibold text-teal-800">MindHaven</span>. Nurturing mental well-being with compassion and connection.
          </p>
          <div className="flex items-center gap-2">
            <span className="mr-1 text-xs font-medium text-slate-500">Find us</span>
            <SocialLink icon={<Facebook size={17} />} href="https://facebook.com/" label="MindHaven on Facebook" />
            <SocialLink icon={<Instagram size={17} />} href="https://instagram.com/" label="MindHaven on Instagram" />
            <SocialLink icon={<Linkedin size={17} />} href="https://linkedin.com/" label="MindHaven on LinkedIn" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-slate-600 transition hover:text-teal-800">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({ icon, href, label }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full border border-white/90 bg-white/70 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-teal-800 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
    >
      {icon}
    </Link>
  );
}
