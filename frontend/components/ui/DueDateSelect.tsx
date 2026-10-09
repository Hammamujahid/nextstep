"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown } from "lucide-react";

function splitISO(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { date: `${y}-${m}-${day}`, time: `${hh}:${mm}` };
}

// Dropdown inline untuk due date: tombol teks + menu portal rata tengah
// terhadap tombol (sama seperti InlineSelect), berisi input date/time.
export default function DueDateSelect({
  valueISO,
  display,
  onChange,
  canEdit = true,
  label = "Change due date",
}: {
  valueISO: string | null;
  display: string;
  onChange: (iso: string | null) => void;
  canEdit?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const MENU_WIDTH = 232;

  if (!canEdit) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-slate-400">
        <CalendarDays size={12} />
        {display}
      </span>
    );
  }

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const init = splitISO(valueISO);
    setDate(init.date);
    setTime(init.time);
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const centerX = r.left + r.width / 2;
      const left = Math.max(8, Math.min(centerX - MENU_WIDTH / 2, window.innerWidth - MENU_WIDTH - 8));
      const heightEstimate = 220;
      if (r.bottom + heightEstimate > window.innerHeight) {
        setPos({ bottom: window.innerHeight - r.top + 4, left });
      } else {
        setPos({ top: r.bottom + 4, left });
      }
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  function handleSave() {
    if (!date) {
      setOpen(false);
      if (valueISO !== null) onChange(null);
      return;
    }
    const picked = new Date(`${date}T${time || "09:00"}`);
    setOpen(false);
    if (!Number.isNaN(picked.getTime())) onChange(picked.toISOString());
  }

  const inputCls =
    "clay-inset h-9 w-full px-2.5 text-xs font-semibold text-slate-700 outline-none";

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 transition hover:text-sky-600"
      >
        <CalendarDays size={12} />
        <span className="truncate">{display}</span>
        <ChevronDown size={11} className={`shrink-0 opacity-60 transition ${open ? "rotate-180" : ""}`} />
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
              role="dialog"
              aria-label={label}
              className="clay fixed z-[100] !rounded-2xl p-3"
              style={{ top: pos.top, bottom: pos.bottom, left: pos.left, width: MENU_WIDTH }}
            >
              <p className="text-[11px] font-bold text-slate-700">Due date</p>
              <div className="mt-2 space-y-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-label="Due date"
                  className={inputCls}
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  aria-label="Due time"
                  className={inputCls}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setOpen(false);
                    if (valueISO !== null) onChange(null);
                  }}
                  className="clay-btn px-2.5 py-1.5 text-[11px] font-bold text-slate-500"
                >
                  Clear
                </button>
                <button
                  onClick={handleSave}
                  className="clay-btn-primary px-3 py-1.5 text-[11px] font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
