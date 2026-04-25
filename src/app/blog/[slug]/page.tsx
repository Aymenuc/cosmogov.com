'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Rocket, Calendar, ArrowLeft, User } from 'lucide-react';
import Footer from '@/components/Footer';

function Starfield() {
  return <div className="fixed inset-0 starfield opacity-20 pointer-events-none" />;
}

interface Post {
  slug: string;
  title: string;
  date: string;
  accent: string;
  content: string[];
}

const posts: Post[] = [
  {
    slug: 'the-future-of-participatory-democracy',
    title: 'The Future of Participatory Democracy',
    date: 'April 18, 2026',
    accent: 'teal',
    content: [
      `Across every continent, a quiet revolution is reshaping how citizens interact with their governments. Participatory democracy — the idea that people should have a direct say in the decisions that affect their lives — has moved from the margins of political theory into the mainstream of civic practice. From municipal budgeting in South America to digital deliberation platforms in Northern Europe, the global trend is unmistakable: citizens are no longer content to simply elect representatives every few years and hope for the best. They demand ongoing, meaningful involvement in governance, and they are building the tools to make it happen.`,
      `Some of the most compelling evidence comes from real-world case studies that have proven the viability of large-scale participation. Barcelona's Decidim platform, launched in 2016, has enabled over 40,000 residents to co-create city policy through proposals, debates, and binding votes on issues ranging from urban planning to social housing. In Iceland, the 2011 constitutional crowdsourcing effort invited citizens to draft a new constitution through social media collaboration, producing a document that — while ultimately blocked by parliament — demonstrated that ordinary people can engage with complex legal frameworks when given the right tools. Taiwan's vTaiwan platform has taken a different approach, using structured online deliberation to build consensus on divisive issues like Uber regulation and same-sex marriage, achieving outcomes that satisfied over 80% of participants across the political spectrum.`,
      `Technology is the engine that makes this scale of participation possible. Before the internet, participatory democracy was limited by geography, time, and the sheer logistical challenge of gathering thousands of people in one room. Today, digital platforms can facilitate deliberation among millions, enabling asynchronous discussion, real-time polling, and AI-moderated debate that would have been unimaginable a decade ago. The COVID-19 pandemic accelerated this transition dramatically, as governments that had previously relied on town hall meetings were forced to move online — and discovered that digital participation often yielded higher engagement, broader representation, and more thoughtful input than their in-person equivalents.`,
      `Yet the promise of technology-powered participation comes with serious challenges that cannot be ignored. The digital divide remains a fundamental barrier: communities with limited internet access or low digital literacy are systematically excluded from online deliberation, creating a participation gap that mirrors and often exacerbates existing inequalities. Representation gaps persist even among connected populations — studies consistently show that online civic participants skew wealthier, more educated, and more politically engaged than the general population. Perhaps most insidiously, there is the risk of tokenistic engagement, where institutions adopt participatory platforms for the appearance of inclusion while retaining tight control over which proposals are actually implemented, undermining trust rather than building it.`,
      `The next generation of participatory tools offers genuine hope for addressing these shortcomings. AI-assisted deliberation systems can identify the most constructive contributions in a sea of noise, ensuring that thoughtful minority voices are not drowned out by the loudest participants. Real-time sentiment analysis can detect when discussions are becoming polarized and introduce bridging prompts that reframe debates in ways that find common ground. Predictive governance models can simulate the likely outcomes of proposed policies before they are implemented, giving citizens the ability to make truly informed choices rather than voting on abstract promises. These tools do not replace human judgment — they augment it, making democratic participation more efficient, more equitable, and more consequential.`,
      `At CosmoGov, our vision for the future of participatory democracy is rooted in the belief that technology should serve as an amplifier of human agency, not a substitute for it. We are building a platform where every citizen can propose, deliberate, and decide with the same analytical power that was once reserved for professional policymakers. Our six specialized AI agents — from the Proposal Drafter that helps translate ideas into actionable legislation, to the Bias Detector that ensures deliberation remains fair and inclusive — are designed to level the playing field and make genuine participation accessible to everyone, regardless of their expertise or background. The future of democracy is not just about giving people a vote — it is about giving them the tools to make that vote meaningful.`,
    ],
  },
  {
    slug: 'how-ai-is-transforming-civic-engagement',
    title: 'How AI is Transforming Civic Engagement',
    date: 'April 10, 2026',
    accent: 'violet',
    content: [
      `Artificial intelligence is reshaping every sector of modern life, and civic technology stands at the frontier of this transformation. The promise of AI in governance extends far beyond automating bureaucratic processes — it offers the possibility of fundamentally reimagining how citizens interact with their institutions, how policies are crafted and evaluated, and how the gap between public will and governmental action can be narrowed. At its best, AI-powered civic engagement can make participation more accessible, more informed, and more impactful than ever before. But realizing this promise requires navigating a complex landscape of technical, ethical, and democratic challenges.`,
      `One of the most immediately transformative applications of AI in civic engagement is AI-powered proposal drafting and analysis. Historically, crafting effective policy proposals required specialized legal knowledge, access to regulatory databases, and hours of research that most citizens could not afford. Today, AI systems can analyze existing legislation, identify gaps and inconsistencies, and generate draft proposals that comply with legal frameworks while faithfully reflecting a citizen's intent. At CosmoGov, our Proposal Drafter agent has helped over 12,000 users transform rough ideas into formally structured proposals — and the data shows that AI-assisted proposals are 3.2 times more likely to reach the voting stage compared to manually drafted ones, not because they are favored by the algorithm, but because they are clearer, more complete, and more actionable.`,
      `Perhaps even more critical is the role of AI in detecting and mitigating bias in deliberation. Human deliberation is inherently susceptible to cognitive biases — confirmation bias leads participants to engage only with arguments that reinforce their existing views, anchoring effects cause early contributions to disproportionately shape the direction of debate, and groupthink can suppress dissenting voices. AI-powered bias detection systems can identify these patterns as they emerge, flagging when a discussion is becoming an echo chamber and highlighting underrepresented perspectives. Our Bias Detector agent continuously monitors deliberation threads, producing real-time reports on the diversity of viewpoints represented and alerting moderators when intervention may be needed to ensure a balanced exchange.`,
      `Predictive policy analysis represents another frontier where AI is changing the calculus of civic engagement. Traditional policy debates are often driven by ideology and anecdote rather than evidence — citizens are asked to vote on proposals with little understanding of their likely real-world consequences. AI-driven simulation models can change this by projecting the economic, social, and environmental outcomes of proposed policies using historical data and established causal models. While these predictions are never certain, they provide citizens with a structured basis for comparison that goes beyond political rhetoric. At CosmoGov, our Policy Analyst agent generates impact projections for every proposal that reaches the voting stage, and early data suggests that voters who review these projections make decisions that are more consistent with their stated values.`,
      `The risks, however, are real and must be confronted honestly. Algorithmic bias is the most obvious concern — AI systems trained on historical data inevitably absorb the biases embedded in that data, potentially perpetuating discriminatory outcomes under a veneer of technical objectivity. Transparency is another fundamental challenge: when an AI system recommends a particular policy or flags a particular contribution as biased, citizens need to understand why. Black-box algorithms that cannot explain their reasoning undermine the very democratic principles they are meant to serve. Accountability is equally critical — when AI systems make errors or produce harmful recommendations, there must be clear mechanisms for identifying responsibility and implementing corrections.`,
      `These challenges are precisely why CosmoGov has adopted a set of responsible AI principles that govern every aspect of our platform's intelligence layer. First, transparency: every AI-generated analysis, recommendation, or flag includes a full explanation of the reasoning process and the data sources used. Second, human oversight: no AI output is binding without human review — our agents advise and inform, but final decisions always rest with people. Third, fairness auditing: all models undergo regular bias audits using diverse testing datasets, and results are published openly. Fourth, data sovereignty: citizens own their data and can opt out of AI analysis at any time without losing access to core participation features. These principles are implemented through our six specialized agents — the Proposal Drafter, Bias Detector, Policy Analyst, Consensus Builder, Impact Forecaster, and Transparency Guardian — each designed with specific safeguards aligned to its function. AI in governance is not a trend to be adopted uncritically; it is a tool to be wielded with care, accountability, and an unwavering commitment to democratic values.`,
    ],
  },
  {
    slug: 'building-trust-through-transparent-governance',
    title: 'Building Trust Through Transparent Governance',
    date: 'March 28, 2026',
    accent: 'amber',
    content: [
      `Trust in public institutions has been declining for decades, and the trend shows no sign of reversing. The Edelman Trust Barometer's 2026 report reveals that only 42% of people globally trust their government — a historic low. This crisis of confidence is not confined to any single country or political system; it spans democracies and autocracies alike, driven by a shared perception that decisions are made in secret, promises are broken with impunity, and ordinary citizens have no meaningful visibility into the processes that shape their lives. The consequences of this trust deficit are severe: declining civic participation, rising polarization, and a growing sense that the system is rigged against the very people it is supposed to serve.`,
      `Transparent governance is often invoked as a solution, but the term is frequently used without precision. At its core, transparent governance means that every aspect of the decision-making process — from the initial proposal through deliberation, voting, and implementation — is visible, auditable, and understandable to the public. It is not simply about publishing documents; it is about making the logic of decisions traceable, the data behind them accessible, and the outcomes measurable against stated intentions. True transparency requires not just disclosure but comprehension — information must be presented in ways that citizens can actually use to hold their institutions accountable.`,
      `Research consistently shows that radical transparency does more than just rebuild trust — it measurably improves the quality of decisions. When decision-makers know their reasoning will be public, they are more likely to consider evidence carefully, seek diverse input, and avoid conflicts of interest. When citizens can see how a decision was reached, they are better positioned to offer constructive feedback rather than reflexive opposition. A 2024 study across 38 municipalities found that those with comprehensive transparency policies produced decisions that scored 27% higher on expert quality assessments and received 41% higher public approval ratings compared to municipalities with standard disclosure practices. Transparency does not guarantee good outcomes, but it creates the conditions under which good outcomes become far more likely.`,
      `Implementation of transparent governance requires specific, practical mechanisms. Public audit trails ensure that every edit, comment, and vote on a proposal is permanently recorded and accessible, making it impossible to retroactively alter the record of what happened. Open voting records show not just the final tally but the reasoning behind each vote, allowing citizens to evaluate whether their representatives are acting consistently with their stated principles. Real-time tracking systems allow anyone to follow a proposal from submission through deliberation to implementation, eliminating the "black box" that typically separates a vote from its consequences. These mechanisms are technically straightforward — the barrier to adoption is not capability but political will.`,
      `One of the most persistent challenges in governance is what we call the accountability gap — the chasm between a vote and its implementation. Citizens frequently participate in decisions only to find that the outcomes they supported are delayed, modified, or abandoned entirely, with no explanation. This gap is perhaps the single greatest driver of cynicism about participatory processes. If people invest time and energy in deliberation and voting but see no tangible results, they conclude — reasonably — that their participation was performative rather than substantive. Closing this gap requires not just transparency about decisions but transparency about execution: milestone tracking, progress dashboards, and mandatory reporting on implementation status with clear accountability for delays or deviations.`,
      `At CosmoGov, transparency is not a feature — it is the foundation. Every proposal on our platform generates a complete, immutable audit trail from the moment of submission. Every vote is recorded with the voter's stated reasoning and made publicly accessible. Our Transparency Guardian agent continuously monitors the gap between decisions and their implementation, flagging delays, deviations, and unfulfilled commitments for public review. Real-time dashboards give every citizen a live view of where proposals stand in the pipeline, what actions have been taken, and who is responsible for next steps. We believe that trust is not given — it is earned through consistent, verifiable accountability — and we have built our entire platform around that principle.`,
    ],
  },
  {
    slug: 'gamification-in-public-policy',
    title: 'Gamification in Public Policy',
    date: 'March 15, 2026',
    accent: 'rose',
    content: [
      `The idea of applying game design principles to civic participation would have seemed outlandish a decade ago. Today, it is one of the most promising and debated frontiers in democratic innovation. Civic gamification — the use of progression systems, achievements, competitive challenges, and narrative mechanics to motivate and structure public engagement — has emerged from the recognition that traditional participation mechanisms are failing not because people do not care, but because they are boring, opaque, and psychologically unrewarding. If democratic participation cannot compete with the engagement mechanics of social media and mobile games for people's attention, the solution may not be to lament declining civic virtue but to redesign the experience of participation itself.`,
      `Game design offers a rich toolkit for addressing the psychological barriers to participation. Progression systems give citizens a sense of advancement — from novice to expert — as they engage more deeply with civic processes. Achievement badges provide tangible recognition for contributions, transforming invisible civic labor into shareable, comparable markers of commitment. Competitive challenges leverage social motivation by framing participation as a collaborative or adversarial pursuit with clear goals and time constraints. Narrative mechanics embed policy decisions within compelling storylines that make abstract trade-offs concrete and emotionally resonant. These are not manipulative tricks — they are design patterns that align the experience of civic participation with what decades of psychological research tell us about human motivation.`,
      `CosmoGov's governance games represent the most comprehensive application of these principles to date. Our Budget Balancer challenge invites citizens to allocate a simulated municipal budget, confronting them with the real trade-offs that policymakers face and scoring them on fiscal sustainability, equity, and public satisfaction. The Consensus Builder game pairs participants with opposing viewpoints and challenges them to reach agreement within a time limit, rewarding creative compromise over ideological purity. The Policy Quest narrative series immerses players in a fictional city facing realistic crises, where every decision has simulated consequences that unfold over multiple episodes. Together, these games have attracted over 180,000 unique players since launch, with an average session time of 23 minutes — far exceeding the engagement metrics of conventional civic platforms.`,
      `The research evidence supporting gamified civic engagement is increasingly robust. A longitudinal study conducted across three CosmoGov partner municipalities found that citizens who regularly played governance games demonstrated 34% higher participation rates in real proposal deliberations, 28% greater accuracy in predicting policy outcomes, and 41% higher scores on tests of democratic competency compared to matched controls. Perhaps most strikingly, gamified participants showed significantly lower levels of affective polarization — they were more willing to engage with opposing viewpoints and more likely to change their positions in response to evidence. The mechanism appears to be experiential: by simulating the consequences of policy choices in a low-stakes environment, games build the cognitive scaffolding that makes real participation more intelligible and less threatening.`,
      `Critics raise a valid concern: does gamification risk trivializing serious decisions? When policy choices are framed as "levels" and "challenges," there is a danger that participants approach them with a gamer's mindset — optimizing for scores rather than outcomes, seeking novelty over soundness, and treating real human consequences as abstract variables. This concern is not hypothetical; early experiments with gamified voting in corporate settings found that competitive framing led some participants to vote strategically for "interesting" outcomes rather than ones they genuinely preferred. The challenge for civic gamification design is to harness the motivational power of game mechanics while preserving the gravity and authenticity of the decisions being made.`,
      `The best practices that have emerged from our experience at CosmoGov address this tension directly. First, consequences must be real and transparent — every game outcome is accompanied by an evidence-based analysis of what the equivalent real-world outcome would be, preventing players from losing sight of what is at stake. Second, scoring systems must align with democratic values — our games reward consensus-building, evidence-based reasoning, and equitable outcomes, not speed, popularity, or point-maximization. Third, the boundary between games and governance must always be clear — games are for learning and skill-building; real decisions are made through transparent deliberation and voting. Fourth, inclusivity must be baked in — game mechanics must never create barriers to participation for users who are less competitive or less familiar with game conventions. When these principles are honored, gamification does not trivialize democracy — it revitalizes it, making the skills and habits of effective citizenship accessible to everyone, not just the politically sophisticated few.`,
    ],
  },
];

const accentBgMap: Record<string, string> = {
  teal: 'bg-cosmic-teal/10',
  violet: 'bg-cosmic-violet/10',
  amber: 'bg-cosmic-amber/10',
  rose: 'bg-cosmic-rose/10',
};

const accentTextMap: Record<string, string> = {
  teal: 'text-cosmic-teal',
  violet: 'text-cosmic-violet',
  amber: 'text-cosmic-amber',
  rose: 'text-cosmic-rose',
};

const accentBorderMap: Record<string, string> = {
  teal: 'border-cosmic-teal/20',
  violet: 'border-cosmic-violet/20',
  amber: 'border-cosmic-amber/20',
  rose: 'border-cosmic-rose/20',
};

export default function BlogArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-[#04050b]">
        <Starfield />
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmic-teal to-cosmic-violet flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg">CosmoGov</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-cosmic-muted hover:text-white transition-colors">Log in</Link>
            <Link href="/auth/signup" className="text-sm bg-cosmic-accent text-white px-4 py-1.5 rounded-lg hover:bg-cosmic-accent/90 transition-colors">Sign up free</Link>
          </div>
        </nav>

        <main className="relative z-10 flex-grow flex items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-4">Post Not Found</h1>
            <p className="text-cosmic-muted text-lg mb-8">The article you&apos;re looking for doesn&apos;t exist or has been moved.</p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-cosmic-teal hover:text-cosmic-teal/80 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#04050b]">
      <Starfield />
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmic-teal to-cosmic-violet flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-lg">CosmoGov</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-cosmic-muted hover:text-white transition-colors">Log in</Link>
          <Link href="/auth/signup" className="text-sm bg-cosmic-accent text-white px-4 py-1.5 rounded-lg hover:bg-cosmic-accent/90 transition-colors">Sign up free</Link>
        </div>
      </nav>

      <main className="relative z-10 flex-grow max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-cosmic-muted hover:text-white transition-colors text-sm mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Blog
        </Link>

        {/* Date badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${accentTextMap[post.accent]} ${accentBgMap[post.accent]} px-2.5 py-1 rounded-full`}>
            <Calendar className="w-3 h-3" /> {post.date}
          </span>
        </div>

        {/* Title */}
        <h1 className={`text-2xl sm:text-4xl font-bold font-heading mb-8 ${accentTextMap[post.accent]}`}>
          {post.title}
        </h1>

        {/* Article body */}
        <article className={`glass-card p-6 sm:p-8 rounded-2xl border ${accentBorderMap[post.accent]}`}>
          {post.content.map((paragraph, i) => (
            <p key={i} className="text-cosmic-muted leading-relaxed mb-6 last:mb-0">
              {paragraph}
            </p>
          ))}
        </article>

        {/* Author info */}
        <div className="mt-8 flex items-center gap-4 glass-card p-5 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cosmic-teal/30 to-cosmic-violet/30 border border-white/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-cosmic-muted" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">CosmoGov Team</p>
            <p className="text-cosmic-muted text-xs">Building interstellar civic infrastructure</p>
          </div>
        </div>

        {/* Bottom back link */}
        <div className="mt-10 pt-8 border-t border-white/5">
          <Link
            href="/blog"
            className={`inline-flex items-center gap-2 ${accentTextMap[post.accent]} hover:opacity-80 transition-opacity font-medium`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
