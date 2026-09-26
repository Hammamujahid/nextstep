"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Check,
  ChevronRight,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Menu,
  Search,
  Target,
  Users,
  X,
} from "lucide-react";
import Logo from "../components/Logo";
import Reveal from "../components/Reveal";
import { sessionActive } from "../lib/auth";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
];

const STATS = [
  { value: "6-in-1", label: "career toolkit" },
  { value: "4", label: "track types" },
  { value: "100%", label: "yours, no HR bloat" },
  { value: "Calm", label: "by design" },
];

const STEPS = [
  {
    n: "01",
    t: "Set one clear goal",
    d: "Pick a direction — landing your first developer role, shipping a portfolio, switching stacks.",
  },
  {
    n: "02",
    t: "Break it into next steps",
    d: "Turn the goal into projects, tasks, and applications you can finish today.",
  },
  {
    n: "03",
    t: "Watch progress compound",
    d: "Every check-off moves the bar. Momentum you can see, daily.",
  },
];

function MockWindow() {
  // cerminan tampilan dashboard sekarang: sapaan + progres goal + baris tugas
  // dengan pill priority, pill status, dan avatar assignee
  const tasks = [
    { t: "Apply to 3 frontend roles", priority: "High", pStyle: "bg-red-50 text-red-500", status: "In Progress", sStyle: "bg-blue-50 text-blue-500", assignee: "T", done: false },
    { t: "Finish portfolio hero section", priority: "High", pStyle: "bg-red-50 text-red-500", status: "To Do", sStyle: "bg-slate-100 text-slate-500", assignee: "T", done: false },
    { t: "Update CV with latest project", priority: "Medium", pStyle: "bg-orange-50 text-orange-500", status: "Completed", sStyle: "bg-emerald-50 text-emerald-600", assignee: "S", done: true },
  ];
  const nav = [LayoutDashboard, Target, ListChecks, FolderKanban, Briefcase, Users];
  return (
    <div className="relative">
      {/* floating badges */}
      <div className="anim-float absolute -left-4 top-10 z-10 hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur sm:flex lg:-left-10">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <Briefcase className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-xs font-bold text-slate-900">Interview Friday</span>
          <span className="block text-[11px] text-slate-500">Stripe · 2:00 PM</span>
        </span>
      </div>
      <div className="anim-float-slow absolute -right-4 bottom-10 z-10 hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur sm:flex lg:-right-10">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
          <Target className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-xs font-bold text-slate-900">Goal at 72%</span>
          <span className="block text-[11px] text-slate-500">Fullstack Developer</span>
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-20px_rgba(2,132,199,0.35)]">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-3 hidden flex-1 items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-[11px] text-slate-400 ring-1 ring-slate-200 sm:flex">
            <Search className="h-3 w-3" />
            nextstep.app/dashboard
          </span>
          <Bell className="ml-auto h-4 w-4 text-slate-300 sm:ml-0" />
        </div>
        <div className="grid sm:grid-cols-[56px_1fr]">
          {/* mini sidebar */}
          <div className="hidden flex-col items-center gap-1.5 border-r border-slate-100 bg-slate-50/50 py-4 sm:flex">
            {nav.map((Icon, i) => (
              <span
                key={i}
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  i === 0 ? "bg-blue-500 text-white shadow-sm" : "text-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
          {/* mini content */}
          <div className="p-4 text-left sm:p-5">
            <p className="text-sm font-bold text-slate-900">Good morning, Tila</p>
            <p className="mt-0.5 text-xs text-slate-400">Here&apos;s what&apos;s happening with your work today.</p>
            <div className="mt-3 rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-[13px] font-semibold text-slate-800">
                  Become a Fullstack Developer
                </p>
                <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700">
                  72%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="anim-grow-bar h-full w-[72%] rounded-full bg-gradient-to-r from-sky-400 to-sky-500" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {tasks.map((t) => (
                <div
                  key={t.t}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      t.done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 bg-white text-transparent"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[13px] font-medium ${
                        t.done ? "text-slate-400 line-through" : "text-slate-800"
                      }`}
                    >
                      {t.t}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <span className={`rounded-full px-2 py-px text-[10px] font-medium ${t.pStyle}`}>
                        {t.priority}
                      </span>
                      <span className={`rounded-full px-2 py-px text-[10px] font-medium ${t.sStyle}`}>
                        {t.status}
                      </span>
                    </span>
                  </span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
                    {t.assignee}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Target,
    tint: "bg-sky-100 text-sky-600",
    title: "Goals with real progress",
    desc: "Define where you're headed and watch the bar move as tasks and projects complete.",
    visual: (
      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <div className="flex justify-between text-[11px] font-semibold">
          <span className="text-slate-600">Fullstack Developer</span>
          <span className="text-sky-600">72%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/70">
          <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-sky-400 to-sky-500" />
        </div>
      </div>
    ),
  },
  {
    icon: ListChecks,
    tint: "bg-emerald-100 text-emerald-600",
    title: "Tasks, prioritized",
    desc: "Your next steps sorted by what matters — check things off and keep momentum.",
    visual: (
      <div className="mt-4 space-y-1.5">
        {["Apply to 3 roles", "Mock interview"].map((t, i) => (
          <div key={t} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700">
            <span className={`flex h-4 w-4 items-center justify-center rounded border ${i === 1 ? "border-sky-400 bg-sky-400 text-white" : "border-slate-300 bg-white text-transparent"}`}>
              <Check className="h-2.5 w-2.5" />
            </span>
            <span className={i === 1 ? "text-slate-400 line-through" : ""}>{t}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: FolderKanban,
    tint: "bg-violet-100 text-violet-600",
    title: "Portfolio projects",
    desc: "Turn goals into portfolio-ready builds with clear status and task counts.",
    visual: (
      <div className="mt-4 flex gap-1.5">
        {["Planning", "Building", "Done"].map((s, i) => (
          <span key={s} className={`flex-1 rounded-lg px-2 py-1.5 text-center text-[11px] font-semibold ${i === 1 ? "bg-sky-400 text-white" : "bg-slate-100 text-slate-500"}`}>
            {s}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: Briefcase,
    tint: "bg-amber-100 text-amber-600",
    title: "Application pipeline",
    desc: "Every application from wishlist to offer, with interviews never missed.",
    visual: (
      <div className="mt-4 flex items-center gap-1">
        {["Wishlist", "Applied", "Interview", "Offer"].map((s, i) => (
          <span key={s} className="flex flex-1 items-center gap-1 last:flex-none">
            <span className={`h-2 w-2 rounded-full ${i <= 2 ? "bg-amber-400" : "bg-slate-200"}`} />
            {i < 3 && <span className={`h-px flex-1 ${i < 2 ? "bg-amber-300" : "bg-slate-200"}`} />}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: Users,
    tint: "bg-rose-100 text-rose-600",
    title: "Workspaces",
    desc: "Collaborate with mentors or peers — per-resource roles, no HR complexity.",
    visual: (
      <div className="mt-4 flex items-center">
        {["AK", "SJ", "+3"].map((t, i) => (
          <span key={t} className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white ${i === 0 ? "bg-sky-400 text-white" : i === 1 ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"} ${i > 0 ? "-ml-2" : ""}`}>
            {t}
          </span>
        ))}
        <span className="ml-2 text-[11px] font-medium text-slate-400">viewer · editor</span>
      </div>
    ),
  },
  {
    icon: FileText,
    tint: "bg-slate-200 text-slate-600",
    title: "Progress at a glance",
    desc: "Today's tasks, overall completion, and recent activity — one dashboard to start the day.",
    visual: (
      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <div className="flex justify-between text-[11px] font-semibold">
          <span className="text-slate-600">Today&apos;s progress</span>
          <span className="text-sky-600">5/8 done</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/70">
          <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-sky-400 to-sky-500" />
        </div>
      </div>
    ),
  },
];

export default function LandingPage() {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // sudah login (belum logout) -> langsung buka dashboard workspace aktif
  useEffect(() => {
    let alive = true;
    sessionActive().then((ok) => {
      if (!alive) return;
      if (ok) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    });
    return () => {
      alive = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar */}
      <header className="anim-fade-in sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
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
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="group inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
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
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="anim-drift absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="anim-drift-late absolute -left-24 top-40 h-72 w-72 rounded-full bg-sky-50 blur-3xl" />
          <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-emerald-50 blur-3xl" />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgb(15 23 42 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(15 23 42 / 0.05) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 text-center sm:px-6 lg:pt-24">
          <span className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-sky-700 shadow-sm backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            </span>
            Career companion for developers
          </span>
          <h1 className="anim-fade-up anim-delay-1 mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
            Every goal starts with the{" "}
            <span className="bg-gradient-to-r from-sky-500 to-sky-400 bg-clip-text text-transparent">
              next step.
            </span>
          </h1>
          <p className="anim-fade-up anim-delay-2 mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Goals, projects, tasks, and job applications — organized in one
            calm workspace built for developers chasing their next role.
          </p>
          <div className="anim-fade-up anim-delay-3 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="btn-shine group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
            >
              Start free today
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700 sm:w-auto"
            >
              Log in to dashboard
            </Link>
          </div>

          <div className="anim-fade-up anim-delay-4 mx-auto mt-12 max-w-4xl">
            <MockWindow />
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-slate-200/70 bg-slate-50/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div className="text-center">
                <p className="text-3xl font-bold tracking-tight text-slate-900">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features bento */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <p className="text-center text-sm font-semibold text-sky-600">Everything in one place</p>
          <h2 className="mx-auto mt-2 max-w-xl text-center text-2xl font-bold tracking-tight sm:text-4xl">
            A calm toolkit for your entire journey
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
            No HR bloat. No streaks or badges. Just clear progress, focus, and growth.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <div className="group h-full rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-[0_16px_40px_-12px_rgba(2,132,199,0.3)]">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition duration-300 group-hover:scale-110 ${f.tint}`}>
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.desc}</p>
                {f.visual}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-slate-200/70 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <Reveal>
            <p className="text-sm font-semibold text-sky-600">How it works</p>
            <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight sm:text-4xl">
              From fuzzy ambition to daily motion
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <span className="pointer-events-none absolute -right-2 -top-4 select-none text-[88px] font-bold leading-none text-slate-100">
                    {i + 1}
                  </span>
                  <p className="font-mono text-xs font-bold tracking-widest text-sky-500">{s.n}</p>
                  <h3 className="mt-2 font-semibold">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-8 text-center">
              <Link
                href="/register"
                className="group inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
              >
                Start with your first goal
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-14 text-center sm:px-12 lg:py-20">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="anim-drift absolute -left-20 -top-20 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
              <div className="anim-drift-late absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgb(255 255 255 / 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.25) 1px, transparent 1px)",
                  backgroundSize: "36px 36px",
                  maskImage: "radial-gradient(ellipse 60% 80% at 50% 50%, black 30%, transparent 100%)",
                  WebkitMaskImage: "radial-gradient(ellipse 60% 80% at 50% 50%, black 30%, transparent 100%)",
                }}
              />
            </div>
            <h2 className="relative mx-auto max-w-xl text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Open it every morning. Grow every day.
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-sm text-slate-300 sm:text-base">
              Create your free account and set your first career goal in under a minute.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="btn-shine group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50 sm:w-auto"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto"
              >
                Log in
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center sm:px-6">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} NextStep. One step at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
