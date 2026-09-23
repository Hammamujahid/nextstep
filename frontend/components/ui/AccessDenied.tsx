"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccessDenied({ resource }: { resource: string }) {
  return (
    <div className="anim-fade-up rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <ShieldAlert className="h-6 w-6 text-slate-400" />
      </span>
      <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
        No access to {resource}
      </h1>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        Your role in this workspace doesn&apos;t include access to {resource}.
        Ask a workspace admin to update your permissions.
      </p>
      <Link
        href="/dashboard"
        className="mt-5 inline-block rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
