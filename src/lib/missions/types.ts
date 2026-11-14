export const stages = [
  {
    id: "research",
    name: "Scout",
    role: "Research & evidence",
    description:
      "Connect your goal to sources. Separate what is known from what needs checking.",
    color: "mint",
  },
  {
    id: "perspectives",
    name: "Bridge",
    role: "People & perspectives",
    description:
      "Make room for different needs. Keep disagreements and missing voices visible.",
    color: "peach",
  },
  {
    id: "plan",
    name: "Maker",
    role: "A plan you can use",
    description:
      "Turn the context into practical tasks for people to review and take on.",
    color: "lilac",
  },
  {
    id: "tool",
    name: "Studio",
    role: "Build a shared tool",
    description:
      "Create a tailored participation form your community can actually use.",
    color: "sun",
  },
] as const;
export type MissionStage = (typeof stages)[number]["id"];
export type Evidence = {
  id: string;
  title: string;
  text: string;
  url?: string;
  kind: "source" | "perspective" | "constraint" | "web";
  author?: string;
  authorId?: string;
};
export type MissionTool = {
  title: string;
  description: string;
  fields: {
    id: string;
    label: string;
    kind: "text" | "choice";
    options: string[];
    required: boolean;
  }[];
};
export type MissionOutput = {
  tool: MissionTool | null;
  headline: string;
  summary: string;
  findings: { text: string; sourceIds: string[] }[];
  questions: string[];
  tasks: { title: string; detail: string; minutes: number }[];
};
export type Contribution = {
  id: string;
  kind: Evidence["kind"];
  title: string;
  content: string;
  url: string | null;
  authorId: string;
  author: { name: string | null };
  createdAt: string;
};
export type MissionRun = {
  id: string;
  stage: MissionStage;
  origin?: "ai" | "edited" | "manual" | "template";
  derivedFromId?: string | null;
  status: string;
  inputRevision: number;
  sources: Evidence[];
  output: MissionOutput | null;
  formState?: "draft" | "published" | "closed" | "unpublished";
  responseVisibility?: "organizers" | "members";
  retentionDays?: number | null;
  sensitiveReason?: string | null;
  responseCount?: number;
  model?: string | null;
  provider?: string | null;
  promptVersion?: string | null;
  error: string | null;
  searchStatus: string;
  acceptedAt: string | null;
  reviewerName?: string | null;
  createdAt: string;
  completedAt: string | null;
};
export type MissionTask = {
  evidence?: { note: string; url: string; actor: string; at: string }[];
  events?: {
    id: string;
    action: string;
    createdAt: string;
    actor: { name: string | null } | null;
  }[];
  id: string;
  title: string;
  detail: string;
  minutes: number;
  status: string;
  assignedToId: string | null;
  assignee: { name: string | null } | null;
  runId: string;
};
export type Mission = {
  id: string;
  title: string;
  templateCredit?: string | null;
  goal: string;
  location: string | null;
  organizationId: string | null;
  createdBy: string;
  revision: number;
  updatedAt: string;
  runLeaseUntil: string | null;
  creator: { name: string | null };
  organization: { name: string; slug: string } | null;
  contributions: Contribution[];
  runs: MissionRun[];
  tasks: MissionTask[];
  toolResponses: {
    id: string;
    runId: string;
    authorId: string;
    author: { name: string | null };
    offerToHelp?: boolean;
    expiresAt?: string | null;
    values: Record<string, string>;
    updatedAt: string;
  }[];
  canManage: boolean;
  searchAvailable?: boolean;
};
export type MissionSummary = Pick<
  Mission,
  "id" | "title" | "goal" | "location" | "updatedAt" | "organization"
> & {
  _count: { contributions: number; tasks: number };
  runs: Pick<MissionRun, "status" | "stage">[];
};
