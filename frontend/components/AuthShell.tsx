import Link from "next/link";
import { Briefcase, Check, Flame } from "lucide-react";
import Logo from "./Logo";

const MINI_JOURNEY = [
  { label: "Profile", state: "done" },
  { label: "Portfolio", state: "done" },
  { label: "Apply", state: "current" },
  { label: "Interview", state: "next" },
  { label: "Offer", state: "next" },
] as const;

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      {/* Left branding panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-sky-700 via-sky-600 to-sky-400 p-10 text-white lg:flex">
        {/* Decorative background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="anim-drift absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
          <div className="anim-drift-late absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl" />
          <div className="anim-float-slow absolute right-16 top-24 h-24 w-24 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm" />
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage:
                "linear-gradient(to bottom, black, transparent 75%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black, transparent 75%)",
            }}
          />
        </div>

        <div className="anim-fade-in relative">
          <Logo tone="light" />
        </div>

        <div className="relative">
          <span className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            One step at a time
          </span>
          <h2 className="anim-fade-up anim-delay-1 mt-4 max-w-md text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
            Every goal starts with the next step.
          </h2>
          <p className="anim-fade-up anim-delay-2 mt-3 max-w-md text-sm leading-relaxed text-sky-50">
            Track goals, projects, tasks, job applications, and documents in
            one calm workspace.
          </p>

          {/* Floating product preview */}
          <div className="anim-fade-up anim-delay-3 relative mt-8 max-w-md">
            {/* Main goal card */}
            <div className="anim-float-slow rounded-2xl border border-white/25 bg-white/15 p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-sky-100">Good morning, Andi 👋</p>
                  <p className="mt-1 font-bold">Become a Fullstack Developer</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-sky-700">
                  72%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
                <div className="anim-grow-bar h-full w-[72%] rounded-full bg-white" />
              </div>
              <div className="mt-4 flex items-center">
                {MINI_JOURNEY.map((m, i) => (
                  <div
                    key={m.label}
                    className="flex flex-1 items-center last:flex-none"
                  >
                    <span
                      className={
                        m.state === "current"
                          ? "pulse-dot flex h-5 w-5 items-center justify-center rounded-full bg-white"
                          : m.state === "done"
                            ? "flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-sky-600"
                            : "flex h-5 w-5 items-center justify-center rounded-full bg-white/25"
                      }
                    >
                      {m.state === "done" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            m.state === "current" ? "bg-sky-500" : "bg-white/70"
                          }`}
                        />
                      )}
                    </span>
                    {i < MINI_JOURNEY.length - 1 && (
                      <div
                        className={`mx-1 h-0.5 flex-1 rounded ${
                          m.state === "done" ? "bg-white/80" : "bg-white/25"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Floating task chip */}
            <div className="anim-float absolute -right-4 -top-5 flex rotate-2 items-center gap-2.5 rounded-xl border border-white/40 bg-white px-3.5 py-2.5 text-slate-800 shadow-lg">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-400 text-white">
                <Check className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-semibold">Portfolio finished</p>
                <p className="text-[11px] text-slate-500">Just now • +8% progress</p>
              </div>
            </div>

            {/* Floating interview chip */}
            <div className="anim-float-slow absolute -bottom-5 -left-3 flex -rotate-2 items-center gap-2.5 rounded-xl border border-white/40 bg-white px-3.5 py-2.5 text-slate-800 shadow-lg">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-600">
                <Briefcase className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-semibold">Interview invited</p>
                <p className="text-[11px] text-slate-500">TechCorp • Friday 10:00</p>
              </div>
            </div>
          </div>

          <p className="anim-fade-up anim-delay-4 mt-10 flex items-center gap-2 text-xs text-sky-100">
            <Flame className="h-3.5 w-3.5" />
            Join thousands turning small steps into offers.
          </p>
        </div>

        <p className="anim-fade-in anim-delay-5 relative text-xs text-sky-100">
          © {new Date().getFullYear()} NextStep. Your personal career companion.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <div className="anim-fade-in lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="anim-pop-in w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_-12px_rgba(2,132,199,0.25)] sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 lg:hidden">
          © {new Date().getFullYear()} NextStep
        </p>
      </div>
    </div>
  );
}

export function AuthFooter({ text, linkText, href }: { text: string; linkText: string; href: string }) {
  return (
    <p className="mt-6 text-center text-sm text-slate-600">
      {text}{" "}
      <Link href={href} className="font-semibold text-sky-600 hover:text-sky-700">
        {linkText}
      </Link>
    </p>
  );
}
