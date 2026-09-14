"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MailPlus,
  X,
} from "lucide-react";
import { inviteMemberApi } from "../../lib/workspaces";

type InviteModalProps = {
  open: boolean;
  workspaceId: number | null;
  workspaceName: string;
  onClose: () => void;
  onInvited: () => void;
};

export default function InviteModal({
  open,
  workspaceId,
  workspaceName,
  onClose,
  onInvited,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const close = useCallback(() => {
    setEmail("");
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
      await inviteMemberApi(workspaceId, email.trim());
      setSuccess(`Invitation sent to ${email.trim()}`);
      setEmail("");
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
        className="anim-pop-in w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
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
