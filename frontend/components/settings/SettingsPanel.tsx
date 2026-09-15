"use client";

import Image from "next/image";
import { useDashboard } from "../dashboard/DashboardProvider";

export default function SettingsPanel() {
  const { profile, workspaces } = useDashboard();

  return (
    <div className="anim-fade-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-slate-900">Account</h2>
      <p className="mt-1 text-sm text-slate-500">
        Your NextStep profile details.
      </p>
      <div className="mt-5 flex items-center gap-4">
        {profile.photo ? (
          <Image
            src={profile.photo}
            alt={profile.username || "Profile photo"}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-sky-100"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-xl font-bold text-white">
            {(profile.username.trim().charAt(0) || "?").toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900">
            {profile.username || "-"}
          </p>
          <p className="truncate text-sm text-slate-500">
            {profile.email || "-"}
          </p>
        </div>
      </div>
      <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Username</dt>
          <dd className="font-medium text-slate-900">
            {profile.username || "-"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Email</dt>
          <dd className="truncate font-medium text-slate-900">
            {profile.email || "-"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Workspaces joined</dt>
          <dd className="font-medium text-slate-900">{workspaces.length}</dd>
        </div>
      </dl>
    </div>
  );
}