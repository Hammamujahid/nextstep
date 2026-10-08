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
    return <span className={`text-xs font-medium text-slate-400 ${className}`}>Unassigned</span>;
  }
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  return (
    <span
      title={email ? `${name} (${email})` : name}
      className={`inline-flex min-w-0 max-w-36 items-center gap-1.5 ${className}`}
    >
      <span className="clay-icon h-6 w-6 shrink-0 bg-gradient-to-br from-indigo-400 to-violet-500 text-[10px] font-bold text-white">
        {initial}
      </span>
      <span className="truncate text-xs font-semibold text-slate-600">{name}</span>
    </span>
  );
}