"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, Sparkles, X } from "lucide-react";
import { createWorkspaceApi, type Workspace } from "../../lib/workspaces";

type CreateWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
};

export default function CreateWorkspaceModal({
  open,
  onClose,
  onCreated,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);

  const close = useCallback(() => {
    setName("");
    setDescription("");
    setLoading(false);
    setError(null);
    setDetails([]);
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
    setDetails([]);

    if (name.trim().length < 3) {
      setError("Workspace name must be at least 3 characters.");
      return;
    }

    setLoading(true);
    try {
      const workspace = await createWorkspaceApi({
        name: name.trim(),
        description,
      });
      setName("");
      setDescription("");
      onCreated(workspace);
    } catch (err: unknown) {
      const m = err as { message?: string; details?: string[] };
      setError(m.message ?? "Failed to create workspace, please try again.");
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
      aria-label="Create workspace"
    >
      <div
        className="anim-pop-in w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Create workspace
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A new space for goals, projects, and job hunting.
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="modal-workspace-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Workspace name
            </label>
            <input
              id="modal-workspace-name"
              type="text"
              autoFocus
              placeholder="e.g. Personal Career Prep"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label
              htmlFor="modal-workspace-desc"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Description{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="modal-workspace-desc"
              placeholder="What is this workspace for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
