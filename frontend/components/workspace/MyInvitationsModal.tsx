"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, MailOpen, X } from "lucide-react";
import type { MyInvitation } from "../../lib/workspaces";
import PermissionTags from "../members/PermissionTags";

type MyInvitationsModalProps = {
  open: boolean;
  invitations: MyInvitation[];
  onAccept: (id: number) => Promise<void>;
  onDecline: (id: number) => Promise<void>;
  onClose: () => void;
};

export default function MyInvitationsModal({
  open,
  invitations,
  onAccept,
  onDecline,
  onClose,
}: MyInvitationsModalProps) {
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

  async function handle(id: number, fn: (id: number) => Promise<void>) {
    setBusyId(id);
    try {
      await fn(id);
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
      aria-label="Workspace invitations"
    >
      <div
        className="anim-pop-in m-auto w-full max-w-lg clay p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MailOpen className="h-5 w-5 text-sky-500" />
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Workspace invitations
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
        <p className="mt-1 text-sm text-slate-500">
          You have been invited to join these workspaces as member.
        </p>

        <ul className="mt-4 space-y-2">
          {invitations.map((inv) => {
            const busy = busyId === inv.id;
            return (
              <li
                key={inv.id}
                className="rounded-xl bg-slate-50 px-3.5 py-3"
              >
                <p className="truncate text-sm font-bold text-slate-800">
                  {inv.workspace_name}
                </p>
                <PermissionTags invitation={inv} className="mt-1.5" />
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => void handle(inv.id, onDecline)}
                    disabled={busy}
                    className="flex-1 clay-sm px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => void handle(inv.id, onAccept)}
                    disabled={busy}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    )}
                    Accept & join
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body
  );
}
