"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Menu,
  Plus,
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

const STEPS = [
  {
    n: "01",
    t: "Set one clear goal",
    d: "Pick a direction: landing your first developer role, shipping a portfolio, or switching stacks.",
  },
  {
    n: "02",
    t: "Break it into next steps",
    d: "Turn the goal into projects, tasks, and applications you can actually finish today.",
  },
  {
    n: "03",
    t: "Watch progress compound",
    d: "Every check-off moves the bar forward. Momentum you can finally see.",
  },
];

// Mockup meniru tampilan dashboard asli (Claymorphism): mini sidebar,
// sapaan + ringkasan, kartu stat, lalu tabel tugas dengan pill dan avatar.
function MockWindow() {
  const nav = [LayoutDashboard, Target, ListChecks, FolderKanban, Briefcase, Users];
  const stats = [
    { label: "Tasks", value: "8", tone: "from-indigo-400 to-violet-500" },
    { label: "Goals", value: "3", tone: "from-violet-400 to-fuchsia-500" },
    { label: "Projects", value: "2", tone: "from-sky-400 to-indigo-500" },
  ];
  const tabs = [
    { label: "All", count: 8, active: true },
    { label: "Today", count: 3, active: false },
    { label: "This Week", count: 5, active: false },
  ];
  const tasks = [
    { t: "Apply to 3 frontend roles", priority: "High", p: "bg-rose-100 text-rose-600", status: "In Progress", s: "bg-indigo-100 text-indigo-600", a: "T", done: false },
    { t: "Finish portfolio hero section", priority: "Medium", p: "bg-amber-100 text-amber-600", status: "To Do", s: "bg-slate-100 text-slate-500", a: "T", done: false },
    { t: "Update CV with latest project", priority: "Low", p: "bg-emerald-100 text-emerald-600", status: "Completed", s: "bg-emerald-100 text-emerald-600", a: "S", done: true },
  ];

  return (
    <div className="clay overflow-hidden">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-indigo-100/60 bg-white/40 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 hidden flex-1 items-center gap-1.5 clay-inset px-3 py-1 text-[11px] text-slate-400 sm:flex">
          <Search className="h-3 w-3" />
          nextstep.app/dashboard
        </span>
        <Bell className="ml-auto h-4 w-4 text-slate-300 sm:ml-0" />
      </div>

      <div className="grid sm:grid-cols-[60px_1fr]">
        {/* mini sidebar */}
        <div className="hidden flex-col items-center gap-2 border-r border-indigo-100/60 py-4 sm:flex">
          {nav.map((Icon, i) => (
            <span
              key={i}
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                i === 0
                  ? "clay-nav-active"
                  : "text-slate-400"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
          ))}
        </div>

        {/* mini content */}
        <div className="p-4 text-left sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-extrabold text-slate-800">Welcome back, Tila</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Here&apos;s what&apos;s happening today.
              </p>
            </div>
            <span className="clay-chip flex items-center gap-1.5 bg-white/70 px-2.5 py-1 text-[10px] font-bold text-slate-500">
              <CalendarDays className="h-3 w-3 text-indigo-400" />
              Mon, 8 Sep
            </span>
          </div>

          {/* stat cards */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="clay-sm p-2.5">
                <span className={`clay-icon h-6 w-6 bg-gradient-to-br ${s.tone} text-[10px] font-bold text-white`}>
                  {s.value}
                </span>
                <p className="mt-1.5 text-[10px] font-semibold text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* tasks card */}
          <div className="mt-3 clay-sm p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-extrabold text-slate-800">My Tasks</p>
              <span className="clay-chip flex items-center gap-1 bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white">
                <Plus className="h-2.5 w-2.5" />
                Add
              </span>
            </div>
            <div className="mt-2.5 flex gap-3 border-b border-indigo-100/60 pb-2">
              {tabs.map((t) => (
                <span
                  key={t.label}
                  className={`text-[10px] font-bold ${
                    t.active ? "text-indigo-600" : "text-slate-300"
                  }`}
                >
                  {t.label} {t.count}
                </span>
              ))}
            </div>
            <div className="mt-2 space-y-1.5">
              {tasks.map((t) => (
                <div key={t.t} className="clay-inset flex items-center gap-2 px-2.5 py-2">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md ${
                      t.done ? "bg-emerald-500 text-white" : "bg-white text-transparent"
                    }`}
                  >
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[11px] font-semibold ${
                        t.done ? "text-slate-400 line-through" : "text-slate-700"
                      }`}
                    >
                      {t.t}
                    </span>
                  </span>
                  <span className={`hidden shrink-0 rounded-full px-2 py-px text-[9px] font-bold sm:inline ${t.p}`}>
                    {t.priority}
                  </span>
                  <span className={`hidden shrink-0 rounded-full px-2 py-px text-[9px] font-bold sm:inline ${t.s}`}>
                    {t.status}
                  </span>
                  <span className="clay-icon h-5 w-5 shrink-0 bg-gradient-to-br from-indigo-400 to-violet-500 text-[9px] font-bold text-white">
                    {t.a}
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
    tint: "bg-indigo-100 text-indigo-600",
    title: "Goals with real progress",
    desc: "Define where you are headed and watch the bar move as tasks and projects complete.",
    visual: (
      <div className="clay-inset mt-4 p-3">
        <div className="flex justify-between text-[11px] font-semibold">
          <span className="text-slate-600">Fullstack Developer</span>
          <span className="text-indigo-600">72%</span>
        </div>
        <div className="clay-track mt-2 h-2">
          <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" />
        </div>
      </div>
    ),
  },
  {
    icon: ListChecks,
    tint: "bg-emerald-100 text-emerald-600",
    title: "Tasks, prioritized",
    desc: "Your next steps sorted by what matters most. Check things off and keep momentum.",
    visual: (
      <div className="mt-4 space-y-1.5">
        {["Apply to 3 roles", "Mock interview"].map((t, i) => (
          <div key={t} className="clay-inset flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700">
            <span className={`flex h-4 w-4 items-center justify-center rounded ${i === 1 ? "bg-indigo-500 text-white" : "bg-white text-transparent"}`}>
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
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
          <span key={s} className={`flex-1 rounded-xl px-2 py-1.5 text-center text-[11px] font-semibold ${i === 1 ? "bg-indigo-500 text-white" : "clay-inset text-slate-500"}`}>
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
    desc: "Every application from wishlist to offer, with interviews you never miss.",
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
    desc: "Collaborate with mentors or peers, with per-resource roles and no HR complexity.",
    visual: (
      <div className="mt-4 flex items-center">
        {["AK", "SJ", "+3"].map((t, i) => (
          <span key={t} className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white ${i === 0 ? "bg-indigo-500 text-white" : i === 1 ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"} ${i > 0 ? "-ml-2" : ""}`}>
            {t}
          </span>
        ))}
        <span className="ml-2 text-[11px] font-medium text-slate-400">viewer, editor</span>
      </div>
    ),
  },
  {
    icon: LayoutDashboard,
    tint: "bg-slate-200 text-slate-600",
    title: "Progress at a glance",
    desc: "Today's tasks, overall completion, and recent activity in one morning dashboard.",
    visual: (
      <div className="clay-inset mt-4 p-3">
        <div className="flex justify-between text-[11px] font-semibold">
          <span className="text-slate-600">Today&apos;s progress</span>
          <span className="text-indigo-600">5/8 done</span>
        </div>
        <div className="clay-track mt-2 h-2">
          <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" />
        </div>
      </div>
    ),
  },
];

export default function LandingPage() {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  // navbar transparan saat di paling atas, beri background setelah discroll
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-900">
      {/* Navbar */}
      <header
        className={`anim-fade-in sticky top-0 z-40 transition-colors duration-300 ${
          scrolled || open
            ? "border-b border-indigo-100/70 bg-white/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/login" className="clay-btn px-4 py-2 text-sm font-bold text-slate-600">
              Log in
            </Link>
            <Link
              href="/register"
              className="clay-btn-primary group inline-flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              Register
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="clay-btn rounded-xl p-2 text-slate-600 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="anim-slide-down border-t border-indigo-100/70 bg-white/95 px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-indigo-50"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex gap-2">
                <Link
                  href="/login"
                  className="clay-btn flex-1 px-4 py-2 text-center text-sm font-bold text-slate-600"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="clay-btn-primary flex-1 px-4 py-2 text-center text-sm"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="anim-drift absolute -top-48 -left-40 h-[30rem] w-[44rem] rounded-full bg-[#efe9ff]/70 blur-3xl" />
          <div className="anim-drift-late absolute left-1/3 top-40 h-72 w-72 rounded-full bg-indigo-100/40 blur-3xl" />
          <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-indigo-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 text-left sm:px-6 lg:pt-20">
          <h1 className="anim-fade-up max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-800 sm:text-6xl">
            Every goal starts with the{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              next step.
            </span>
          </h1>
          <p className="anim-fade-up anim-delay-1 mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
            Goals, projects, tasks, and job applications all live in one calm
            workspace, built for developers chasing their next role.
          </p>
          <div className="anim-fade-up anim-delay-2 mt-8 flex justify-start">
            <Link
              href="/login"
              className="clay-btn-primary group inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="anim-fade-up anim-delay-3 mx-auto mt-36 max-w-3xl">
            <MockWindow />
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <p className="text-center text-sm font-bold text-indigo-600">Everything in one place</p>
          <h2 className="mx-auto mt-2 max-w-xl text-center text-2xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
            A calm toolkit for your whole journey
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
            No HR bloat and no noisy badges. Just clear progress, focus, and calm momentum.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <div className="group h-full clay p-5 transition duration-300 hover:-translate-y-1.5">
                <span className={`clay-icon h-11 w-11 transition duration-300 group-hover:scale-110 ${f.tint}`}>
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-extrabold text-slate-800">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                {f.visual}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-sm font-bold text-indigo-600">How it works</p>
            <h2 className="mt-2 max-w-xl text-2xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
              From fuzzy ambition to daily motion
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative h-full clay overflow-hidden p-6 transition duration-300 hover:-translate-y-1">
                  <span className="pointer-events-none absolute -right-1 -top-4 select-none text-[86px] font-extrabold leading-none text-indigo-50">
                    {i + 1}
                  </span>
                  <p className="font-mono text-xs font-bold tracking-widest text-indigo-500">{s.n}</p>
                  <h3 className="mt-2 font-extrabold text-slate-800">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-10 text-center">
              <Link
                href="/register"
                className="group inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
              >
                Start with your first goal
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
        <Reveal>
          <div className="relative overflow-hidden clay px-6 py-14 text-center sm:px-12 lg:py-16">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="anim-drift absolute -left-16 -top-20 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl" />
              <div className="anim-drift-late absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-fuchsia-300/25 blur-3xl" />
            </div>
            <span className="clay-icon mx-auto h-14 w-14 bg-gradient-to-br from-indigo-400 to-violet-500">
              <Target className="h-7 w-7 text-white" />
            </span>
            <h2 className="relative mx-auto mt-5 max-w-xl text-2xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
              Open it every morning. Grow every day.
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-sm text-slate-500 sm:text-base">
              Create your free account and set your first career goal in under a minute.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="clay-btn-primary group inline-flex w-full items-center justify-center gap-2 px-7 py-3.5 text-sm sm:w-auto"
              >
                Create your account
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="clay-btn inline-flex w-full items-center justify-center px-7 py-3.5 text-sm font-bold text-slate-600 sm:w-auto"
              >
                Log in
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-6xl border-t border-indigo-100/70 px-4 py-6 text-center">
          <p className="text-xs font-medium text-slate-400">
            © {new Date().getFullYear()} NextStep. One step at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}