"use client";

import { useMemo, useState } from "react";
import ApplicationsHeader from "./ApplicationsHeader";
import ApplicationsStats from "./ApplicationsStats";
import ApplicationsFilterBar, {
  type PipelineFilter,
  type PipelineView,
} from "./ApplicationsFilterBar";
import ApplicationsBoard from "./ApplicationsBoard";
import ApplicationsTable from "./ApplicationsTable";
import AddApplicationModal, {
  type NewApplicationInput,
} from "./AddApplicationModal";
import { PipelinePanels } from "./PipelinePanels";
import {
  PIPELINE_APPLICATIONS,
  type AppStage,
  type PipelineApplication,
} from "../../lib/dashboard";

let nextAppId = 100;

function salaryIsHigh(salary: string): boolean {
  const match = salary.replace(/,/g, "").match(/\$(\d+(?:\.\d+)?)\s*k/i);
  return match ? parseFloat(match[1]) >= 180 : false;
}

function locationFlags(location: string): {
  remote: boolean;
  hybridOrOnsite: boolean;
} {
  const text = location.toLowerCase();
  return {
    remote: text.includes("remote"),
    hybridOrOnsite:
      text.includes("hybrid") ||
      text.includes("onsite") ||
      text.includes("sf /"),
  };
}

export default function ApplicationsView() {
  const [apps, setApps] = useState<PipelineApplication[]>(PIPELINE_APPLICATIONS);
  const [filter, setFilter] = useState<PipelineFilter>("all");
  const [view, setView] = useState<PipelineView>("board");
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  function addApplication(input: NewApplicationInput) {
    nextAppId += 1;
    const flags = locationFlags(input.location);
    const stage: AppStage = input.stage;
    setApps((prev) => [
      {
        id: nextAppId,
        company: input.company,
        role: input.role,
        location: input.location.includes("Remote")
          ? input.location.replace(" (US / Americas)", "").replace(" (Global / Anywhere)", "")
          : input.location,
        description: input.notes || null,
        salary: input.salary,
        salaryMeta: `Applied: ${input.appliedLabel}`,
        stage,
        remote: flags.remote,
        hybridOrOnsite: flags.hybridOrOnsite,
        highPriority: salaryIsHigh(input.salary),
        activeInterview: stage === "technical" || stage === "onsite",
        footerMain: "Just added",
        footerMainTone: "sky",
        footerRight: input.appliedLabel,
      },
      ...prev,
    ]);
    // Reset filter so the new card is always visible.
    setFilter("all");
  }

  const visible = useMemo(
    () =>
      apps.filter((a) => {
        if (filter === "remote" && !a.remote) return false;
        if (filter === "onsite" && !a.hybridOrOnsite) return false;
        if (filter === "interview" && !a.activeInterview) return false;
        if (filter === "high" && !a.highPriority) return false;
        return true;
      }),
    [apps, filter]
  );

  return (
    <div className="anim-fade-up flex w-full flex-col gap-5">
      <ApplicationsHeader
        onAdd={() => setModalOpen(true)}
        onToggleFilters={() => setFiltersVisible((v) => !v)}
        filtersVisible={filtersVisible}
      />
      <ApplicationsStats apps={apps} />
      {filtersVisible && (
        <ApplicationsFilterBar
          filter={filter}
          onFilterChange={setFilter}
          view={view}
          onViewChange={setView}
          total={apps.length}
        />
      )}
      {view === "board" ? (
        <ApplicationsBoard apps={visible} />
      ) : (
        <ApplicationsTable apps={visible} />
      )}
      <PipelinePanels />
      <AddApplicationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addApplication}
      />
    </div>
  );
}
