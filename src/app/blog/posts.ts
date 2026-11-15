const refreshedOn = { date: "2026-11-15", label: "November 15, 2026" };

interface Post {
  slug: string;
  title: string;
  date: string;
  dateLabel: string;
  summary: string;
  updated?: typeof refreshedOn;
  sections: { heading: string; paragraphs: string[] }[];
}

export const posts: Post[] = [
  {
    slug: "from-an-idea-to-a-repair-cafe",
    title: "From an idea to a repair café",
    date: "2026-11-15",
    dateLabel: "November 15, 2026",
    summary: "Walk through an example mission, from finding out what neighbors need to planning the first repair session.",
    sections: [
      {
        heading: "Start with a question people can answer",
        paragraphs: [
          "Could a monthly repair café help neighbors fix household items? That question is concrete enough for a first mission. Add what you already know, such as possible locations and who has offered to help. Leave room for the people affected to change the plan.",
          "In the example mission, Scout drafts a brief from the material it receives and flags what still needs checking. For a real event, confirm venue access, costs and opening hours with the people responsible.",
        ],
      },
      {
        heading: "Turn input into the first few tasks",
        paragraphs: [
          "Bridge can group neighbors’ comments into themes. Check whether the draft preserved disagreements about location, times or the kinds of repairs people want. Maker can turn the reviewed material into tasks, such as confirming a venue or collecting offers from volunteer repairers.",
          "Use Studio or the form editor to create an interest form. Decide who can see the answers and how long they should be kept. A separate opt-in lets people volunteer to be considered for a task.",
        ],
      },
      {
        heading: "Record what actually happened",
        paragraphs: [
          "Once the community approves a plan, use the action board to assign work and record completion. A note and an evidence link can help the next organizer see which steps are done. If others could use the plan, save the relevant text as a template after checking it for private details.",
        ],
      },
    ],
  },
  {
    slug: "the-future-of-participatory-democracy",
    title: "Designing a decision people can take part in",
    date: "2026-04-18",
    dateLabel: "April 18, 2026",
    updated: refreshedOn,
    summary: "Make the decision clear, choose a way to gather input, and report what happens after people take part.",
    sections: [
      {
        heading: "Explain the decision before opening it",
        paragraphs: [
          "Tell people what they can influence, who is responsible for the final decision, and when you need input. For a small grants budget, for example, publish the amount available, eligibility rules and the date the group will select projects.",
          "Give people enough information to consider the options. Offer a way to ask questions before the vote or submission deadline, and make clear how you will share the outcome.",
        ],
      },
      {
        heading: "Choose a tool that fits the work",
        paragraphs: [
          "Use an assembly for discussion, an initiative to collect support for a request, or a budget activity to allocate funds between projects. If you need a vote on a defined question, a proposal gives the group a place to explain the options and record a result.",
          "Record the next action and who owns it. A short follow-up with a date is easier for people to act on than a result with no explanation.",
        ],
      },
    ],
  },
  {
    slug: "how-ai-is-transforming-civic-engagement",
    title: "Using AI in a community mission",
    date: "2026-04-10",
    dateLabel: "April 10, 2026",
    updated: refreshedOn,
    summary: "Give AI a specific drafting task, check the source material, and decide together what to use.",
    sections: [
      {
        heading: "Give each draft a clear job",
        paragraphs: [
          "Scout can prepare a research draft, Bridge can summarize input, Maker can propose a plan, and Studio can draft a form. Run only the steps you need. A group with a clear plan can go straight to writing a form.",
          "Review the material included in an AI request. Names or details written inside a source can be sent with its text. Remove private material that the task does not need.",
        ],
      },
      {
        heading: "Check the draft with people who know the issue",
        paragraphs: [
          "Open cited sources, check dates and local constraints, and look for views the draft left out. A summary of a neighborhood discussion should preserve important disagreements and clearly distinguish what was said from any suggested next steps.",
          "Adopt a plan after your group has reviewed its tasks. Before publishing a form, check questions, response access, and the notice people will see.",
        ],
      },
    ],
  },
  {
    slug: "building-trust-through-transparent-governance",
    title: "Make follow-through visible",
    date: "2026-03-28",
    dateLabel: "March 28, 2026",
    updated: refreshedOn,
    summary: "Record next steps, explain deadlines, and share the evidence that the community is allowed to see.",
    sections: [
      {
        heading: "Show what changed after the decision",
        paragraphs: [
          "If a proposal moves forward, say who took responsibility for the next step and when the community can expect an update. If it stalls, explain what is still needed. Cosmogov’s Accountability view brings together visible milestones, formal response deadlines and recent mission outcomes.",
        ],
      },
      {
        heading: "Share evidence with the right audience",
        paragraphs: [
          "A link to a meeting record, a public report, or a photo of completed work can help people understand an update. Members provide the evidence, so readers may still need to verify it. Keep private form responses and identifiable voting records out of public updates.",
        ],
      },
    ],
  },
  {
    slug: "gamification-in-public-policy",
    title: "Recognizing community contributions",
    date: "2026-03-15",
    dateLabel: "March 15, 2026",
    updated: refreshedOn,
    summary: "How the community map, sticker book and civic record make it easier to notice what people contribute.",
    sections: [
      {
        heading: "Make progress easier to find",
        paragraphs: [
          "The community map shows activity tied to places. The civic record gives participants a place to revisit their own contributions, and the sticker book marks milestones in the workspace.",
          "Recognition can help people find a next step. Keep decisions fair by making participation rules clear and giving people the same voting choices regardless of recognition. Cosmogov does not award points for casting proposal votes.",
        ],
      },
    ],
  },
];
