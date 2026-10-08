"use client";

import Image from "next/image";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { useDashboard } from "../dashboard/DashboardProvider";
import { updateProfileApi } from "../../lib/auth";

export default function SettingsPanel() {
  const { profile, refreshProfile } = useDashboard();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [email, setEmail] = useState(profile.email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function startEdit() {
    setUsername(profile.username);
    setEmail(profile.email);
    setError(null);
    setSuccess(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
    setSuccess(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const nextUsername = username.trim();
    const nextEmail = email.trim();
    if (nextUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const payload: { username?: string; email?: string } = {};
    if (nextUsername !== profile.username) payload.username = nextUsername;
    if (nextEmail !== profile.email) payload.email = nextEmail;
    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await updateProfileApi(payload);
      await refreshProfile();
      setSuccess("Profile updated successfully.");
      setEditing(false);
    } catch (err: unknown) {
      const m = err as { message?: string };
      setError(m.message ?? "Failed to update profile, please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full clay-sm px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="anim-fade-up clay p-6 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Account</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your NextStep profile details.
          </p>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit profile
          </button>
        )}
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

      <div className="mt-5 flex items-center gap-4">
        {profile.photo ? (
          <Image
            src={profile.photo}
            alt={profile.username || "Profile photo"}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-indigo-100"
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

      {editing ? (
        <form onSubmit={handleSave} className="mt-6 space-y-4 border-t border-slate-100 pt-5">
          <div>
            <label
              htmlFor="settings-username"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Username
            </label>
            <input
              id="settings-username"
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={50}
              placeholder="Your username"
              className={inputCls}
            />
          </div>
          <div>
            <label
              htmlFor="settings-email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={100}
              placeholder="you@example.com"
              className={inputCls}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Used for login and workspace invitations.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
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
        </dl>
      )}
    </div>
  );
}
