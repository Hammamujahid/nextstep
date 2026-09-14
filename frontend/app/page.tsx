"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  FolderKanban,
  ListChecks,
  Menu,
  Target,
  Users,
  X,
} from "lucide-react";
import Logo from "../components/Logo";
import Reveal from "../components/Reveal";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Journey", href: "#journey" },
  { label: "How it works", href: "#how-it-works" },
];

const FEATURES = [
  {
    icon: Target,
    title: "Goals",
    desc: "Define where you're headed, like becoming a Fullstack Developer, and track real progress.",
  },
  {
    icon: FolderKanban,
    title: "Projects",
    desc: "Turn goals into portfolio-ready projects with clear status and task counts.",
  },
  {
    icon: ListChecks,
    title: "Tasks",
    desc: "Your next steps, prioritized. Check things off and keep momentum every day.",
  },
  {
    icon: Briefcase,
    title: "Job Applications",
    desc: "Track every application from wishlist to offer in one calm pipeline.",
  },
  {
    icon: FileText,
    title: "Documents",
    desc: "Keep your CV, cover letters, and certificates ready whenever you need them.",
  },
  {
    icon: Users,
    title: "Workspaces",
    desc: "Collaborate with mentors or peers without the corporate HR complexity.",
  },
];

const JOURNEY = [
  { label: "Profile Ready", state: "done" },
  { label: "Portfolio", state: "done" },
  { label: "Applications", state: "current" },
  { label: "Interview", state: "next" },
  { label: "Offer", state: "next" },
  { label: "Career Goal", state: "next" },
] as const;

const NEXT_STEPS = [
  { title: "Finish portfolio project", meta: "Portfolio Website • High • Due Fri", done: false },
  { title: "Apply to 3 frontend roles", meta: "Job Hunt • High • Due Sat", done: false },
  { title: "Update CV with latest project", meta: "Documents • Medium • Due Sun", done: true },
  { title: "Prepare technical interview", meta: "Interview Prep • Medium • Next week", done: false },
];

export default function LandingPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <header className="anim-fade-in sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-600 transition hover:text-sky-600"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="group inline-flex items-center gap-1.5 rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
            >
              Get started
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="anim-slide-down border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex gap-2">
                <Link
                  href="/login"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="flex-1 rounded-xl bg-sky-400 px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-20">
        <div>
          <span className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            </span>
            One step at a time
          </span>
          <h1 className="anim-fade-up anim-delay-1 mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Every goal starts with the{" "}
            <span className="text-sky-500">next step.</span>
          </h1>
          <p className="anim-fade-up anim-delay-2 mt-4 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
            NextStep is your personal career companion. Organize goals,
            projects, tasks, job applications, and documents in one calm
            place built for job seekers and developers.
          </p>
          <div className="anim-fade-up anim-delay-3 mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="btn-shine group inline-flex items-center justify-center gap-2 rounded-xl bg-sky-400 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
            >
              Start your journey
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700 hover:shadow-md"
            >
              Log in to dashboard
            </Link>
          </div>
          <div className="anim-fade-up anim-delay-4 mt-8 flex items-center gap-6 text-sm text-slate-500">
            <div>
              <p className="text-xl font-bold text-slate-900">72%</p>
              <p>avg. goal progress</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xl font-bold text-slate-900">6-in-1</p>
              <p>career toolkit</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xl font-bold text-slate-900">Calm</p>
              <p>by design, no noise</p>
            </div>
          </div>
        </div>

        {/* Product preview card */}
        <div className="anim-pop-in anim-delay-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(2,132,199,0.25)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(2,132,199,0.35)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Good morning, Andi 👋</p>
              <p className="mt-1 text-lg font-bold">Become a Fullstack Developer</p>
            </div>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
              72%
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="anim-grow-bar h-full w-[72%] rounded-full bg-gradient-to-r from-sky-400 to-sky-500" />
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Your career journey
          </p>
          <div className="mt-3 flex items-center">
            {JOURNEY.map((m, i) => (
              <div key={m.label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={
                      m.state === "current"
                        ? "pulse-dot flex h-7 w-7 items-center justify-center rounded-full bg-sky-400 text-white ring-4 ring-sky-100"
                        : m.state === "done"
                          ? "flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600"
                          : "flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                    }
                  >
                    {m.state === "done" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-current" />
                    )}
                  </span>
                  <span
                    className={`hidden text-[10px] font-medium sm:block ${
                      m.state === "current" ? "text-sky-700" : "text-slate-500"
                    }`}
                  >
                    {m.label}
                  </span>
                </div>
                {i < JOURNEY.length - 1 && (
                  <div
                    className={`mx-1 mb-5 h-0.5 flex-1 rounded ${
                      m.state === "done" ? "bg-sky-200" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Your next steps
          </p>
          <ul className="mt-2 space-y-2">
            {NEXT_STEPS.map((t) => (
              <li
                key={t.title}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/60 hover:shadow-sm"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    t.done
                      ? "border-sky-400 bg-sky-400 text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-medium ${
                      t.done ? "text-slate-400 line-through" : "text-slate-800"
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="truncate text-xs text-slate-500">{t.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <p className="text-sm font-semibold text-sky-600">Everything in one place</p>
            <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
              A calm toolkit for your entire career journey
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
            No HR bloat. No XP, badges, or streaks. Just clear progress, focus,
            and growth. Designed to be opened every day.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 90}>
                <div className="group h-full rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-[0_16px_40px_-12px_rgba(2,132,199,0.3)]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600 transition duration-300 group-hover:rotate-6 group-hover:bg-sky-400 group-hover:text-white">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section id="journey" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-500 hover:shadow-[0_16px_40px_-16px_rgba(2,132,199,0.3)] sm:p-10">
          <p className="text-sm font-semibold text-sky-600">Your career journey</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            What am I trying to achieve? What&apos;s next? How far have I come?
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { t: "Set a goal", d: "Pick one clear direction, like landing your first developer role." },
              { t: "Take the next step", d: "Break it into projects and small tasks you can finish today." },
              { t: "Watch progress grow", d: "See milestones light up from Profile Ready to Offer." },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 100}>
                <div className="h-full rounded-xl bg-slate-50 p-5 transition duration-300 hover:-translate-y-1 hover:bg-sky-50">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-400 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Link
            href="/register"
            className="group mt-8 inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            Start with your first goal
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Built like a companion, not a system
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { t: "Clear, not cluttered", d: "Generous whitespace, subtle borders, and one thing to focus on at a time." },
              { t: "Progress you can feel", d: "Sky-blue milestones and gentle progress bars, never a data-heavy dashboard." },
              { t: "Optimistic by default", d: "Friendly, professional, and encouraging. A product you want to open daily." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 100}>
                <div className="h-full rounded-2xl border border-slate-200 p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <h3 className="mt-3 font-semibold">{c.t}</h3>
                  <p className="mt-1 text-sm text-slate-600">{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="relative mt-10 flex flex-col items-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-sky-400 to-sky-500 px-6 py-12 text-center text-white">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="anim-drift absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
                <div className="anim-drift-late absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
              </div>
              <h2 className="relative max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
                Every goal starts with the next step.
              </h2>
              <p className="relative mt-3 max-w-md text-sm text-sky-50 sm:text-base">
                Create your free account and set your first career goal in under a minute.
              </p>
              <Link
                href="/register"
                className="btn-shine group relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50 hover:shadow-md"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} NextStep. One step at a time.
          </p>
          <div className="flex gap-4 text-xs font-medium text-slate-500">
            <Link href="/login" className="hover:text-sky-600">Log in</Link>
            <Link href="/register" className="hover:text-sky-600">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
