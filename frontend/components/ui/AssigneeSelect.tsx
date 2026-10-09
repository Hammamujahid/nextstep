"use client";

import AssigneeBadge from "./AssigneeBadge";
import InlineSelect, { type InlineOption } from "./InlineSelect";

export type AssigneeOption = {
  id: number;
  name: string;
};

// Dropdown inline untuk ganti assignee, konsepnya sama seperti dropdown
// status: editor dapat pill select, viewer hanya lihat badge.
// Kalau assignee saat ini tidak ada di daftar (akses dicabut), namanya tetap
// ditampilkan sebagai opsi terkunci agar tidak terlihat unassigned.
export default function AssigneeSelect({
  assigneeId,
  assigneeName,
  assignees,
  onChange,
  canEdit = true,
  label = "Change assignee",
  variant = "pill",
}: {
  assigneeId: number | null;
  assigneeName?: string | null;
  assignees: AssigneeOption[];
  onChange: (id: number | null) => void;
  canEdit?: boolean;
  label?: string;
  variant?: "pill" | "plain";
}) {
  if (!canEdit) {
    return <AssigneeBadge name={assigneeName} />;
  }

  const inList = assigneeId != null && assignees.some((a) => a.id === assigneeId);
  const value =
    assigneeId == null ? "" : inList ? String(assigneeId) : `keep:${assigneeId}`;

  const options: InlineOption[] = [
    { value: "", label: "Unassigned" },
    ...(!inList && assigneeId != null
      ? [{ value: `keep:${assigneeId}`, label: assigneeName ?? "Assigned", avatarName: assigneeName ?? "?", disabled: true }]
      : []),
    ...assignees.map((a) => ({ value: String(a.id), label: a.name, avatarName: a.name })),
  ];

  const buttonClassName =
    variant === "pill"
      ? "clay-chip bg-white/80 py-1 pl-2 pr-1.5 text-[10px] font-bold text-sky-600 outline-none transition hover:bg-white"
      : "clay-inset w-full py-2 pl-3 pr-7 text-xs font-semibold text-slate-600 outline-none transition";

  return (
    <InlineSelect
      value={value}
      options={options}
      onChange={(v) => {
        if (v === "") onChange(null);
        else if (!v.startsWith("keep:")) onChange(Number(v));
      }}
      label={label}
      buttonClassName={buttonClassName}
      menuWidth={200}
    />
  );
}
