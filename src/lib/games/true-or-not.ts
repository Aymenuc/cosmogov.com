/**
 * Statements about how participation works. Kept to well-established
 * points; each has a one-line explanation.
 */
export interface Claim {
  text: string;
  truth: boolean;
  why: string;
}

export const CLAIMS: Claim[] = [
  {
    text: "A random sample of about 1,000 people can estimate a whole country's opinion to within a few percentage points.",
    truth: true,
    why: "With true random sampling, about 1,000 people gives a margin of error of roughly ±3 points, whatever the population size.",
  },
  {
    text: "The more signatures a petition has, the better it represents what everyone thinks.",
    truth: false,
    why: "Petitions are signed by people who choose to sign. A big number shows strong interest, not the view of everyone.",
  },
  {
    text: "In participatory budgeting, residents decide how part of a public budget is spent.",
    truth: true,
    why: "Residents propose projects and vote on them, and the council funds the winners within the set amount.",
  },
  {
    text: "Participatory budgeting is widely traced back to Porto Alegre, Brazil, in 1989.",
    truth: true,
    why: "Porto Alegre's experiment became the model that thousands of towns have since adapted.",
  },
  {
    text: "Citizens' assemblies usually choose their members by lottery, so the group looks like the wider population.",
    truth: true,
    why: "Members are drawn at random, usually with quotas for age, gender, area and so on, so it isn't only the usual voices.",
  },
  {
    text: "The wording of a survey question rarely changes the answers people give.",
    truth: false,
    why: "Small wording changes can shift answers a lot. Loaded or leading words push people towards one answer.",
  },
  {
    text: "An online-only consultation reaches every age group equally well.",
    truth: false,
    why: "Online-only tends to miss some groups, often older residents. Mixing online, paper and in-person reaches more people.",
  },
  {
    text: "Ireland held citizens' assemblies before its referendums on marriage equality and on abortion.",
    truth: true,
    why: "A Constitutional Convention (2012–14) and a Citizens' Assembly (2016–18) made recommendations before those votes.",
  },
  {
    text: "If most people in a meeting stay silent, it means they all agree.",
    truth: false,
    why: "Silence can mean doubt, shyness or feeling unheard. Ask each person directly before calling it agreement.",
  },
  {
    text: "Ranking options in order can produce a different winner than picking just one favourite.",
    truth: true,
    why: "Ranked methods count second and third choices, so a broadly liked option can beat one that only some people love.",
  },
  {
    text: "Open data means anyone can freely use, change and share the data.",
    truth: true,
    why: "That's the usual definition of open data: free to use, reuse and share, at most asking for credit.",
  },
  {
    text: "A question like 'Do you support lower taxes and better schools?' gives a clear answer.",
    truth: false,
    why: "It asks two things at once. Someone who wants one but not the other can't answer honestly.",
  },
  {
    text: "When two things happen together, one must have caused the other.",
    truth: false,
    why: "Correlation isn't causation. Both may be driven by something else, or it may be chance.",
  },
  {
    text: "A quorum is the minimum number of people who must take part for a decision to count.",
    truth: true,
    why: "Quorum rules stop a tiny group from making decisions on everyone's behalf.",
  },
  {
    text: "With a secret ballot, other people can see how you voted.",
    truth: false,
    why: "A secret ballot keeps each person's choice private, which protects people from pressure.",
  },
  {
    text: "Telling people what happened to their ideas after a consultation makes them more likely to take part again.",
    truth: true,
    why: "Closing the loop shows that taking part made a difference. Silence after a consultation is a common reason people give up.",
  },
];
