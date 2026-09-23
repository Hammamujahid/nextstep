"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, MailQuestion, UserRound, X } from "lucide-react";
import type { WorkspaceInvitation } from "../../lib/workspaces";
import PermissionTags from "./PermissionTags";

type PendingInvitationsModalProps = {
  open: boolean;
  invitations: WorkspaceInvitation[];
  onCancel: (id: number) => Promise<void>;
  onClose: () => void;
};

export default function PendingInvitationsModal({
  open,
  invitations,
  onCancel,
  onClose,
}: PendingInvitationsModalProps) {
  const [busyId, setBusyId] = useState<number | null>(null);

  const close = useCallback(() => {
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

  async function handleCancel(id: number) {
    setBusyId(id);
    try {
      await onCancel(id);
    } catch (e) {
      console.error("cancel invitation failed", e);
    } finally {
      setBusyId(null);
    }
  }

  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Pending invitations"
    >
      <div
        className="anim-pop-in m-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MailQuestion className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Pending invitations ({invitations.length})
            </h3>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {invitations.length === 0 ? (
          <p className="mt-4 flex items-center gap-2 py-4 text-sm text-slate-400">
            <UserRound className="h-4 w-4" />
            No pending invitations.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="rounded-xl bg-slate-50 px-3.5 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-slate-700">
                    {inv.email}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      Pending
                    </span>
                    <button
                      onClick={() => void handleCancel(inv.id)}
                      disabled={busyId === inv.id}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyId === inv.id && <Loader2 className="h-3 w-3 animate-spin" />}
                      Cancel
                    </button>
                  </span>
                </div>
                <PermissionTags invitation={inv} className="mt-1.5" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body
  );
}
