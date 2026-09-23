"use client";

// Lencana assignee: avatar inisial + nama, atau teks redup bila belum di-assign.
export default function AssigneeBadge({
  name,
  email,
  className = "",
}: {
  name?: string | null;
  email?: string | null;
  className?: string;
}) {
  if (!name) {
    return <span className={`text-xs text-slate-400 ${className}`}>Unassigned</span>;
  }
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  return (
    <span
      title={email ? `${name} (${email})` : name}
      className={`inline-flex min-w-0 max-w-36 items-center gap-1.5 ${className}`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
        {initial}
      </span>
      <span className="truncate text-xs font-medium text-slate-600">{name}</span>
    </span>
  );
}
