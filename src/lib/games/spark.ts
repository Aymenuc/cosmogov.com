export const stages = [
  "lobby",
  "pitch",
  "remix",
  "debate",
  "ballot",
  "reveal",
  "recap",
] as const;
export type Stage = (typeof stages)[number];
export const labels: Record<Stage, string> = {
  lobby: "Green room",
  pitch: "Pitch sprint",
  remix: "Wildcard relay",
  debate: "Switch sides",
  ballot: "Secret ballot",
  reveal: "Cup reveal",
  recap: "Experiment card",
};
export const wildcards = [
  {
    name: "Pocket edition",
    cue: "Shrink the idea until two people could try it next week.",
  },
  {
    name: "Empty wallet",
    cue: "Make this work with the tools and budget you already have.",
  },
  {
    name: "New arrival",
    cue: "Change one detail so a new teammate could take part on day one.",
  },
  {
    name: "Time traveller",
    cue: "Imagine this flopped in two weeks. Change one thing to prevent that.",
  },
  {
    name: "Across time zones",
    cue: "Give someone who misses the meeting a real part in the experiment.",
  },
  {
    name: "Proof detective",
    cue: "Add one small, observable sign that this actually helped.",
  },
];
export const sampleTopics = [
  "How could another project team give useful feedback while a research draft is still taking shape?",
  "What could make Monday handovers take ten minutes less?",
  "How could colleagues in another time zone shape a decision before the meeting?",
];
export const capacity = 36;
export const roomLife = 7 * 86400;
export interface Experiment {
  step: string;
  owner: string;
  checkIn: string;
  signal: string;
  concern: string;
}
export interface SparkCard {
  id: string;
  pitch: string;
  riffs: string[];
  votes?: number;
}
export interface SparkView {
  code: string;
  topic: string;
  stage: Stage;
  count: number;
  pitchCount: number;
  riffCount: number;
  voteCount: number;
  covered: number;
  cards: SparkCard[];
  endsAt: number | null;
  remaining: number | null;
  now: number;
  own: {
    idea: string;
    pitch: string;
    lens: number;
    riff: string;
    target: string;
    vote: string;
  } | null;
  winner: string | null;
  experiment: Experiment | null;
}
export interface RoomSummary {
  code: string;
  topic: string;
}
