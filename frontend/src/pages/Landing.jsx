import React from "react";
import { Link } from "react-router-dom";

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const features = [
  {
    title: "Data-Driven",
    text: "Uses crop and rainfall data for accurate recommendations.",
    icon: <Icon><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>,
  },
  {
    title: "Simplex LP Engine",
    text: "Finds the lowest-cost NPK mix mathematically, not by guesswork.",
    icon: <Icon><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h3M13 12h3M8 16h3M13 16h3" /></Icon>,
  },
  {
    title: "Weather-Adjusted",
    text: "Nitrogen leaching multiplier applied automatically by rainfall class.",
    icon: <Icon><path d="M7 16a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 7.5a4.5 4.5 0 0 1 0 8.5" /><path d="M8 20l1-2M12 20l1-2M16 20l1-2" /></Icon>,
  },
  {
    title: "Officer-Reviewed",
    text: "Every recommendation is checked by an Agricultural Officer before use.",
    icon: <Icon><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></Icon>,
  },
];

const Leaf = () => (
  <svg viewBox="0 0 32 32" className="h-10 w-10 text-[#1C3D20]" fill="currentColor" aria-hidden="true">
    <path d="M16 29V16C16 9 11 5 3 5c0 8 4 12 13 11z" />
    <path d="M16 20c0-7 5-12 13-12 0 8-4 13-13 12z" opacity=".75" />
  </svg>
);

export default function Landing() {
  return (
    <div id="top" className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex h-[88px] w-full items-center justify-between px-8 lg:px-16 2xl:px-24">
          <a href="#top" className="flex items-center gap-3">
            <Leaf />
            <span className="text-xl font-semibold tracking-tight text-slate-900">FertiSmart SL</span>
          </a>
          <nav className="flex items-center gap-2 sm:gap-8 text-base font-medium text-slate-600">
            <a href="#top" className="hidden sm:block border-b-2 border-[#1C3D20] py-1 text-[#1C3D20]">Home</a>
            <a href="#features" className="hidden sm:block hover:text-slate-900 transition">Features</a>
            <Link to="/login" className="px-4 py-3 hover:text-slate-900 transition">Log in</Link>
            <Link to="/register"
              className="rounded-lg bg-[#1C3D20] px-7 py-3.5 text-base font-semibold text-white hover:brightness-110 transition">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200">
          {/* Photo slot: put your image at public/hero-plant.jpg. Falls back to the green gradient if missing. */}
          <div
            className="absolute inset-y-0 right-0 w-full md:w-[55%] bg-cover bg-center"
            style={{ backgroundImage: "url(/hero-plant.jfif), linear-gradient(135deg,#dcebdf 0%,#a9cdb3 55%,#5f8f6b 100%)" }}
            aria-hidden="true"
          >
            {/* soft fade so the photo blends into the page background */}
            <div className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/70 to-transparent" />
          </div>
          <div className="absolute inset-0 bg-[#F8FAFC]/80 md:hidden" aria-hidden="true" />

          <div className="relative grid w-full items-center px-8 py-20 lg:px-16 2xl:px-24 md:min-h-[calc(100vh-88px)] md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="mb-5 text-xs font-medium uppercase tracking-[0.18em] text-emerald-800">
                Linear Programming · Weather-Adjusted · Cost-Minimized
              </p>
              <h1 className="font-bold leading-[1.1] tracking-tight text-5xl sm:text-6xl xl:text-7xl">
                Fertilizer<br />
                <span className="text-[#1C3D20]">Recommendation</span><br />
                System
              </h1>
              <p className="mt-6 max-w-lg text-xl leading-relaxed text-slate-600">
                Get the right fertilizer mix at the lowest cost, for up-country vegetable crops in
                Nuwara Eliya and Bandarawela.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/register"
                  className="inline-flex items-center gap-3 rounded-lg bg-[#1C3D20] px-8 py-4 text-lg font-semibold text-white hover:brightness-110 transition">
                  Create a farmer account
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
                <a href="#features"
                  className="rounded-lg border border-[#1C3D20]/40 bg-white/70 px-8 py-4 text-lg font-semibold text-[#1C3D20] hover:bg-white transition">
                  Learn more
                </a>
              </div>
            </div>

            {/* Illustrative result cards (sample values, not real output) */}
            <div className="relative mt-12 hidden h-[460px] md:mt-0 md:block" aria-hidden="true">
              <div className="absolute left-0 top-4 w-60 rounded-xl bg-white/90 p-4 shadow-lg backdrop-blur">
                {[["N", "Nitrogen"], ["P", "Phosphorus"], ["K", "Potassium"]].map(([s, n]) => (
                  <div key={s} className="mb-3 flex items-center gap-3 last:mb-0">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1C3D20] text-xs font-semibold text-white">{s}</span>
                    <span className="text-xs text-slate-500">{n}<br /><span className="font-semibold text-slate-800">Lowest-cost mix</span></span>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-6 right-0 w-72 rounded-xl bg-white/90 p-4 shadow-lg backdrop-blur">
                <p className="text-sm font-semibold text-slate-800">Recommended fertilizer</p>
                <p className="mt-2 text-sm text-slate-600">Rainfall-adjusted NPK mix</p>
                <p className="mt-1 text-xs text-emerald-800">Pending officer review</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="w-full px-8 py-20 lg:px-16 2xl:px-24">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {features.map((f, i) => (
              <div key={f.title} className={`lg:px-8 ${i === 0 ? "lg:pl-0" : "lg:border-l lg:border-slate-200"}`}>
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-[#1C3D20]">{f.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-500">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-8 py-6 text-center text-xs text-slate-400">
        FertiSmart SL
      </footer>
    </div>
  );
}
