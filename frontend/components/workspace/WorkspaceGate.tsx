"use client";

import { useState } from "react";
import { AlertCircle, FolderKanban, Loader2, LogOut, Sparkles } from "lucide-react";
import Logo from "../Logo";
import { createWorkspaceApi, type Workspace } from "../../lib/workspaces";

type WorkspaceGateProps = {
  username: string;
  onCreated: (workspace: Workspace) => void;
  onLogout: () => void;
  loggingOut: boolean;
};

export default function WorkspaceGate({
  username,
  onCreated,
  onLogout,
  loggingOut,
}: WorkspaceGateProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="anim-drift absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="anim-drift-late absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-sky-100 blur-3xl" />
      </div>

      <div className="anim-pop-in relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_8px_30px_-12px_rgba(2,132,199,0.25)] sm:p-8">
        <div className="mx-auto w-fit">
          <Logo />
        </div>

        <span className="anim-float mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
          <FolderKanban className="h-7 w-7" />
        </span>

        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Welcome{username ? `, ${username}` : ""} 👋
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
          One last setup. Create your first workspace to keep your goals,
          projects, tasks, and job applications organized in one place.
        </p>

        {error && (
          <div className="anim-slide-down mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-left text-sm text-red-800">
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
          <div>
            <label
              htmlFor="workspace-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Workspace name
            </label>
            <input
              id="workspace-name"
              type="text"
              placeholder="e.g. Personal Career Prep"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label
              htmlFor="workspace-desc"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Description{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="workspace-desc"
              placeholder="What is this workspace for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-shine inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Creating workspace..." : "Create workspace"}
          </button>
        </form>

        <button
          onClick={onLogout}
          disabled={loggingOut}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-600 disabled:opacity-70"
        >
          {loggingOut ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          {loggingOut ? "Logging out..." : "Log out instead"}
        </button>
      </div>
    </div>
  );
}
