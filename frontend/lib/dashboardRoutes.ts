export type NavKey =
  | "dashboard"
  | "goals"
  | "tasks"
  | "projects"
  | "applications"
  | "members";

export type ViewKey = NavKey | "settings";

export const NAV_HREF: Record<NavKey, string> = {
  dashboard: "/dashboard",
  goals: "/dashboard/goals",
  tasks: "/dashboard/tasks",
  projects: "/dashboard/projects",
  applications: "/dashboard/applications",
  members: "/dashboard/members",
};

export const NAV_TITLES: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Your career at a glance" },
  goals: { title: "Goals", subtitle: "What you are working toward" },
  tasks: { title: "Tasks", subtitle: "Your next steps, prioritized" },
  projects: { title: "Projects", subtitle: "Portfolio and learning work" },
  applications: {
    title: "Job Applications",
    subtitle: "Track every opportunity",
  },
  members: { title: "Members", subtitle: "Who is in this workspace" },
  settings: { title: "Settings", subtitle: "Your account" },
};

/** Memetakan pathname ke view aktif (dipakai sidebar & topbar). */
export function viewFromPath(pathname: string): ViewKey {
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  if (pathname.startsWith("/dashboard/goals")) return "goals";
  if (pathname.startsWith("/dashboard/tasks")) return "tasks";
  if (pathname.startsWith("/dashboard/projects")) return "projects";
  if (pathname.startsWith("/dashboard/applications")) return "applications";
  if (pathname.startsWith("/dashboard/members")) return "members";
  return "dashboard";
}