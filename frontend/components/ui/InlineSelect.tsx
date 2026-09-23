"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type InlineOption = {
  value: string;
  label: string;
  sub?: string;
  dot?: string;
  avatarName?: string;
  disabled?: boolean;
};

function menuPos(rect: DOMRect, width: number, heightEstimate: number) {
  // menu rata tengah terhadap tombol pemicu, dijepit agar tetap di viewport
  const centerX = rect.left + rect.width / 2;
  const left = Math.max(8, Math.min(centerX - width / 2, window.innerWidth - width - 8));
  if (rect.bottom + heightEstimate > window.innerHeight) {
    return { bottom: window.innerHeight - rect.top + 4, left };
  }
  return { top: rect.bottom + 4, left };
}

function Avatar({ name }: { name: string }) {
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
      {initial}
    </span>
  );
}

// Dropdown kustom pengganti <select> native agar tampil konsisten:
// tombol pill bebas + menu portal yang tidak kepotong tabel/kartu.
export default function InlineSelect({
  value,
  options,
  onChange,
  label,
  buttonClassName = "",
  menuWidth = 176,
}: {
  value: string;
  options: InlineOption[];
  onChange: (value: string) => void;
  label: string;
  buttonClassName?: string;
  menuWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos(menuPos(r, menuWidth, Math.min(options.length * 36 + 16, 300)));
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={`inline-flex items-center gap-1.5 ${buttonClassName}`}
      >
        {selected?.dot && (
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${selected.dot}`} />
        )}
        {selected?.avatarName && <Avatar name={selected.avatarName} />}
        <span className="truncate">{selected?.label ?? ""}</span>
        <ChevronDown
          size={12}
          className={`shrink-0 opacity-60 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open &&
        pos &&
        createPortal(
          <>
            <button
              aria-label="Close menu"
              className="fixed inset-0 z-[90] cursor-default bg-transparent"
              onClick={() => setOpen(false)}
            />
            <div
              role="listbox"
              aria-label={label}
              className="fixed z-[100] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              style={{ top: pos.top, bottom: pos.bottom, left: pos.left, width: menuWidth }}
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => {
                      setOpen(false);
                      if (!opt.disabled && opt.value !== value) onChange(opt.value);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition disabled:cursor-default ${
                      isSelected
                        ? "bg-sky-50 font-semibold text-sky-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {opt.dot && <span className={`h-2 w-2 shrink-0 rounded-full ${opt.dot}`} />}
                    {opt.avatarName && <Avatar name={opt.avatarName} />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{opt.label}</span>
                      {opt.sub && (
                        <span className="block truncate text-[10px] font-normal text-slate-400">
                          {opt.sub}
                        </span>
                      )}
                    </span>
                    {isSelected && <Check size={14} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
