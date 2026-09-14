"use client";

import { useMemo, useState } from "react";
import TasksHeader, { type BoardView } from "./TasksHeader";
import TasksStats from "./TasksStats";
import TasksFilterBar, {
  type DateFilter,
  type PriorityFilter,
  type TagFilter,
} from "./TasksFilterBar";
import TaskBoard from "./TaskBoard";
import TaskListView from "./TaskListView";
import NewTaskModal, { type NewBoardTaskInput } from "./NewTaskModal";
import {
  TASKS_BOARD,
  type BoardLane,
  type BoardTask,
  type DueKey,
} from "../../lib/dashboard";

let nextBoardId = 100;

function parseEstimateToMinutes(raw: string): number {
  const text = raw.trim().toLowerCase();
  const hours = text.match(/^(\d+(?:\.\d+)?)\s*h/);
  if (hours) return Math.round(parseFloat(hours[1]) * 60);
  const minutes = text.match(/^(\d+)\s*m/);
  if (minutes) return parseInt(minutes[1], 10);
  const plain = parseInt(text, 10);
  return Number.isNaN(plain) ? 30 : plain;
}

function dueMeta(dueKey: DueKey): Pick<BoardTask, "dueLabel" | "dueTone"> {
  if (dueKey === "today")
    return { dueLabel: "Today, End of Day", dueTone: "primary" };
  if (dueKey === "overdue")
    return { dueLabel: "Scheduled later", dueTone: "muted" };
  return { dueLabel: "This week", dueTone: "muted" };
}

export default function TasksView() {
  const [tasks, setTasks] = useState<BoardTask[]>(TASKS_BOARD);
  const [view, setView] = useState<BoardView>("board");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [tag, setTag] = useState<TagFilter>("all");
  const [date, setDate] = useState<DateFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);

  function toggleTask(id: number) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (t.lane === "completed") {
          return {
            ...t,
            lane: t.prevLane ?? "upcoming",
            prevLane: null,
            completedLabel: null,
            dueTone: t.prevDueTone ?? "muted",
            prevDueTone: null,
          };
        }
        return {
          ...t,
          lane: "completed" as BoardLane,
          prevLane: t.lane,
          prevDueTone: t.dueTone,
          completedLabel: "Completed today",
          dueTone: "success" as BoardTask["dueTone"],
        };
      })
    );
  }

  function addTask(input: NewBoardTaskInput) {
    nextBoardId += 1;
    const lane: BoardLane =
      input.dueKey === "today" ? "overdue" : "upcoming";
    const meta = dueMeta(input.dueKey);
    setTasks((prev) => [
      {
        id: nextBoardId,
        title: input.title,
        description: null,
        tag: input.tag,
        priority: input.priority,
        lane,
        prevLane: null,
        dueLabel: meta.dueLabel,
        dueTone: meta.dueTone,
        dueKey: input.dueKey === "overdue" ? "week" : input.dueKey,
        estimate: input.estimate,
        estimateMinutes: parseEstimateToMinutes(input.estimate),
        progress: null,
        completedLabel: null,
      },
      ...prev,
    ]);
  }

  function resetFilters() {
    setPriority("all");
    setTag("all");
    setDate("all");
  }

  const visible = useMemo(
    () =>
      tasks.filter((t) => {
        if (priority !== "all" && t.priority !== priority) return false;
        if (tag !== "all" && t.tag !== tag) return false;
        if (date !== "all" && t.dueKey !== date) return false;
        return true;
      }),
    [tasks, priority, tag, date]
  );

  return (
    <div className="anim-fade-up flex w-full flex-col gap-5">
      <TasksHeader
        view={view}
        onViewChange={setView}
        onNewTask={() => setModalOpen(true)}
      />
      <TasksStats tasks={tasks} />
      <TasksFilterBar
        priority={priority}
        onPriorityChange={setPriority}
        tag={tag}
        onTagChange={setTag}
        date={date}
        onDateChange={setDate}
        onReset={resetFilters}
      />
      {view === "board" ? (
        <TaskBoard tasks={visible} onToggle={toggleTask} />
      ) : (
        <TaskListView tasks={visible} onToggle={toggleTask} />
      )}
      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addTask}
      />
    </div>
  );
}
