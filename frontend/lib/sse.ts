import { API_BASE } from "./auth";

export type SSEEvent = {
  type: "task_created" | "task_toggled" | "task_updated" | "task_deleted" | "goal_progress" | "goals_refresh" | "goal_created" | "goal_updated" | "goal_deleted" | "project_created" | "project_updated" | "project_deleted" | "application_created" | "application_updated" | "application_deleted";
  data?: unknown;
  workspace_id?: number;
};

export function connectWorkspaceEvents(
  workspaceId: number,
  onEvent: (ev: SSEEvent) => void,
  onError?: (e: Event) => void
): () => void {
  // auth lewat cookie HttpOnly (withCredentials); token tidak lagi
  // dilewatkan via query agar tidak bocor ke log/history
  const url = `${API_BASE}/workspaces/${workspaceId}/events`;
  const es = new EventSource(url, { withCredentials: true });

  es.onopen = () => {
    return;
  };

  es.onmessage = (e) => {
    try {
      const parsed = JSON.parse(e.data) as SSEEvent;
      onEvent(parsed);
    } catch {
      // fallback: raw data
      onEvent({ type: "goals_refresh", data: e.data } as SSEEvent);
    }
  };

  es.onerror = (e) => {
    if (onError) onError(e);
    // EventSource auto-reconnect, tidak perlu manual
  };

  return () => {
    es.close();
  };
}
