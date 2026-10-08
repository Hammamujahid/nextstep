"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";

function menuPos(rect: DOMRect, width: number, heightEstimate: number) {
  const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
  if (rect.bottom + heightEstimate > window.innerHeight) {
    return { bottom: window.innerHeight - rect.top + 4, left };
  }
  return { top: rect.bottom + 4, left };
}

export default function RowActionMenu({
  label,
  onEdit,
  onDelete,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos(menuPos(r, 176, 130));
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
  }, [open]);

  return (
    <div className="inline-block shrink-0">
      <button
        ref={btnRef}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${label}`}
        title="Actions"
        className="clay-btn rounded-xl p-1.5 text-slate-500"
      >
        <Ellipsis className="h-[18px] w-[18px]" />
      </button>
      {open &&
        pos &&
        createPortal(
          <>
            <button
              aria-label="Close actions menu"
              className="fixed inset-0 z-[90] cursor-default bg-transparent"
              onClick={() => setOpen(false)}
            />
            <div
              className="clay fixed z-[100] w-44 overflow-hidden !rounded-2xl p-1.5"
              style={{ top: pos.top, bottom: pos.bottom, left: pos.left }}
            >
              <button
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
                className="clay-nav flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-slate-600"
              >
                <Pencil className="h-3.5 w-3.5 text-indigo-500" />
                Edit
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                className="clay-nav mt-0.5 flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-rose-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}