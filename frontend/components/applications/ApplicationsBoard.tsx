"use client";

import type { ApiApplication, ApplicationStatus } from "../../lib/dashboardApi";
import ApplicationCard from "./ApplicationCard";

type ApplicationsBoardProps = {
  apps: ApiApplication[];
  onStatusChange: (id: number, status: ApplicationStatus) => void;
  onDueChange: (id: number, dueDateISO: string | null) => void;
  onEdit: (app: ApiApplication) => void;
  onDelete: (id: number) => void;
  canEdit?: boolean;
};

export default function ApplicationsBoard({ apps, onStatusChange, onDueChange, onEdit, onDelete, canEdit = true }: ApplicationsBoardProps) {
  if (apps.length === 0) {
    return (
      <p className="clay border-2 border-dashed border-sky-200 bg-white/60 px-3 py-10 text-center text-sm text-slate-400">
        No applications here.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
      {apps.map((app) => (
        <ApplicationCard
          key={app.id}
          app={app}
          onStatusChange={onStatusChange}
          onDueChange={onDueChange}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
