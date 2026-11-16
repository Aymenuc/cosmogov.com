import type { ToolArtName } from "./ToolArt";

/**
 * Each workspace section's own face: a tint from the shared palette, a
 * headline in plain words (the same "want" the Explore page uses), a reason
 * to take part, and an empty state. Reasons never promise a reward for
 * voting or signing (see CIVIC_INTEGRITY.md); sticker nudges only point at
 * helping actions that earn stickers.
 */
export type Tint = "lilac" | "mint" | "sky" | "sun" | "peach";

export interface ToolLook {
  tint: Tint;
  headline: string;
  cheer: string;
  empty?: { title: string; text: string };
  /** Sticker ids for the "almost there" nudge; "any" = the closest overall. */
  nudge?: string[] | "any";
}

export const toolLooks: Record<ToolArtName, ToolLook> = {
  budget: {
    tint: "mint",
    headline: "Share out a budget",
    cheer: "Your allocation shows what matters most to people here, and you can change it while voting is open.",
    empty: {
      title: "No budget to share out yet",
      text: "When a budgeting process opens its projects, they’ll appear here for you to back with your allocation.",
    },
  },
  surveys: {
    tint: "sky",
    headline: "Ask what people think",
    cheer: "A few quick answers help organisers hear more than the loudest voices.",
    empty: {
      title: "No surveys yet",
      text: "Got a question for your community? A short survey is the quickest way to get a sense of the room.",
    },
  },
  initiatives: {
    tint: "peach",
    headline: "Gather support for an idea",
    cheer: "An idea with visible backing is much harder to ignore.",
    empty: {
      title: "No initiatives yet",
      text: "Have an idea worth backing? Launch an initiative and invite people to add their name.",
    },
  },
  assemblies: {
    tint: "lilac",
    headline: "Talk it through",
    cheer: "Good decisions start with people hearing each other out.",
    nudge: ["good-neighbor", "host"],
    empty: {
      title: "No assemblies yet",
      text: "Pull up a chair: create the first assembly and invite your community to talk an issue through.",
    },
  },
  sortition: {
    tint: "sun",
    headline: "Pick a panel by lottery",
    cheer: "A random draw brings in people who wouldn’t usually be in the room.",
    empty: {
      title: "No lottery pools yet",
      text: "Create a pool, let people volunteer, and draw a fair panel at random.",
    },
  },
  legislation: {
    tint: "sky",
    headline: "Shape a rule or policy",
    cheer: "A comment on a draft is easier than a complaint about the final rule.",
    empty: {
      title: "No drafts to read yet",
      text: "When a rule or policy is proposed, its draft will appear here for comments and suggested changes.",
    },
  },
  accountability: {
    tint: "mint",
    headline: "See what happened next",
    cheer: "Promises are easier to keep when people are watching.",
    nudge: ["done-and-dusted", "handy"],
    empty: {
      title: "Nothing to follow up yet",
      text: "Once a proposal is accepted and milestones are set, you’ll see here what was promised and what’s been done.",
    },
  },
  binding: {
    tint: "sun",
    headline: "Ask for a formal response",
    cheer: "Every step and threshold is shown up front, so you know what your support can and can’t do.",
    empty: {
      title: "No formal proposals yet",
      text: "Start one when an idea needs an official answer. Signatures are reviewed before they count.",
    },
  },
  meetings: {
    tint: "mint",
    headline: "Get together",
    cheer: "Showing up, in person or online, is still the fastest way to get things moving.",
    nudge: ["good-neighbor", "host"],
    empty: {
      title: "No meetings planned yet",
      text: "Schedule the first one, in person, online or both, and give people a reason to show up.",
    },
  },
  pulse: {
    tint: "peach",
    headline: "Feel the community’s heartbeat",
    cheer: "A quick look at what’s moving, so you know where your voice is needed.",
  },
  analytics: {
    tint: "sun",
    headline: "See how your community takes part",
    cheer: "Spot the quiet corners, then start the conversation.",
    nudge: ["conversation-starter", "local-spark"],
  },
  agents: {
    tint: "lilac",
    headline: "Meet your AI helpers",
    cheer: "They do the legwork. People make every decision.",
    nudge: ["first-spark", "your-call"],
  },
  games: {
    tint: "mint",
    headline: "Practise thinking together",
    cheer: "A few minutes of play sharpens how you weigh evidence. Games never change the weight of a vote.",
  },
  reputation: {
    tint: "peach",
    headline: "Your story of showing up",
    cheer: "It grows when you help out, never when you vote.",
    nudge: "any",
  },
  explore: {
    tint: "sky",
    headline: "See what's happening, anywhere",
    cheer: "Good ideas travel. See what other places are trying, and borrow what works.",
    nudge: ["on-the-map"],
  },
  government: {
    tint: "lilac",
    headline: "Answer your community on the record",
    cheer: "Every reply carries your name, and the people who signed are told when you respond.",
  },
  process: {
    tint: "sky",
    headline: "Shared work, in stages",
    cheer: "Each stage builds on the last, so it's worth joining early.",
  },
  debates: {
    tint: "sky",
    headline: "Talk it through, with a little help",
    cheer: "AI helpers summarise, translate and simplify. People make every decision.",
    nudge: ["good-neighbor", "thinking-out-loud"],
  },
  assistant: {
    tint: "sun",
    headline: "A little clarity, with AI",
    cheer: "Ask about a community matter. It can be wrong, so check what matters.",
  },
  discussions: {
    tint: "mint",
    headline: "Chat with your neighbours",
    cheer: "Small conversations are where most good ideas start.",
    nudge: ["thinking-out-loud"],
  },
  activity: {
    tint: "sun",
    headline: "Celebrate the regulars",
    cheer: "Thank the people who keep things moving. Activity never changes the weight of a vote.",
  },
};
