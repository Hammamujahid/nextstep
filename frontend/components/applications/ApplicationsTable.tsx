"use client";

import { APP_STAGES, type PipelineApplication } from "../../lib/dashboard";

const STAGE_LABEL: Record<PipelineApplication["stage"], string> =
  Object.fromEntries(APP_STAGES.map((s) => [s.key, s.label])) as Record<
    PipelineApplication["stage"],
    string
  >;

export default function ApplicationsTable({
  apps,
}: {
  apps: PipelineApplication[];
}) {
  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-400">
          No applications match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
            <th scope="col" className="px-4 py-3 font-semibold">
              Company
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Role
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Stage
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Location
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Compensation
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {apps.map((app) => (
            <tr key={app.id} className="transition hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-sky-600">
                    {app.company.charAt(0)}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {app.company}
                  </span>
                </span>
              </td>
              <td className="max-w-56 truncate px-4 py-3 text-slate-600">
                {app.role}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                  {STAGE_LABEL[app.stage]}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {app.location}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {app.salary || app.offer?.amount || "-"}
              </td>
              <td className="max-w-56 truncate px-4 py-3 text-slate-500">
                {app.offer
                  ? `Offer ${app.offer.deadline}`
                  : app.footerMain || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
