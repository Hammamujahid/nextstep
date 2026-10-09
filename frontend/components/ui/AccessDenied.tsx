"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccessDenied({ resource }: { resource: string }) {
  return (
    <div className="clay anim-fade-up p-10 text-center">
      <span className="clay-icon mx-auto h-14 w-14 bg-gradient-to-br from-rose-100 to-rose-200">
        <ShieldAlert className="h-7 w-7 text-rose-500" />
      </span>
      <h1 className="mt-4 text-xl font-extrabold tracking-tight text-slate-800">
        No access to {resource}
      </h1>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
        Your role in this workspace doesn&apos;t include access to {resource}.
        Ask a workspace admin to update your permissions.
      </p>
      <Link
        href="/dashboard"
        className="clay-btn mt-5 inline-block px-5 py-2.5 text-sm font-bold text-sky-600"
      >
        Back to dashboard
      </Link>
    </div>
  );
}