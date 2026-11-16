/**
 * Thinking traps heard at real community meetings. Each has the trap's
 * name, a one-line explanation, and a fairer way to make the same point.
 * Definitions follow standard descriptions of cognitive biases and
 * informal fallacies.
 */
export interface Trap {
  quote: string;
  trap: string;
  why: string;
  fairer: string;
}

export const TRAPS: Trap[] = [
  {
    quote: "We've already spent two years and €80,000 on the tram study. We can't drop it now.",
    trap: "Sunk cost",
    why: "Money already spent can't be recovered either way. The choice should rest on what each option costs and delivers from here on.",
    fairer: "Ignoring what's spent, is the tram still the best use of the next euro?",
  },
  {
    quote: "The first quote we got was €2 million, so €1.6 million sounds like a bargain.",
    trap: "Anchoring",
    why: "The first number heard sets a reference point, even when it was arbitrary. €1.6 million is only a bargain if it's good value on its own terms.",
    fairer: "What would a fair price be if we'd never seen the first quote?",
  },
  {
    quote: "I've only read the reports that back the bike lane, and they all agree with me.",
    trap: "Confirmation bias",
    why: "Seeking out only supporting evidence makes any view look stronger than it is.",
    fairer: "What's the strongest evidence against the bike lane, and does it change anything?",
  },
  {
    quote: "Everyone on the residents' group chat is voting yes, so it must be right.",
    trap: "Bandwagon",
    why: "Popularity isn't evidence. A group chat may also be a narrow slice of the neighbourhood.",
    fairer: "What are the reasons people give for voting yes, and do they hold up?",
  },
  {
    quote: "There was a burglary on my street last week, so crime must be rising everywhere.",
    trap: "Availability",
    why: "A vivid recent event feels common, but one case says little about the overall trend.",
    fairer: "What do the figures for the last few years show?",
  },
  {
    quote: "We've always held the market on Thursdays. Why change something that's always been this way?",
    trap: "Appeal to tradition",
    why: "Something being long-standing doesn't show it's still the best option.",
    fairer: "What does Thursday do well, and would another day serve people better?",
  },
  {
    quote: "Either we close the library or we raise council tax by 10%. There's no other way.",
    trap: "False dilemma",
    why: "Presenting only two options hides others, such as shorter hours, shared buildings or other savings.",
    fairer: "What are all the ways we could close the funding gap?",
  },
  {
    quote: "So you want cars banned from the whole town? That's ridiculous.",
    trap: "Straw man",
    why: "The proposal was a car-free Saturday on one street. Attacking an exaggerated version avoids the real one.",
    fairer: "You're proposing one car-free day on the high street. Here's my concern about deliveries.",
  },
  {
    quote: "Why listen to her idea about the park? She doesn't even own a house here.",
    trap: "Personal attack",
    why: "Judging the person instead of the idea. Renters use the park too, and the idea stands or falls on its merits.",
    fairer: "What would her idea mean for maintenance costs and park users?",
  },
  {
    quote: "If we allow one food truck in the square, soon it'll be a car park full of them.",
    trap: "Slippery slope",
    why: "It assumes one step leads to an extreme outcome without showing how.",
    fairer: "Could we trial one truck with clear limits and review it in three months?",
  },
  {
    quote: "Every shop that stayed open on this street did fine, so the rent rise isn't hurting anyone.",
    trap: "Survivorship bias",
    why: "It only looks at the shops that survived. The ones that closed are the evidence that matters here.",
    fairer: "How many shops closed since the rent rise, and why?",
  },
  {
    quote: "I asked three neighbours and they all hate the new bins, so the whole town does.",
    trap: "Hasty generalisation",
    why: "Three people are far too few, and neighbours tend to think alike.",
    fairer: "Could we run a short survey across different streets first?",
  },
  {
    quote: "A famous economist said roundabouts are always better, so we should build one here.",
    trap: "Appeal to authority",
    why: "An expert in one field isn't automatically right about a specific junction. The traffic data for this junction matters more.",
    fairer: "What do the traffic counts and accident records for this junction say?",
  },
  {
    quote: "You complain about our noise rules, but your town allows fireworks every weekend!",
    trap: "Whataboutism",
    why: "Pointing at someone else's failings doesn't answer the criticism.",
    fairer: "Fair point about our rules. Here's why we set them the way we did.",
  },
  {
    quote: "We'd lose 20 parking spaces. Who cares that we'd gain a playground for 300 kids?",
    trap: "Loss aversion",
    why: "Losses loom larger than equal or bigger gains. Both sides of the trade-off deserve equal weight.",
    fairer: "Let's weigh the 20 spaces against the playground on the same scale.",
  },
  {
    quote: "The mayor is so charming. I'm sure her budget plan is sound too.",
    trap: "Halo effect",
    why: "Liking one quality of a person spills over into judging unrelated things they do.",
    fairer: "Charm aside, what do the budget figures actually show?",
  },
  {
    quote: "Nobody on the committee raised concerns, so we must all agree. Let's not slow things down.",
    trap: "Groupthink",
    why: "Silence isn't agreement. Pressure to keep harmony can stop people raising real problems.",
    fairer: "Before we decide, can each person name one risk they see?",
  },
  {
    quote: "Since the new speed bumps went in, house prices went up. The bumps raised prices.",
    trap: "False cause",
    why: "Two things happening together doesn't mean one caused the other. Prices may have risen for other reasons.",
    fairer: "Did prices rise more here than on similar streets without speed bumps?",
  },
  {
    quote: "Let's keep the current bus timetable. Changing it is too risky.",
    trap: "Status quo bias",
    why: "Preferring things as they are just because they're familiar. Keeping things the same has costs and risks too.",
    fairer: "What are the risks of keeping the timetable, compared with changing it?",
  },
  {
    quote: "A good neighbour would never question the committee's decision.",
    trap: "No true Scotsman",
    why: "It redefines 'good neighbour' to exclude anyone who disagrees, so it can't be challenged.",
    fairer: "Good neighbours can disagree. What's the concern with the decision?",
  },
];
