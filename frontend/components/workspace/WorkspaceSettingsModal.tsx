"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save, X } from "lucide-react";
import {
  updateWorkspaceApi,
  type Workspace,
} from "../../lib/workspaces";

type WorkspaceSettingsModalProps = {
  open: boolean;
  workspace: Workspace | null;
  onClose: () => void;
  onUpdated: (workspace: Workspace) => void;
};

export default function WorkspaceSettingsModal({
  open,
  workspace,
  onClose,
  onUpdated,
}: WorkspaceSettingsModalProps) {
  const [name, setName] = useState(workspace?.name ?? "");
  const [description, setDescription] = useState(workspace?.description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const close = useCallback(() => {
    setLoading(false);
    setError(null);
    setDetails([]);
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

  if (!open || !workspace) return null;

  const isAdmin = workspace.member_role === "admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDetails([]);
    setSuccess(null);

    if (!workspace) return;

    if (name.trim().length < 3) {
      setError("Workspace name must be at least 3 characters.");
      return;
    }

    setLoading(true);
    try {
      const updated = await updateWorkspaceApi(workspace.id, {
        name: name.trim(),
        description,
      });
      setSuccess("Workspace updated successfully.");
      onUpdated({ ...updated, member_role: workspace.member_role });
    } catch (err: unknown) {
      const m = err as { message?: string; details?: string[] };
      setError(m.message ?? "Failed to update workspace, please try again.");
      if (m.details) setDetails(m.details);
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
      aria-label="Workspace settings"
    >
      <div
        className="anim-pop-in w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Workspace settings
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your role:{" "}
              <span className="font-semibold capitalize text-slate-700">
                {workspace.member_role}
              </span>
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
            {details.length > 0 && (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-8 text-[13px]">
                {details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
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

        {!isAdmin && (
          <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-500">
            Only workspace admins can edit these settings.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="ws-settings-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Workspace name
            </label>
            <input
              id="ws-settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={!isAdmin}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
          <div>
            <label
              htmlFor="ws-settings-desc"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Description
            </label>
            <textarea
              id="ws-settings-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={!isAdmin}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              {isAdmin ? "Cancel" : "Close"}
            </button>
            {isAdmin && (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? "Saving..." : "Save changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
