import type { Mission, MissionOutput, MissionStage, Evidence } from "./types";
export const demoSources: Evidence[] = [
  {
    id: "input-venue",
    kind: "source",
    title: "Library room: visit notes",
    text: "Illustrative notes: the library room has step-free access and six worktables. A room booking and public liability cover still need to be confirmed.",
    author: "Jo",
  },
  {
    id: "input-budget",
    kind: "constraint",
    title: "Keep the first session small",
    text: "For this example, our planning ceiling is €600. Start with one Saturday session. Any spending needs a separate community decision.",
    author: "Alex",
  },
  {
    id: "input-skills",
    kind: "perspective",
    title: "Make space for beginners",
    text: "I can help mend clothes. I would like a beginner table where people can learn, even if they have never repaired anything.",
    author: "Noura",
  },
];
export const demoOutputs: Record<MissionStage, MissionOutput> = {
  research: {
    headline: "A small repair café has a practical starting point.",
    summary:
      "The contributed notes describe a possible venue, a spending ceiling, and an offer of help. Treat these as community input to confirm before committing.",
    findings: [
      {
        text: "The visit notes describe step-free access and six worktables; the room booking is still unconfirmed.",
        sourceIds: ["input-venue"],
      },
      {
        text: "The proposed ceiling is €600 for one Saturday, with spending subject to a separate decision.",
        sourceIds: ["input-budget"],
      },
    ],
    questions: [
      "Who can confirm the room booking and insurance requirements?",
      "Which repairs can volunteers safely support?",
      "What equipment is already available to borrow?",
    ],
    tasks: [],
    tool: null,
  },
  perspectives: {
    headline: "Start small. Leave room for people who are learning.",
    summary:
      "There are three contributions here. They provide useful starting constraints, but they do not establish community-wide agreement.",
    findings: [
      {
        text: "Noura offers clothes-mending skills and asks for a welcoming beginner table.",
        sourceIds: ["input-skills"],
      },
      {
        text: "Alex prefers one session with a spending ceiling; the venue notes flag unresolved practical requirements.",
        sourceIds: ["input-budget", "input-venue"],
      },
    ],
    questions: [
      "What would make this session accessible to people who have not contributed yet?",
      "Do potential volunteers share this proposed scope?",
    ],
    tasks: [],
    tool: null,
  },
  plan: {
    headline: "Three useful steps before the first repair.",
    summary:
      "A draft plan for people to review. These tasks gather the missing information before the community decides whether to go ahead.",
    findings: [
      {
        text: "Venue confirmation and volunteer input should come before purchases or promotion.",
        sourceIds: ["input-venue", "input-budget", "input-skills"],
      },
    ],
    questions: [
      "Who will bring the verified information back to the community?",
    ],
    tasks: [
      {
        title: "Confirm the venue and requirements",
        detail:
          "Ask the library about availability, accessible facilities, permitted activities, and insurance. Add the written response as a source.",
        minutes: 30,
      },
      {
        title: "Map the skills and tools people can offer",
        detail:
          "Collect practical offers of help. Include a beginner-friendly clothes-mending table and identify any gaps in supervision.",
        minutes: 20,
      },
      {
        title: "Bring back a costed first-session proposal",
        detail:
          "Use confirmed venue terms and equipment offers to prepare a budget within the proposed €600 ceiling. Request a separate spending decision.",
        minutes: 45,
      },
    ],
    tool: null,
  },
  tool: {
    headline: "A tiny tool to bring the right people together.",
    summary:
      "A form tailored to this mission. Review the questions, then publish it so members can offer skills and equipment.",
    findings: [
      {
        text: "A volunteer and equipment form can help answer the practical questions raised in the contributed notes.",
        sourceIds: ["input-skills", "input-venue"],
      },
    ],
    questions: [],
    tasks: [],
    tool: {
      title: "What could you bring to the repair café?",
      description:
        "Share a practical skill or a piece of equipment you could offer. No experience is needed to help.",
      fields: [
        {
          id: "f1",
          label: "How would you like to help?",
          kind: "choice",
          options: [
            "Clothes & textiles",
            "Welcome & organize",
            "Learn alongside someone",
            "Offer equipment",
          ],
          required: true,
        },
        {
          id: "f2",
          label: "What could you offer, or what would help you take part?",
          kind: "text",
          options: [],
          required: false,
        },
      ],
    },
  },
};
export function createDemoMission(): Mission {
  const stamp = new Date().toISOString();
  return {
    id: "repair-cafe-demo",
    title: "Let’s make repair the easy choice.",
    goal: "Bring neighbors together for a welcoming repair café. Start with one Saturday, learn what people need, and help useful things stay useful.",
    location: "Riverside · illustrative community",
    organizationId: "demo-community",
    createdBy: "demo-you",
    revision: 3,
    updatedAt: stamp,
    runLeaseUntil: null,
    creator: { name: "Alex" },
    organization: { name: "Riverside neighbors", slug: "demo" },
    canManage: true,
    searchAvailable: false,
    contributions: demoSources.map((source, i) => ({
      id: source.id,
      kind: source.kind,
      title: source.title,
      content: source.text,
      url: null,
      authorId: i === 1 ? "demo-you" : `demo-member-${i}`,
      author: { name: source.author! },
      createdAt: stamp,
    })),
    runs: (["tool", "plan", "perspectives", "research"] as MissionStage[]).map(
      (stage) => ({
        id: `demo-${stage}`,
        stage,
        status: "completed",
        inputRevision: 3,
        sources: demoSources,
        output: demoOutputs[stage],
        error: null,
        searchStatus: "not_requested",
        acceptedAt: null,
        createdAt: stamp,
        completedAt: stamp,
      }),
    ),
    tasks: [],
    toolResponses: [],
  };
}
