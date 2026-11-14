import {
  Flower2,
  Hammer,
  Search,
  Sparkles,
  TrafficCone,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Illustrative missions for the landing page. Every person, place, note and
 * draft here is invented for the example and is labelled as such on the page.
 * Nothing in this file is sent to or produced by a model.
 */
export type BoardStepId = "research" | "perspectives" | "plan" | "tool";

export const boardSteps: {
  id: BoardStepId;
  name: string;
  role: string;
  tint: "mint" | "peach" | "lilac" | "sun";
  icon: LucideIcon;
}[] = [
  {
    id: "research",
    name: "Scout",
    role: "Research",
    tint: "mint",
    icon: Search,
  },
  {
    id: "perspectives",
    name: "Bridge",
    role: "Perspectives",
    tint: "peach",
    icon: Users,
  },
  { id: "plan", name: "Maker", role: "A plan", tint: "lilac", icon: Hammer },
  { id: "tool", name: "Studio", role: "A form", tint: "sun", icon: Sparkles },
];

export type BoardDraft = {
  headline: string;
  points?: { text: string; refs: number[] }[];
  check?: string;
  tasks?: { title: string; minutes: number }[];
  form?: { question: string; options: string[]; prompt: string };
};

export type BoardMission = {
  id: string;
  chip: string;
  icon: LucideIcon;
  community: string;
  goal: string;
  references: string[];
  drafts: Record<BoardStepId, BoardDraft>;
};

export const boardMissions: BoardMission[] = [
  {
    id: "repair",
    chip: "Start a repair café",
    icon: Wrench,
    community: "Riverside neighbors",
    goal: "Let’s make repair the easy choice.",
    references: [
      "Library room notes, from Sam",
      "Room booking calendar",
      "Parents’ group message",
      "Night-shift neighbor’s note",
    ],
    drafts: {
      research: {
        headline: "There’s a room. Insurance is the open question.",
        points: [
          {
            text: "The library room is step-free and has six worktables.",
            refs: [1],
          },
          { text: "Saturday mornings are free until spring.", refs: [2] },
        ],
        check: "Who covers public liability during a session?",
      },
      perspectives: {
        headline: "People want it. They disagree on when.",
        points: [
          { text: "Parents asked for a weekend morning.", refs: [3] },
          {
            text: "A neighbor on night shifts asked for a weekday evening.",
            refs: [4],
          },
        ],
        check: "Nobody under 25 has added a view yet.",
      },
      plan: {
        headline: "Three small tasks before the first session.",
        tasks: [
          { title: "Ask the library about insurance", minutes: 30 },
          { title: "Write a one-page safety sheet", minutes: 45 },
          { title: "Find three fixers for day one", minutes: 60 },
        ],
      },
      tool: {
        headline: "A sign-up for skills and tools.",
        form: {
          question: "What could you help fix?",
          options: ["Bikes", "Clothes", "Electronics", "Furniture"],
          prompt: "Something you could lend",
        },
      },
    },
  },
  {
    id: "crossing",
    chip: "Make a crossing safer",
    icon: TrafficCone,
    community: "Elm Street families",
    goal: "A safer way across Elm Street.",
    references: [
      "Near-miss log kept by parents",
      "Council page on crossing requests",
      "Walking group’s message",
      "Corner shop owner’s note",
    ],
    drafts: {
      research: {
        headline: "The request needs a count. Nobody has one yet.",
        points: [
          { text: "Parents logged three near-misses this term.", refs: [1] },
          {
            text: "The council asks for a traffic count with each request.",
            refs: [2],
          },
        ],
        check: "How many children cross between 8 and 9 in the morning?",
      },
      perspectives: {
        headline: "Same worry, two different fixes.",
        points: [
          { text: "The walking group wants a zebra crossing.", refs: [3] },
          {
            text: "The shop owner worries about losing two parking spaces.",
            refs: [4],
          },
        ],
        check: "No one from the bus route has been asked.",
      },
      plan: {
        headline: "Count first. Then ask.",
        tasks: [
          { title: "Count crossings on two mornings", minutes: 60 },
          { title: "Ask the shop owner what would work", minutes: 20 },
          { title: "Send the request with the count", minutes: 40 },
        ],
      },
      tool: {
        headline: "A sign-up for the morning count.",
        form: {
          question: "Which morning could you count?",
          options: ["Tuesday", "Thursday", "Either one"],
          prompt: "Anything we should know",
        },
      },
    },
  },
  {
    id: "park",
    chip: "Plant a pocket park",
    icon: Flower2,
    community: "Canal Row",
    goal: "Turn the empty corner into a pocket park.",
    references: [
      "Land register note, from Priya",
      "Photos of the plot",
      "Seniors’ lunch club notes",
      "Playgroup message",
    ],
    drafts: {
      research: {
        headline: "The land is public. Water is the unknown.",
        points: [
          { text: "The corner plot belongs to the council.", refs: [1] },
          { text: "It gets sun from late morning.", refs: [2] },
        ],
        check: "Is there a water point within reach?",
      },
      perspectives: {
        headline: "Somewhere to sit, and somewhere to play.",
        points: [
          { text: "The lunch club asked for benches in the shade.", refs: [3] },
          { text: "The playgroup asked for a corner to dig in.", refs: [4] },
        ],
        check: "Dog walkers haven’t replied yet.",
      },
      plan: {
        headline: "Start with permission and a sketch.",
        tasks: [
          { title: "Ask the council about using the plot", minutes: 30 },
          { title: "Sketch two layouts to compare", minutes: 60 },
          { title: "Check for a water point", minutes: 20 },
        ],
      },
      tool: {
        headline: "A quick question for the street.",
        form: {
          question: "What would you use it for?",
          options: ["Sitting", "Playing", "Growing food", "Dog walks"],
          prompt: "One thing it should have",
        },
      },
    },
  },
];
