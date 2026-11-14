/**
 * Mission starters for different kinds of groups. A starter only prefills the
 * new-mission form with a title and a goal; people edit both before saving.
 */
export type GroupKind =
  "neighborhood" | "school" | "workplace" | "club" | "business" | "public";

export const groupKinds: { id: GroupKind; label: string; blurb: string }[] = [
  {
    id: "neighborhood",
    label: "Neighborhood",
    blurb: "A street, a block, a building.",
  },
  { id: "school", label: "School", blurb: "Families, staff and students." },
  { id: "workplace", label: "Workplace", blurb: "A team or a whole company." },
  {
    id: "club",
    label: "Club or association",
    blurb: "Members, volunteers, a committee.",
  },
  {
    id: "business",
    label: "Local business",
    blurb: "You, your customers, your street.",
  },
  {
    id: "public",
    label: "City hall",
    blurb: "A council, a service, a public body.",
  },
];

export type Starter = { title: string; goal: string };

export const startersByKind: Record<GroupKind, Starter[]> = {
  neighborhood: [
    {
      title: "Start a repair café",
      goal: "Set up a regular repair session where neighbors fix things together. Find a room, the skills and tools people can offer, and what would make it easy to join.",
    },
    {
      title: "Make a crossing safer",
      goal: "Make one street crossing safer for the people who use it. Gather what neighbors have seen, check who decides, and prepare a request the community agrees on.",
    },
    {
      title: "Welcome new neighbors",
      goal: "Help people who have just moved in feel at home. Collect the local knowledge worth sharing, find who can help, and plan a simple welcome.",
    },
  ],
  school: [
    {
      title: "Run a walking bus",
      goal: "Organize adults to walk groups of children to school along a set route. Find the routes families need, the mornings people can cover, and the rules to follow.",
    },
    {
      title: "Fix up the playground",
      goal: "Improve the playground with the children, families and staff who use it. Gather ideas, check safety and budget limits, and plan a work day.",
    },
    {
      title: "Start a homework club",
      goal: "Open an after-school homework club. Understand what students need, find volunteers and a room, and agree how it will run.",
    },
  ],
  workplace: [
    {
      title: "Plan the team day together",
      goal: "Plan a team day that works for everyone. Collect constraints such as dates, access needs and budget, gather ideas, and turn them into a plan people can sign up to.",
    },
    {
      title: "Cut our office waste",
      goal: "Reduce the waste our workplace produces. Find out where it comes from, collect ideas from the people doing the work, and choose a few changes to try.",
    },
    {
      title: "Make the first week kinder",
      goal: "Improve how new colleagues are welcomed. Ask recent joiners what helped and what was missing, and prepare a short checklist the team agrees on.",
    },
  ],
  club: [
    {
      title: "Find next season’s volunteers",
      goal: "Fill the volunteer roles for next season. List what needs doing, ask members what they can offer and when, and match offers to roles.",
    },
    {
      title: "Refresh the clubhouse",
      goal: "Improve our shared space with the members who use it. Gather what bothers people most, check the budget, and plan the work in small tasks.",
    },
    {
      title: "Plan the annual event",
      goal: "Plan this year’s main event with members. Collect ideas and constraints, agree the essentials, and share out the tasks.",
    },
  ],
  business: [
    {
      title: "Ask customers what to stock",
      goal: "Find out what our customers wish we offered. Gather their suggestions and our practical limits, and decide a few things to try.",
    },
    {
      title: "Plan a street market",
      goal: "Organize a market day with the other businesses on our street. Find who wants to take part, what permission is needed, and who can do what.",
    },
    {
      title: "Team up with the neighbors",
      goal: "Start a simple scheme with nearby shops and residents, such as shared deliveries or a local loyalty card. Understand what people would use and what it would take.",
    },
  ],
  public: [
    {
      title: "Co-design a pocket park",
      goal: "Design a small public space with the residents who will use it. Gather local knowledge and constraints, compare options, and prepare a plan for a decision.",
    },
    {
      title: "Plan a clean-up day",
      goal: "Organize a clean-up day with residents. Find the places that need it, the equipment the service can provide, and the volunteers and times that work.",
    },
    {
      title: "Collect ideas for a youth budget",
      goal: "Invite young residents to propose how a youth budget is used. Explain the limits, gather ideas, and prepare them for a fair decision.",
    },
  ],
};

export const defaultGroupKind: GroupKind = "neighborhood";
export const isGroupKind = (value: unknown): value is GroupKind =>
  groupKinds.some((kind) => kind.id === value);
