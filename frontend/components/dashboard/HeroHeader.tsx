"use client";

import { ListPlus } from "lucide-react";
import { useMemo } from "react";
import { greetingForHour } from "../../lib/dashboard";

type HeroHeaderProps = {
  username: string;
  onNewTask: () => void;
};

export default function HeroHeader({ username, onNewTask }: HeroHeaderProps) {
  const { dateLabel, greeting } = useMemo(() => {
    const now = new Date();
    const dateLabel = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    return { dateLabel, greeting: greetingForHour(now.getHours()) };
  }, []);

  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
          <span>{dateLabel}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Focused and on track
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {greeting}
          {username ? `, ${username}` : ""}{" "}
          <span className="inline-block transition-transform duration-300 hover:rotate-12">
            👋
          </span>
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Every goal starts with the next step. Keep steady, deliberate
          momentum today.
        </p>
      </div>
      <button
        onClick={onNewTask}
        className="btn-shine inline-flex shrink-0 items-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-md"
      >
        <ListPlus className="h-4 w-4" />
        New Task
      </button>
    </div>
  );
}
