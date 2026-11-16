/**
 * Short, made-up stories of community projects that went wrong. Each has
 * six events in order and the one where it really started to go wrong.
 */
export interface Story {
  title: string;
  outcome: string;
  events: string[];
  turn: number;
  why: string;
}

export const STORIES: Story[] = [
  {
    title: "The playground nobody used",
    outcome: "A new €60,000 playground stood empty a year after opening.",
    events: [
      "Residents asked for more play space for young children.",
      "The council chose a site behind the sports centre because the land was free.",
      "A design firm drew a large climbing frame for 8–12 year olds.",
      "The plans were shown at one evening meeting; twelve people came.",
      "Building finished on time and on budget.",
      "Parents said the site was too far from homes and the equipment too big for toddlers.",
    ],
    turn: 1,
    why: "Picking the site because it was free, not because families could reach it, set up everything that followed. The design and the thin consultation made it worse, but the location was the first wrong turn.",
  },
  {
    title: "The survey that backfired",
    outcome: "A survey on bin collections was rejected as unfair, and had to be run again.",
    events: [
      "The council wanted to know whether to collect bins every two weeks.",
      "The survey was put online only, with two weeks to reply.",
      "The first question read: 'Do you support saving money with fortnightly collections?'",
      "1,200 people replied, mostly in their 30s and 40s.",
      "The council announced 70% support.",
      "Older residents and a local paper said the question was loaded.",
    ],
    turn: 2,
    why: "A leading question ('saving money') pushes people towards one answer. Online-only access narrowed who replied, but the loaded wording is what made the result unusable.",
  },
  {
    title: "The bike lane reversal",
    outcome: "A bike lane was removed six months after opening, at double the cost.",
    events: [
      "Cycling groups asked for a protected lane on Station Road.",
      "Engineers studied traffic and found space for a lane.",
      "The lane was built in three weeks, with signs going up the day before.",
      "Shop owners found out when delivery vans could no longer stop outside.",
      "A petition against the lane gathered 2,000 signatures.",
      "The council removed the lane.",
    ],
    turn: 2,
    why: "Building first and telling people the day before meant the shops' delivery needs never came up. A loading bay agreed in advance could have saved the lane.",
  },
  {
    title: "The community garden feud",
    outcome: "A shared garden split into two rival groups and closed.",
    events: [
      "Neighbours turned an empty lot into a garden.",
      "Thirty people joined in the first summer.",
      "Nobody wrote down how plots were shared or who decided things.",
      "Two members started taking the best plots every spring.",
      "Arguments spilled into a public meeting.",
      "The landowner closed the garden to stop the conflict.",
    ],
    turn: 2,
    why: "Without simple shared rules, every later dispute had no fair way to be settled. The plot-grabbing was a symptom of that gap.",
  },
  {
    title: "The participatory budget nobody trusted",
    outcome: "Turnout fell from 4,000 to 600 in the second year.",
    events: [
      "The town set aside €500,000 for residents to decide on.",
      "Residents proposed 80 projects, and 4,000 people voted.",
      "Five projects won.",
      "Two winning projects were quietly dropped as 'technically difficult'.",
      "No update was published about the others.",
      "Second-year turnout collapsed.",
    ],
    turn: 3,
    why: "Dropping winning projects without explanation broke the promise that votes count. The missing updates deepened the distrust, but the quiet cancellation was the turning point.",
  },
  {
    title: "The consultation that came too late",
    outcome: "A housing plan faced a legal challenge and a two-year delay.",
    events: [
      "A developer and the council agreed a plan for 300 homes.",
      "Contracts and the design were signed off.",
      "A public consultation opened with the plans already final.",
      "Residents asked about school places and got no answer.",
      "A residents' group hired a lawyer.",
      "A court paused the project.",
    ],
    turn: 2,
    why: "Consulting after everything was decided made the consultation feel like a formality, so people turned to the courts. Asking before the design was fixed could have shaped the plan.",
  },
  {
    title: "The volunteer drop-off",
    outcome: "A repair café with forty volunteers ended with four.",
    events: [
      "The repair café opened with forty keen volunteers.",
      "A few volunteers did most of the organising.",
      "Organisers changed the date each month with a week's notice.",
      "Volunteers missed sessions because of clashes.",
      "Fewer repairs got done, and visitors stopped coming.",
      "The café closed for the winter and didn't reopen.",
    ],
    turn: 2,
    why: "Volunteers need predictable times to fit around their lives. Moving the date at short notice drove the drop-off that followed.",
  },
  {
    title: "The neighbourhood app",
    outcome: "A €40,000 neighbourhood app was switched off after a year.",
    events: [
      "The council wanted a better way to hear from residents.",
      "It bought an app before asking residents how they'd like to take part.",
      "The app needed a smartphone and a new account.",
      "Downloads were mostly from people already active in local groups.",
      "Older residents kept phoning and writing letters.",
      "Use dropped, and the app was switched off.",
    ],
    turn: 1,
    why: "Choosing the tool before understanding how people wanted to take part meant it fitted the people already involved, not those the council most needed to hear from.",
  },
];
