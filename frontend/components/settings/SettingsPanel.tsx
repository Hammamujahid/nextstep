"use client";

import Image from "next/image";
import { useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Pencil, ShieldCheck } from "lucide-react";
import { useDashboard } from "../dashboard/DashboardProvider";
import { updateProfileApi } from "../../lib/auth";
import ChangePasswordModal from "./ChangePasswordModal";

export default function SettingsPanel() {
  const { profile, refreshProfile } = useDashboard();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [pwOpen, setPwOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function startEdit() {
    setUsername(profile.username);
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
    if (nextUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (nextUsername === profile.username) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await updateProfileApi({ username: nextUsername });
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
    "w-full clay-sm px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
  const initial = (profile.username.trim().charAt(0) || "?").toUpperCase();

  return (
    <div className="anim-fade-up flex w-full flex-col gap-5">
      {/* kartu identitas */}
      <section className="clay overflow-hidden p-0">
        <div className="bg-gradient-to-r from-sky-400 via-sky-500 to-blue-500 px-6 pb-10 pt-6 sm:px-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
            Account
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-white">
            Profile settings
          </h2>
        </div>
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-8 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile.photo ? (
                <Image
                  src={profile.photo}
                  alt={profile.username || "Profile photo"}
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] rounded-3xl border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <span className="flex h-[72px] w-[72px] items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-sky-400 to-blue-600 text-2xl font-extrabold text-white shadow-lg">
                  {initial}
                </span>
              )}
              <div className="min-w-0 pb-1">
                <p className="truncate text-lg font-extrabold text-slate-900">
                  {profile.username || "-"}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {profile.email || "-"}
                </p>
              </div>
            </div>
            {!editing && (
              <button
                onClick={startEdit}
                className="clay-btn inline-flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-sky-700"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit profile
              </button>
            )}
          </div>

          {error && (
            <div className="anim-slide-down mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
              <p className="flex items-start gap-2 font-medium">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            </div>
          )}
          {success && (
            <div className="anim-slide-down mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
              <p className="flex items-start gap-2 font-medium">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {success}
              </p>
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="settings-username"
                  className="mb-1.5 block text-[13px] font-semibold text-slate-700"
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="clay-btn flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-shine inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="clay-inset px-4 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Username
                </dt>
                <dd className="mt-0.5 truncate text-sm font-bold text-slate-800">
                  {profile.username || "-"}
                </dd>
              </div>
              <div className="clay-inset px-4 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Email
                </dt>
                <dd className="mt-0.5 truncate text-sm font-bold text-slate-800">
                  {profile.email || "-"}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      {/* kartu keamanan */}
      <section className="clay flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-3.5">
          <span className="clay-icon h-11 w-11 shrink-0 bg-gradient-to-br from-sky-400 to-blue-600">
            <ShieldCheck className="h-5 w-5 text-white" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Password</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Ganti password secara berkala untuk menjaga keamanan akun.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setError(null);
            setSuccess(null);
            setPwOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-sky-600"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Change password
        </button>
      </section>

      {pwOpen && (
        <ChangePasswordModal
          onClose={() => setPwOpen(false)}
          onSaved={() => {
            setPwOpen(false);
            setError(null);
            setSuccess("Password changed successfully.");
          }}
        />
      )}
    </div>
  );
}
