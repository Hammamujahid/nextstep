import { API_BASE, getToken } from "./auth";

export type SSEEvent = {
  type: "task_created" | "task_toggled" | "task_updated" | "goal_progress" | "goals_refresh" | "goal_created";
  data?: unknown;
  workspace_id?: number;
};

export function connectWorkspaceEvents(
  workspaceId: number,
  onEvent: (ev: SSEEvent) => void,
  onError?: (e: Event) => void
): () => void {
  const token = getToken();
  if (!token) {
    console.warn("SSE: no token");
    return () => {};
  }
  // EventSource tidak support header, jadi token via query
  const url = `${API_BASE}/workspaces/${workspaceId}/events?token=${encodeURIComponent(token)}`;
  const es = new EventSource(url);
  console.log("[SSE] connecting", url);

  es.onopen = () => {
    console.log("[SSE] connected workspace", workspaceId);
  };

  es.onmessage = (e) => {
    console.log("[SSE] event", e.data);
    try {
      const parsed = JSON.parse(e.data) as SSEEvent;
      onEvent(parsed);
    } catch {
      // fallback: raw data
      onEvent({ type: "goals_refresh", data: e.data } as SSEEvent);
    }
  };

  es.onerror = (e) => {
    console.error("[SSE] error", e);
    if (onError) onError(e);
    // EventSource auto-reconnect, tidak perlu manual
  };

  return () => {
    es.close();
  };
}
