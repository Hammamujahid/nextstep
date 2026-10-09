"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { changePasswordApi } from "../../lib/auth";

// Modal ganti password mandiri: password lama + password baru + konfirmasi.
// Validasi ringan di client (panjang + kecocokan); validasi asli di backend.
export default function ChangePasswordModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    if (!saving) onClose();
  }, [onClose, saving]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  async function handleSave() {
    setError(null);
    if (!current) {
      setError("Please enter your current password.");
      return;
    }
    if (next.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New password confirmation does not match.");
      return;
    }
    setSaving(true);
    try {
      await changePasswordApi({ current_password: current, new_password: next });
      onSaved();
    } catch (err: unknown) {
      const m = err as { message?: string };
      setError(m.message ?? "Failed to change password, please try again.");
    } finally {
      setSaving(false);
    }
  }

  const labelCls = "mb-1.5 block text-[13px] font-semibold text-slate-700";
  const inputCls =
    "h-10 w-full clay-sm px-3 pr-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

  function PasswordField({
    id,
    label,
    value,
    onChange,
    show,
    onToggleShow,
    placeholder,
    autoFocus,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggleShow: () => void;
    placeholder: string;
    autoFocus?: boolean;
  }) {
    return (
      <div>
        <label htmlFor={id} className={labelCls}>
          {label}
        </label>
        <div className="relative">
          <input
            id={id}
            type={show ? "text" : "password"}
            autoComplete={id === "pw-current" ? "current-password" : "new-password"}
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
            placeholder={placeholder}
            className={inputCls}
          />
          <button
            type="button"
            onClick={onToggleShow}
            aria-label={show ? `Hide ${label}` : `Show ${label}`}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    );
  }

  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Change password"
    >
      <div
        className="anim-pop-in m-auto w-full max-w-md clay p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="clay-icon h-9 w-9 bg-gradient-to-br from-sky-400 to-sky-600">
              <KeyRound className="h-4 w-4 text-white" />
            </span>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Change password
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

        {error && (
          <p className="anim-slide-down mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-3.5">
          <PasswordField
            id="pw-current"
            label="Current password"
            value={current}
            onChange={setCurrent}
            show={showCurrent}
            onToggleShow={() => setShowCurrent((v) => !v)}
            placeholder="Your current password"
            autoFocus
          />
          <PasswordField
            id="pw-new"
            label="New password"
            value={next}
            onChange={setNext}
            show={showNext}
            onToggleShow={() => setShowNext((v) => !v)}
            placeholder="Min. 6 characters"
          />
          <PasswordField
            id="pw-confirm"
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            show={showNext}
            onToggleShow={() => setShowNext((v) => !v)}
            placeholder="Repeat new password"
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={close}
            disabled={saving}
            className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="btn-shine inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save password"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
