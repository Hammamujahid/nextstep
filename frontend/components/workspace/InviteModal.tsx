"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MailPlus,
  X,
} from "lucide-react";
import { inviteMemberApi, type InvitePermissions, type PermissionValue } from "../../lib/workspaces";

type InviteModalProps = {
  open: boolean;
  workspaceId: number | null;
  workspaceName: string;
  onClose: () => void;
  onInvited: () => void;
};

const RESOURCES: { key: keyof InvitePermissions; label: string }[] = [
  { key: "project", label: "Project" },
  { key: "task", label: "Task" },
  { key: "goal", label: "Goal" },
  { key: "job_application", label: "Job Application" },
];

const PERM_OPTIONS: { value: PermissionValue; label: string; active: string }[] = [
  { value: "none", label: "None", active: "bg-slate-500 text-white border-slate-500" },
  { value: "viewer", label: "Viewer", active: "bg-sky-500 text-white border-sky-400" },
  { value: "editor", label: "Editor", active: "bg-emerald-500 text-white border-emerald-500" },
];

const DEFAULT_PERMS: InvitePermissions = {
  project: "viewer",
  task: "viewer",
  goal: "viewer",
  job_application: "viewer",
};

export default function InviteModal({
  open,
  workspaceId,
  workspaceName,
  onClose,
  onInvited,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [perms, setPerms] = useState<InvitePermissions>(DEFAULT_PERMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const close = useCallback(() => {
    setEmail("");
    setPerms(DEFAULT_PERMS);
    setLoading(false);
    setError(null);
    setSuccess(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || workspaceId == null) return;

    setLoading(true);
    try {
      await inviteMemberApi(workspaceId, email.trim(), perms);
      setSuccess(`Invitation sent to ${email.trim()}`);
      setEmail("");
      setPerms(DEFAULT_PERMS);
      onInvited();
    } catch (err: unknown) {
      const m = err as { message?: string };
      setError(m.message ?? "Failed to send invitation, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Invite user"
    >
      <div
        className="anim-pop-in w-full max-w-lg clay p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Invite user
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Invite someone to{" "}
              <span className="font-semibold text-slate-700">
                {workspaceName}
              </span>
              .
            </p>
          </div>
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="anim-slide-down mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
            <p className="flex items-start gap-2 font-medium">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          </div>
        )}
        {success && (
          <div className="anim-slide-down mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
            <p className="flex items-start gap-2 font-medium">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {success}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="invite-email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              autoFocus
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full clay-sm px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Access role per resource
            </span>
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              {RESOURCES.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-semibold text-slate-600">
                    {r.label}
                  </span>
                  <div className="flex gap-1.5">
                    {PERM_OPTIONS.map((opt) => {
                      const selected = perms[r.key] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setPerms((prev) => ({ ...prev, [r.key]: opt.value }))
                          }
                          aria-pressed={selected}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                            selected
                              ? opt.active
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Invited user joins as member with the access above.
            </p>
            {perms.task !== "none" && (perms.project === "none" || perms.goal === "none") && (
              <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Tasks linked to {[
                    perms.project === "none" ? "projects" : null,
                    perms.goal === "none" ? "goals" : null,
                  ].filter(Boolean).join(" or ")} will appear with the{" "}
                  {perms.project === "none" && perms.goal === "none" ? "names" : "name"} hidden
                  for this member.
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MailPlus className="h-4 w-4" />
              )}
              {loading ? "Sending..." : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
