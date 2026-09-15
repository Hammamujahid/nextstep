"use client";

import { useEffect } from "react";
import { Crown, Loader2, MailQuestion, UserRound } from "lucide-react";
import { useDashboard } from "../dashboard/DashboardProvider";

export default function MembersPanel() {
  const {
    members,
    invitations,
    membersLoading,
    loadMembers,
    active,
    openInvite,
  } = useDashboard();

  useEffect(() => {
    if (active) loadMembers(active.id);
  }, [active, loadMembers]);

  if (!active) {
    return (
      <div className="anim-fade-up rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-400">No workspace selected.</p>
      </div>
    );
  }

  return (
    <div className="anim-fade-up space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Members
          </h1>
          <p className="text-sm text-slate-500">
            People with access to {active.name}.
          </p>
        </div>
        <button
          onClick={openInvite}
          className="rounded-xl bg-sky-400 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-sky-500"
        >
          Invite user
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-bold text-slate-900">
          Members ({members.length})
        </h2>
        {membersLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          </div>
        ) : members.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No members found.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                  {(m.username.trim().charAt(0) || "?").toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {m.username}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {m.email}
                  </span>
                </span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    m.member_role === "admin"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {m.member_role === "admin" && <Crown className="h-3 w-3" />}
                  {m.member_role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <MailQuestion className="h-4 w-4 text-slate-400" />
          Pending invitations ({invitations.length})
        </h2>
        {invitations.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <UserRound className="h-4 w-4" />
            No pending invitations.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5"
              >
                <span className="truncate text-sm font-medium text-slate-700">
                  {inv.email}
                </span>
                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Pending
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}