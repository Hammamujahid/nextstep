export type TaskPriority = "High" | "Medium" | "Normal";

export type DashboardTask = {
  id: number;
  title: string;
  priority: TaskPriority;
  due: string;
  dueToday: boolean;
  project: string | null;
  done: boolean;
};

export type ProjectStage = "polish" | "progress";

export type DashboardProject = {
  id: number;
  name: string;
  description: string;
  stage: string;
  stageTone: ProjectStage;
  tasksDone: number;
  tasksTotal: number;
};

export type DashboardApplication = {
  id: number;
  company: string;
  role: string;
  status: string;
  statusTone: "interview" | "review" | "final" | "submitted";
  applied: string;
  note: string;
  noteTone: "sky" | "slate" | "emerald";
};

export type SkillTrack = {
  id: number;
  title: string;
  detail: string;
  progress: number;
};

export const PRIMARY_GOAL = {
  status: "In Progress",
  title: "Become a Fullstack Developer",
  description:
    "Solidify modern frontend performance, master distributed backend services, and secure a mid-to-senior product engineering position.",
  tags: ["Frontend Performance", "Distributed Systems", "Interview Ready"],
  progress: 72,
  requirements: "4/6 requirements met",
};

export const INITIAL_TASKS: DashboardTask[] = [
  {
    id: 1,
    title: "Refactor authentication flow and add test coverage",
    priority: "High",
    due: "Due Today",
    dueToday: true,
    project: "Goal: Fullstack Dev",
    done: false,
  },
  {
    id: 2,
    title: "Submit tailored application to Stripe (Fullstack UI Team)",
    priority: "High",
    due: "Tomorrow, 5:00 PM",
    dueToday: false,
    project: "Goal: Fullstack Dev",
    done: false,
  },
  {
    id: 3,
    title: "Practice System Design: Rate Limiter and Cache Invalidation",
    priority: "Medium",
    due: "In 3 days",
    dueToday: false,
    project: "Goal: Fullstack Dev",
    done: false,
  },
  {
    id: 4,
    title: "Update resume PDF with recent open-source contribution",
    priority: "Medium",
    due: "In 5 days",
    dueToday: false,
    project: null,
    done: false,
  },
  {
    id: 5,
    title: "Follow up with recruiter at Linear regarding Stage 2 feedback",
    priority: "Normal",
    due: "Next week",
    dueToday: false,
    project: null,
    done: false,
  },
];

export const DASHBOARD_PROJECTS: DashboardProject[] = [
  {
    id: 1,
    name: "DevFolio v2",
    description:
      "Interactive developer portfolio featuring 3D canvas showcase and live code sandbox integrations.",
    stage: "Polish Stage",
    stageTone: "polish",
    tasksDone: 12,
    tasksTotal: 14,
  },
  {
    id: 2,
    name: "PulseAPI Engine",
    description:
      "Distributed task queue architecture written in Node.js, Redis, and integrated with Prometheus telemetry.",
    stage: "In Progress",
    stageTone: "progress",
    tasksDone: 6,
    tasksTotal: 10,
  },
];

export const DASHBOARD_APPLICATIONS: DashboardApplication[] = [
  {
    id: 1,
    company: "Stripe",
    role: "Fullstack Engineer (UI Team)",
    status: "Tech Screen",
    statusTone: "interview",
    applied: "Applied Oct 18",
    note: "Round 2, Fri 2:00 PM",
    noteTone: "sky",
  },
  {
    id: 2,
    company: "Linear",
    role: "Product Engineer",
    status: "Take-home Review",
    statusTone: "review",
    applied: "Applied Oct 12",
    note: "Feedback expected soon",
    noteTone: "slate",
  },
  {
    id: 3,
    company: "Figma",
    role: "Systems Engineer",
    status: "Final Round",
    statusTone: "final",
    applied: "Applied Oct 05",
    note: "Onsite scheduled next week",
    noteTone: "emerald",
  },
  {
    id: 4,
    company: "Vercel",
    role: "DX Specialist",
    status: "Submitted",
    statusTone: "submitted",
    applied: "Applied Oct 20",
    note: "Under Review",
    noteTone: "slate",
  },
];

export const SKILL_TRACKS: SkillTrack[] = [
  {
    id: 1,
    title: "Master TypeScript and Distributed Systems",
    detail: "12 lessons completed this month",
    progress: 64,
  },
  {
    id: 2,
    title: "System Design Interview Prep",
    detail: "8 mock sessions completed",
    progress: 45,
  },
];

export const NOTIFICATIONS = [
  {
    id: 1,
    title: "Interview invited",
    detail: "Stripe Tech Screen, Fri 2:00 PM",
    time: "2h ago",
  },
  {
    id: 2,
    title: "Take-home under review",
    detail: "Linear Product Engineer",
    time: "Yesterday",
  },
  {
    id: 3,
    title: "Milestone reached",
    detail: "Portfolio marked complete",
    time: "2 days ago",
  },
];

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export type AppStage = "saved" | "applied" | "technical" | "onsite" | "offer";

export type PipelineApplication = {
  id: number;
  company: string;
  role: string;
  location: string;
  description: string | null;
  salary: string;
  salaryMeta: string;
  stage: AppStage;
  remote: boolean;
  hybridOrOnsite: boolean;
  highPriority: boolean;
  activeInterview: boolean;
  footerMain: string;
  footerMainTone: "sky" | "slate" | "emerald" | "red";
  footerRight: string;
  interview?: { title: string; datetime: string; sub: string };
  assignment?: { label: string; right: string };
  onsite?: { title: string; datetime: string; sub: string };
  offer?: { amount: string; equity: string; signon: string; deadline: string };
};

export const APP_STAGES: { key: AppStage; label: string; dot: string }[] = [
  { key: "saved", label: "Saved / Drafting", dot: "bg-slate-400" },
  { key: "applied", label: "Applied", dot: "bg-sky-500" },
  { key: "technical", label: "Technical / Take-home", dot: "bg-sky-400" },
  { key: "onsite", label: "Onsite / Final Round", dot: "bg-sky-300" },
  { key: "offer", label: "Offer & Negotiation", dot: "bg-emerald-500" },
];

export const PIPELINE_APPLICATIONS: PipelineApplication[] = [
  {
    id: 1,
    company: "Craft Docs",
    role: "Frontend Architect",
    location: "Remote",
    description:
      "Tailoring portfolio spotlighting offline-first sync engine work and CRDT experience.",
    salary: "$175k - $210k",
    salaryMeta: "Ref: John C.",
    stage: "saved",
    remote: true,
    hybridOrOnsite: false,
    highPriority: true,
    activeInterview: false,
    footerMain: "Resume 85% ready",
    footerMainTone: "slate",
    footerRight: "Drafted 2d ago",
  },
  {
    id: 2,
    company: "Notion",
    role: "Staff Product Eng",
    location: "SF / Hybrid",
    description: null,
    salary: "$210k - $240k",
    salaryMeta: "Team: Blocks Core",
    stage: "saved",
    remote: false,
    hybridOrOnsite: true,
    highPriority: true,
    activeInterview: false,
    footerMain: "Referral confirmed",
    footerMainTone: "sky",
    footerRight: "Saved yesterday",
  },
  {
    id: 3,
    company: "Stripe",
    role: "Fullstack Engineer",
    location: "Remote US",
    description:
      "Billing and Subscriptions lifecycle tooling. Submitted through hiring portal with cover letter.",
    salary: "$190k - $225k + Equity",
    salaryMeta: "Applied: Apr 14",
    stage: "applied",
    remote: true,
    hybridOrOnsite: false,
    highPriority: true,
    activeInterview: true,
    footerMain: "Recruiter opened (2h ago)",
    footerMainTone: "sky",
    footerRight: "",
  },
  {
    id: 4,
    company: "Vercel",
    role: "DX Specialist",
    location: "Remote",
    description:
      "Next.js developer experience and CLI telemetry. Portfolio link focused on React Server Components.",
    salary: "$180k - $210k",
    salaryMeta: "Applied: Apr 12",
    stage: "applied",
    remote: true,
    hybridOrOnsite: false,
    highPriority: true,
    activeInterview: false,
    footerMain: "Waiting 4 business days",
    footerMainTone: "slate",
    footerRight: "",
  },
  {
    id: 5,
    company: "GitHub",
    role: "Platform Engineer",
    location: "Remote",
    description: null,
    salary: "$175k - $205k",
    salaryMeta: "Applied: Apr 10",
    stage: "applied",
    remote: true,
    hybridOrOnsite: false,
    highPriority: false,
    activeInterview: false,
    footerMain: "Internal screening",
    footerMainTone: "slate",
    footerRight: "6d ago",
  },
  {
    id: 6,
    company: "Linear",
    role: "Systems Engineer",
    location: "Active",
    description: null,
    salary: "",
    salaryMeta: "",
    stage: "technical",
    remote: true,
    hybridOrOnsite: false,
    highPriority: false,
    activeInterview: true,
    footerMain: "4/5 Prep Cards read",
    footerMainTone: "slate",
    footerRight: "Prep Room",
    interview: {
      title: "Live Technical System Design",
      datetime: "Thu, Apr 18, 10:00 AM PST",
      sub: "Interviewer: Tuomas (Staff Infra Lead)",
    },
  },
  {
    id: 7,
    company: "Supabase",
    role: "Edge Engine Specialist",
    location: "Remote Global",
    description:
      "Take-home assignment: Build lightweight distributed auth caching worker.",
    salary: "",
    salaryMeta: "",
    stage: "technical",
    remote: true,
    hybridOrOnsite: false,
    highPriority: false,
    activeInterview: false,
    footerMain: "Repo cloned and started",
    footerMainTone: "slate",
    footerRight: "Upload PR",
    assignment: { label: "Due in 2 days", right: "GitHub PR review" },
  },
  {
    id: 8,
    company: "Figma",
    role: "Senior Fullstack Eng",
    location: "SF / Hybrid",
    description: null,
    salary: "",
    salaryMeta: "",
    stage: "onsite",
    remote: false,
    hybridOrOnsite: true,
    highPriority: true,
    activeInterview: true,
    footerMain: "Briefing call completed",
    footerMainTone: "emerald",
    footerRight: "",
    onsite: {
      title: "Virtual Onsite Loop (4 Sessions)",
      datetime: "Mon, Apr 22, 1:00 PM - 5:30 PM",
      sub: "Architecture, Collaboration, Deep Dive, VP Chat",
    },
  },
  {
    id: 9,
    company: "Raycast",
    role: "Core Extension Lead",
    location: "Remote EU/US",
    description:
      "Final founder interview with Thomas and Petr. Architecture alignment.",
    salary: "$185k + Generous RSUs",
    salaryMeta: "Fri, Apr 19, 3PM",
    stage: "onsite",
    remote: true,
    hybridOrOnsite: false,
    highPriority: true,
    activeInterview: true,
    footerMain: "Step 4 of 4",
    footerMainTone: "slate",
    footerRight: "Notes Ready",
  },
  {
    id: 10,
    company: "Chronicle",
    role: "Lead WebGL Eng",
    location: "Offer Extended",
    description: null,
    salary: "",
    salaryMeta: "",
    stage: "offer",
    remote: true,
    hybridOrOnsite: false,
    highPriority: true,
    activeInterview: false,
    footerMain: "",
    footerMainTone: "slate",
    footerRight: "",
    offer: {
      amount: "$195,000",
      equity: "Equity: 0.25% (4yr)",
      signon: "Sign-on: $20,000",
      deadline: "Apr 24 (6d left)",
    },
  },
];

export const PIPELINE_ACTIONS = [
  { id: 1, title: "Review Linear API docs for system design round", detail: "Completed today at 9:15 AM", done: true },
  { id: 2, title: "Draft thank-you note to Figma Staff Recruiter", detail: "Due today by 5:00 PM", done: false },
  { id: 3, title: "Supabase take-home repo edge worker unit tests", detail: "Due tomorrow, 2 hrs allocated", done: false },
];

export const FUNNEL_STAGES = [
  { label: "Application to Recruiter Screen", value: "62% (Above Target)", valueTone: "text-sky-600", bar: "bg-sky-400", width: 62 },
  { label: "Screen to Technical Deep Dive", value: "50% (On Track)", valueTone: "text-sky-600", bar: "bg-sky-300", width: 50 },
  { label: "Technical to Onsite Loop", value: "40% (Strong)", valueTone: "text-emerald-600", bar: "bg-emerald-400", width: 40 },
];

export const COMP_ROWS = [
  { company: "Linear Systems Role", comp: "$200k + 0.15%", tone: "slate" },
  { company: "Figma Senior Fullstack", comp: "$215k + $110k RSU", tone: "slate" },
  { company: "Chronicle Active Offer", comp: "$195k + 0.25%", tone: "emerald" },
];

export type BoardLane = "overdue" | "in-progress" | "upcoming" | "completed";

export type BoardPriority = "high" | "medium" | "low";

export type BoardTag = "Tech Prep" | "Applications" | "DevFolio v2";

export type DueKey = "today" | "week" | "overdue";

export type BoardTask = {
  id: number;
  title: string;
  description: string | null;
  tag: BoardTag;
  priority: BoardPriority;
  lane: BoardLane;
  prevLane: BoardLane | null;
  dueLabel: string;
  dueTone: "danger" | "primary" | "muted" | "success";
  prevDueTone?: "danger" | "primary" | "muted" | "success" | null;
  dueKey: DueKey;
  estimate: string;
  estimateMinutes: number;
  progress: number | null;
  completedLabel: string | null;
};

export const BOARD_LANES: { key: BoardLane; label: string; dot: string }[] = [
  { key: "overdue", label: "Today / Overdue", dot: "bg-red-500" },
  { key: "in-progress", label: "In Progress", dot: "bg-sky-400" },
  { key: "upcoming", label: "Upcoming This Week", dot: "bg-slate-400" },
  { key: "completed", label: "Completed", dot: "bg-emerald-500" },
];

export const BOARD_TAGS: BoardTag[] = ["DevFolio v2", "Tech Prep", "Applications"];

export const TASKS_BOARD: BoardTask[] = [
  {
    id: 1,
    title: "Mock System Design: Distributed Rate Limiter",
    description:
      "Practice token bucket and sliding window logs with mentor Elena. Prepare edge cases diagram on Excalidraw.",
    tag: "Tech Prep",
    priority: "high",
    lane: "overdue",
    prevLane: null,
    dueLabel: "Yesterday (Overdue)",
    dueTone: "danger",
    dueKey: "overdue",
    estimate: "90m",
    estimateMinutes: 90,
    progress: null,
    completedLabel: null,
  },
  {
    id: 2,
    title: "Submit Tailored Cover Letter to Stripe",
    description:
      "Align developer platform experience with API idempotency architecture notes. Reference John's referral key.",
    tag: "Applications",
    priority: "high",
    lane: "overdue",
    prevLane: null,
    dueLabel: "Today, 5:00 PM",
    dueTone: "primary",
    dueKey: "today",
    estimate: "45m",
    estimateMinutes: 45,
    progress: null,
    completedLabel: null,
  },
  {
    id: 3,
    title: "Deploy Live Demo for PostgreSQL Query Visualizer",
    description: null,
    tag: "DevFolio v2",
    priority: "medium",
    lane: "overdue",
    prevLane: null,
    dueLabel: "Today, End of Day",
    dueTone: "primary",
    dueKey: "today",
    estimate: "60m",
    estimateMinutes: 60,
    progress: null,
    completedLabel: null,
  },
  {
    id: 4,
    title: "Refactor Webpack build to Vite + Vitest runner",
    description: null,
    tag: "DevFolio v2",
    priority: "high",
    lane: "in-progress",
    prevLane: null,
    dueLabel: "Tomorrow, 2:00 PM",
    dueTone: "muted",
    dueKey: "week",
    estimate: "120m",
    estimateMinutes: 120,
    progress: 60,
    completedLabel: null,
  },
  {
    id: 5,
    title: "Concurrency in Go: Master Mutex vs Channels Patterns",
    description: null,
    tag: "Tech Prep",
    priority: "medium",
    lane: "in-progress",
    prevLane: null,
    dueLabel: "Thursday",
    dueTone: "muted",
    dueKey: "week",
    estimate: "75m",
    estimateMinutes: 75,
    progress: 35,
    completedLabel: null,
  },
  {
    id: 6,
    title: "Follow-up email to Linear talent lead",
    description: null,
    tag: "Applications",
    priority: "medium",
    lane: "upcoming",
    prevLane: null,
    dueLabel: "Friday, 10:00 AM",
    dueTone: "muted",
    dueKey: "week",
    estimate: "15m",
    estimateMinutes: 15,
    progress: null,
    completedLabel: null,
  },
  {
    id: 7,
    title: "Record 60s Loom walkthrough for landing page",
    description: null,
    tag: "DevFolio v2",
    priority: "low",
    lane: "upcoming",
    prevLane: null,
    dueLabel: "Saturday",
    dueTone: "muted",
    dueKey: "week",
    estimate: "45m",
    estimateMinutes: 45,
    progress: null,
    completedLabel: null,
  },
  {
    id: 8,
    title: "Complete 3 NeetCode 150 Dynamic Programming items",
    description: null,
    tag: "Tech Prep",
    priority: "high",
    lane: "upcoming",
    prevLane: null,
    dueLabel: "Sunday",
    dueTone: "muted",
    dueKey: "week",
    estimate: "90m",
    estimateMinutes: 90,
    progress: null,
    completedLabel: null,
  },
  {
    id: 9,
    title: "Draft distributed cache invalidation notes",
    description: null,
    tag: "Tech Prep",
    priority: "medium",
    lane: "completed",
    prevLane: "upcoming",
    dueLabel: "Completed today",
    dueTone: "success",
    dueKey: "week",
    estimate: "45m",
    estimateMinutes: 45,
    progress: null,
    completedLabel: "Completed today",
  },
  {
    id: 10,
    title: "Update LinkedIn Featured projects section",
    description: null,
    tag: "Applications",
    priority: "low",
    lane: "completed",
    prevLane: "upcoming",
    dueLabel: "Completed yesterday",
    dueTone: "success",
    dueKey: "week",
    estimate: "20m",
    estimateMinutes: 20,
    progress: null,
    completedLabel: "Completed yesterday",
  },
];

export type ProjectStatus = "in-progress" | "polish" | "planning" | "completed";

export type SpecItemState = "done" | "active" | "todo";

export type ProjectItem = {
  id: number;
  name: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  stack: string[];
  progress: number;
  progressMeta: string;
  updatedLabel: string;
  version: string | null;
  commit: string | null;
  lighthouse: string | null;
  buildState: string | null;
  passingTests: string | null;
  openSource: boolean;
  checklist: { id: number; label: string; state: SpecItemState }[] | null;
  scopeLabel: string | null;
  throughput: string | null;
  finalScore: string | null;
  shippedLabel: string | null;
  sparkline: number[];
};

export const PROJECT_STATUS_META: {
  key: ProjectStatus | "all";
  label: (n: number) => string;
}[] = [
  { key: "all", label: (n) => `All (${n})` },
  { key: "in-progress", label: (n) => `In Progress (${n})` },
  { key: "polish", label: (n) => `Polish Stage (${n})` },
  { key: "planning", label: (n) => `Planning (${n})` },
  { key: "completed", label: (n) => `Completed (${n})` },
];

export const PROJECTS_BOARD: ProjectItem[] = [
  {
    id: 1,
    name: "DevFolio v2",
    tagline: "Interactive portfolio with custom WebGL shaders and Three.js physics sandbox showcase.",
    description:
      "Interactive developer portfolio featuring 3D canvas showcase and live code sandbox integrations.",
    status: "polish",
    stack: ["Next.js 14", "TypeScript", "Three.js", "Tailwind CSS", "Framer Motion"],
    progress: 85,
    progressMeta: "12/14 tasks ready",
    updatedLabel: "Updated 2h ago",
    version: null,
    commit: "main @ 9e4f2b1",
    lighthouse: "Lighthouse 98/100",
    buildState: null,
    passingTests: null,
    openSource: false,
    checklist: null,
    scopeLabel: null,
    throughput: null,
    finalScore: null,
    shippedLabel: null,
    sparkline: [],
  },
  {
    id: 2,
    name: "PulseAPI Engine",
    tagline: "Distributed resilient task queue with worker scaling and telemetry.",
    description:
      "Distributed resilient task queue architecture with automated worker scaling, dead-letter re-routing, and telemetry.",
    status: "in-progress",
    stack: ["Node.js", "Redis Stream", "Docker", "Prometheus"],
    progress: 60,
    progressMeta: "6 of 10 sprint stories done",
    updatedLabel: "v0.8.2-alpha",
    version: "v0.8.2-alpha",
    commit: null,
    lighthouse: null,
    buildState: "Build: passing",
    passingTests: "Passing 48 tests",
    openSource: false,
    checklist: null,
    scopeLabel: null,
    throughput: null,
    finalScore: null,
    shippedLabel: null,
    sparkline: [],
  },
  {
    id: 3,
    name: "CloudCost Sentinel",
    tagline: "Terminal-based AWS billing breakdown and zombie asset collector.",
    description:
      "Terminal-based AWS billing breakdown and zombie asset garbage collection tool targeting idle RDS and orphan EBS volumes.",
    status: "planning",
    stack: ["Go (Golang)", "AWS SDK v2", "BubbleTea TUI", "Cobra CLI"],
    progress: 25,
    progressMeta: "Scope Target: 25% complete",
    updatedLabel: "Planning & Spec",
    version: null,
    commit: null,
    lighthouse: null,
    buildState: null,
    passingTests: null,
    openSource: true,
    checklist: [
      { id: 1, label: "CLI argument parsing and configuration specs", state: "done" },
      { id: 2, label: "CloudWatch Cost Explorer metrics collector plugin", state: "active" },
      { id: 3, label: "Multi-account IAM role assumption helper", state: "todo" },
    ],
    scopeLabel: "25% complete",
    throughput: null,
    finalScore: null,
    shippedLabel: null,
    sparkline: [],
  },
  {
    id: 4,
    name: "Algorithmic Trading Dashboard",
    tagline: "Backtesting workspace with candlestick telemetry and heatmaps.",
    description:
      "High-throughput backtesting workspace featuring candlestick telemetry, order book rehydration, and strategy heatmaps.",
    status: "completed",
    stack: ["Python FastAPI", "React", "TimescaleDB", "WebSocket"],
    progress: 100,
    progressMeta: "Shipped Nov 2024",
    updatedLabel: "Archived Demo",
    version: null,
    commit: null,
    lighthouse: null,
    buildState: null,
    passingTests: null,
    openSource: false,
    checklist: null,
    scopeLabel: null,
    throughput: "14,200 tps",
    finalScore: "100%",
    shippedLabel: "Shipped Nov 2024",
    sparkline: [30, 40, 60, 50, 70, 85],
  },
];

export type GoalMilestoneState = "complete" | "current" | "upcoming" | "final";

export type GoalMilestone = {
  id: number;
  title: string;
  detail: string;
  state: GoalMilestoneState;
  quarterLabel: string;
  footLeft: string;
  footRight: string | null;
  progress: number | null;
  progressDue: string | null;
};

export type GoalProjectLink = {
  id: number;
  name: string;
  stack: string;
  tasksLabel: string;
  timeLabel: string;
  progress: number;
  progressTone: "emerald" | "sky";
};

export const NORTH_STAR_GOAL = {
  badges: ["North Star Objective", "High Priority"],
  title: "Become a Fullstack Developer",
  description:
    "Transitioning from frontend-focused client work to architecting end-to-end cloud applications, distributed streaming infrastructure, and resilient microservices.",
  targetDate: "Sept 30, 2025",
  remaining: "94 Days",
  progress: 72,
  stageLabel: "Stage 3 of 4",
};

export const GOAL_MILESTONES: GoalMilestone[] = [
  {
    id: 1,
    title: "TypeScript Master",
    detail: "Advanced generic types, AST, type-safe APIs",
    state: "complete",
    quarterLabel: "Q1 COMPLETE",
    footLeft: "Finished Jan 28",
    footRight: null,
    progress: null,
    progressDue: null,
  },
  {
    id: 2,
    title: "Backend Core & SQL",
    detail: "PostgreSQL tuning, indexing, ACID transactions",
    state: "complete",
    quarterLabel: "Q1 COMPLETE",
    footLeft: "Finished Mar 14",
    footRight: null,
    progress: null,
    progressDue: null,
  },
  {
    id: 3,
    title: "Distributed & Cloud",
    detail: "Redis caches, queues, Docker, AWS deployments",
    state: "current",
    quarterLabel: "IN PROGRESS",
    footLeft: "",
    footRight: null,
    progress: 85,
    progressDue: "Due Jul 15",
  },
  {
    id: 4,
    title: "System Architecture",
    detail: "High-availability mock designs & rate limiters",
    state: "upcoming",
    quarterLabel: "UPCOMING",
    footLeft: "Starts Jul 20",
    footRight: null,
    progress: null,
    progressDue: null,
  },
  {
    id: 5,
    title: "Fullstack Offer",
    detail: "Negotiations, portfolio presentation, signed offer",
    state: "final",
    quarterLabel: "FINAL",
    footLeft: "Target Sep 30",
    footRight: null,
    progress: null,
    progressDue: null,
  },
];

export const GOAL_PROJECT_LINKS: GoalProjectLink[] = [
  {
    id: 1,
    name: "PulseLog — Realtime Event Streaming",
    stack: "Go, Redis Streams, WebSockets, Next.js dashboard",
    tasksLabel: "18/20 tasks",
    timeLabel: "v1.2-rc",
    progress: 90,
    progressTone: "emerald",
  },
  {
    id: 2,
    name: "SchemaCraft — Database Visualizer",
    stack: "PostgreSQL introspector, React Flow, Node CLI engine",
    tasksLabel: "9/20 tasks",
    timeLabel: "14h logged",
    progress: 45,
    progressTone: "sky",
  },
];

export type GoalCheckItem = {
  id: number;
  label: string;
  done: boolean;
  locked: boolean;
};

export type SupportingGoal = {
  id: number;
  title: string;
  description: string;
  badge: string;
  badgeTone: "emerald" | "slate" | "sky";
  icon: "server" | "article" | "briefcase";
  progressLabel: string;
  progress: number;
  progressTone: "emerald" | "sky";
  tasksLabel: string;
  dateLabel: string;
  dateMonth: number;
  dateDay: number;
  checklist: GoalCheckItem[];
  signal?: { left: string; right: string; note: string };
};

export const SUPPORTING_GOALS: SupportingGoal[] = [
  {
    id: 1,
    title: "Distributed Systems & Node Architecture",
    description:
      "Conquering clustering, horizontal scaling, memory profiling, and event loops under load.",
    badge: "NEAR COMPLETE",
    badgeTone: "emerald",
    icon: "server",
    progressLabel: "Proficiency",
    progress: 88,
    progressTone: "emerald",
    tasksLabel: "21/24 Tasks",
    dateLabel: "Aug 05",
    dateMonth: 8,
    dateDay: 5,
    checklist: [
      { id: 1, label: "Benchmark 15k req/s cluster on simulated load", done: true, locked: true },
      { id: 2, label: "Build fault-tolerant worker queue with BullMQ", done: true, locked: true },
      { id: 3, label: "Complete O'Reilly 'Designing Data-Intensive Apps'", done: false, locked: false },
    ],
  },
  {
    id: 2,
    title: "Publish 3 Technical Deep Dives",
    description:
      "Demonstrate senior communication and complex technical deconstruction to establish domain presence.",
    badge: "IN PROGRESS",
    badgeTone: "slate",
    icon: "article",
    progressLabel: "Published",
    progress: 45,
    progressTone: "sky",
    tasksLabel: "5/11 Tasks",
    dateLabel: "Aug 20",
    dateMonth: 8,
    dateDay: 20,
    checklist: [
      { id: 1, label: "Article 1: 'Inside V8 Memory Leak Detection'", done: true, locked: true },
      { id: 2, label: "Article 2: 'Zero-downtime Postgres schema swaps'", done: false, locked: false },
      { id: 3, label: "Article 3: 'Realtime WebSockets vs HTTP/3 SSE'", done: false, locked: false },
    ],
  },
  {
    id: 3,
    title: "Land Fullstack Role",
    description:
      "Securing a high-trust product role with modern stack (TypeScript/Node/Postgres/Next.js) & strong mentorship.",
    badge: "ACTIVE PIPELINE",
    badgeTone: "sky",
    icon: "briefcase",
    progressLabel: "Pipeline Stage",
    progress: 60,
    progressTone: "sky",
    tasksLabel: "12/20 Steps",
    dateLabel: "Sep 30",
    dateMonth: 9,
    dateDay: 30,
    checklist: [
      { id: 1, label: "Target company whitelist (25 curated teams)", done: true, locked: true },
      { id: 2, label: "Secure 2 competing written offers", done: false, locked: false },
    ],
    signal: {
      left: "4 Live Interview Loops",
      right: "2 Final Stages",
      note: "Next: Stripe Technical Round (Tomorrow)",
    },
  },
];

export const GOAL_CATEGORIES = [
  "Skill Specialization",
  "Job Application Milestone",
  "Technical Writing / Brand",
  "Networking & Mentorship",
];
