"use client";
import { useState } from "react";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bike,
  BookOpen,
  Check,
  CircleCheck,
  Flower2,
  Footprints,
  Globe2,
  Hammer,
  Landmark,
  Leaf,
  Megaphone,
  Plus,
  Recycle,
  Refrigerator,
  ShieldCheck,
  Sparkles,
  TrafficCone,
  Trees,
  Users,
  Vote,
  Wallet,
  Wrench,
} from "lucide-react";
import "./landing.css";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { BrandMark } from "@/components/Brand";
import CommonsArt from "@/components/CommonsArt";
import MissionBoard, { MissionChooser } from "@/components/landing/MissionBoard";
import MissionPath from "@/components/landing/MissionPath";
import CommonsStreet from "@/components/landing/CommonsStreet";
import { boardMissions } from "@/components/landing/missions";
// Ideas only. Each one is a kind of mission a community might start.
const missionIdeas = [
  { label: "Repair café", icon: Wrench, tint: "lilac" },
  { label: "Tool library", icon: Hammer, tint: "sun" },
  { label: "Walking school bus", icon: Footprints, tint: "mint" },
  { label: "Community fridge", icon: Refrigerator, tint: "sky" },
  { label: "Street tree count", icon: Trees, tint: "mint" },
  { label: "Pocket park", icon: Flower2, tint: "paper" },
  { label: "Youth council", icon: Megaphone, tint: "sun" },
  { label: "Safer crossing", icon: TrafficCone, tint: "lilac" },
  { label: "Book swap shelf", icon: BookOpen, tint: "paper" },
  { label: "Bike train to work", icon: Bike, tint: "sky" },
  { label: "Clean-up Saturday", icon: Recycle, tint: "mint" },
];
const tools = [
  {
    label: "Propose & vote",
    icon: Vote,
    eyebrow: "FROM A GOOD IDEA TO A SHARED DECISION",
    title: "Give every idea a fair hearing.",
    copy: "Bring proposals into the open. Discuss the trade-offs, choose a voting method, and help your community decide what comes next.",
    heading: "A greener neighborhood starts here.",
    href: "/dashboard/proposals",
  },
  {
    label: "Participatory budgets",
    icon: Wallet,
    eyebrow: "PUT YOUR PRIORITIES ON THE TABLE",
    title: "Decide where the budget goes.",
    copy: "Invite people to propose projects and help allocate resources. Make the choices visible, and connect community priorities to the decisions that fund them.",
    heading: "Your neighborhood. Your priorities.",
    href: "/dashboard/participation/budget",
  },
  {
    label: "Assemblies & dialogue",
    icon: Users,
    eyebrow: "MAKE ROOM FOR MORE PERSPECTIVES",
    title: "Bring the whole community in.",
    copy: "Create a place for considered conversation. Organize assemblies, schedule meetings, and turn different perspectives into a constructive next step.",
    heading: "A seat at the table for everyone.",
    href: "/dashboard/participation/assemblies",
  },
];
function CommunityPreview({ selected = 0 }: { selected?: number }) {
  const tool = tools[selected];
  return (
    <div className="community-preview">
      <div className="preview-toolbar">
        <span>
          <span className="status-dot" /> Riverside community
        </span>
        <span className="preview-example">Illustrative preview</span>
      </div>
      <div className="preview-photo">
        <CommonsArt />
        <span className="photo-label">
          <Leaf size={12} /> A place to grow, together
        </span>
      </div>
      <div className="preview-content">
        <div className="preview-meta">
          <span className="civic-tag">
            <span className="status-dot" /> Open for participation
          </span>
          <span>Community proposal</span>
        </div>
        <h3>{tool.heading}</h3>
        <p>
          {selected === 0
            ? "Help shape a new community garden and make more space for nature."
            : selected === 1
              ? "Choose the local projects you would like your community to fund."
              : "Join a conversation about the future of your shared spaces."}
        </p>
        <div className="preview-progress">
          <div>
            <span>
              {selected === 1
                ? "Project selection"
                : selected === 2
                  ? "Community discussion"
                  : "Community support"}
            </span>
            <span>
              {selected === 1
                ? "3 projects"
                : selected === 2
                  ? "Open to everyone"
                  : "72%"}
            </span>
          </div>
          <div className="progress-track">
            <i
              style={{
                width: selected === 0 ? "72%" : selected === 1 ? "56%" : "88%",
              }}
            />
          </div>
        </div>
        <div className="preview-bottom">
          <div className="preview-avatars">
            <span>AM</span>
            <span>JL</span>
            <span>SK</span>
            <span>
              <Users size={13} />
            </span>
          </div>
          <Link href={tool.href}>
            Join the conversation <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
export default function HomePage() {
  const [selected, setSelected] = useState(0);
  const [annual, setAnnual] = useState(true);
  const [missionId, setMissionId] = useState(boardMissions[0].id);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="landing-page">
        <section className="landing-hero site-container">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={14} /> A LITTLE YOU. A LOT OF POSSIBILITY.
            </div>
            <h1>
              Big ideas.
              <br />
              <em>Meet your team.</em>
            </h1>
            <p>
              Bring your people and a goal worth working on. Your AI team helps
              research it, build a plan, and create useful tools—while your
              community decides what happens next.
            </p>
            <div className="hero-actions">
              <Link href="/dashboard/missions" className="civic-button">
                Start a mission <ArrowUpRight size={18} />
              </Link>
              <Link href="/missions/demo" className="text-link">
                Step inside a full example <ArrowRight size={17} />
              </Link>
            </div>
            <MissionChooser selected={missionId} onSelect={setMissionId} />
            <div className="hero-reassurance">
              <span>
                <Check size={15} /> Free to get started
              </span>
              <span>
                <Check size={15} /> AI drafts, people decide
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="orbit-label">
              <BrandMark />
              <span>
                Go on, press things.
                <br />
                <strong>It’s an example. Nothing breaks.</strong>
              </span>
            </div>
            <span className="board-tape board-tape-left" aria-hidden="true" />
            <span className="board-tape board-tape-right" aria-hidden="true" />
            <MissionBoard missionId={missionId} />
          </div>
        </section>
        <div className="platform-ribbon">
          <div className="site-container ribbon-inner">
            <span>
              One platform.
              <br />
              <strong>A world of possibility.</strong>
            </span>
            {[
              { icon: Landmark, title: "Local governments" },
              { icon: Users, title: "Community groups" },
              { icon: Globe2, title: "Organizations & networks" },
            ].map((item) => (
              <div key={item.title}>
                <item.icon size={22} strokeWidth={1.4} />
                {item.title}
              </div>
            ))}
          </div>
        </div>
        <section id="how-it-works" className="path-section">
          <div className="site-container section-space">
            <div className="path-heading">
              <div className="eyebrow">HOW A MISSION MOVES</div>
              <h2>
                One goal. Four helping hands.
                <br />
                <em>Your call.</em>
              </h2>
              <p>
                Start with a question your community wants to answer. Ask
                Scout to research it, Bridge to connect what people tell you,
                Maker to draft an action plan, and Studio to help build a form.
                Review each draft before moving on.
              </p>
            </div>
            <MissionPath />
            <div className="path-end">
              <Link href="/dashboard/missions" className="civic-button">
                Start a mission <ArrowUpRight size={18} />
              </Link>
              <Link href="/missions/demo" className="text-link">
                Or explore a full example <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
        <section
          id="platform"
          className="platform-section site-container section-space"
        >
          <div className="section-heading">
            <div>
              <div className="eyebrow">AND WHEN IT’S TIME TO DECIDE TOGETHER</div>
              <h2>
                Good things happen
                <br />
                when people have a say.
              </h2>
            </div>
            <p>
              Gather input, agree on a decision, and give people a way to
              follow what happens next.
            </p>
          </div>
          <div
            className="platform-tabs"
            role="tablist"
            aria-label="Platform features"
          >
            {tools.map((tool, i) => (
              <button
                key={tool.label}
                id={`feature-tab-${i}`}
                role="tab"
                aria-selected={selected === i}
                aria-controls="feature-panel"
                tabIndex={selected === i ? 0 : -1}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    const next =
                      (i +
                        (event.key === "ArrowRight" ? 1 : -1) +
                        tools.length) %
                      tools.length;
                    setSelected(next);
                    document.getElementById(`feature-tab-${next}`)?.focus();
                  }
                }}
                onClick={() => setSelected(i)}
                className={selected === i ? "selected" : ""}
              >
                <tool.icon size={18} />
                {tool.label}
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
          <div
            className="feature-panel"
            role="tabpanel"
            id="feature-panel"
            aria-labelledby={`feature-tab-${selected}`}
          >
            <div className="feature-copy">
              <div className="eyebrow">{tools[selected].eyebrow}</div>
              <h3>{tools[selected].title}</h3>
              <p>{tools[selected].copy}</p>
              <ul>
                <li>
                  <CircleCheck />
                  Clear processes, from start to finish
                </li>
                <li>
                  <CircleCheck />
                  Discussion and decisions in one place
                </li>
                <li>
                  <CircleCheck />
                  Outcomes your community can follow
                </li>
              </ul>
              <Link className="text-link" href={tools[selected].href}>
                Explore {tools[selected].label.toLowerCase()}{" "}
                <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="feature-visual">
              <CommunityPreview selected={selected} />
            </div>
          </div>
          <div className="supporting-features">
            <Link href="/dashboard/participation/accountability">
              <ShieldCheck />
              <div>
                <h3>Trust, built in.</h3>
                <p>Track response deadlines and see progress and evidence for work you can access.</p>
              </div>
              <ArrowUpRight />
            </Link>
            <Link href="/dashboard/assistant">
              <Sparkles />
              <div>
                <h3>A little help from AI.</h3>
                <p>
                  Explore ideas and get support with complex governance
                  questions.
                </p>
              </div>
              <ArrowUpRight />
            </Link>
          </div>
        </section>
        <section className="ideas-section site-container section-space">
          <div className="ideas-copy">
            <div className="eyebrow">BUILT AROUND PEOPLE</div>
            <h2>
              Democracy is
              <br />
              an everyday thing.
            </h2>
            <p>
              It’s the park down the street. The priorities in a public budget.
              The broken toaster somebody on your block knows how to fix.
            </p>
            <p>
              Cosmogov brings those conversations closer to the people they
              affect, with tools for communities to participate, deliberate,
              and act.
            </p>
            <Link href="/about" className="text-link">
              The idea behind Cosmogov <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="ideas-wall">
            <p id="ideas-wall-label">What could yours be?</p>
            <ul aria-labelledby="ideas-wall-label">
              {missionIdeas.map((idea) => (
                <li key={idea.label}>
                  <Link
                    href="/dashboard/missions"
                    className={`idea-sticker tint-${idea.tint}`}
                  >
                    <idea.icon size={18} aria-hidden="true" />
                    {idea.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/dashboard/missions"
                  className="idea-sticker idea-yours"
                >
                  <Plus size={18} aria-hidden="true" />
                  Yours goes here
                </Link>
              </li>
            </ul>
          </div>
        </section>
        <section id="pricing" className="pricing-section section-space">
          <div className="site-container">
            <div className="pricing-heading">
              <div className="eyebrow">ROOM TO GROW</div>
              <h2>
                Big possibilities.
                <br />A simple place to start.
              </h2>
              <p>Start free. Upgrade when your community wants more AI help. Councils are set up with a person and invoiced.</p>
              <div className="billing-switch" aria-label="Billing period">
                <button
                  className={!annual ? "active" : ""}
                  aria-pressed={!annual}
                  onClick={() => setAnnual(false)}
                >
                  Monthly
                </button>
                <button
                  className={annual ? "active" : ""}
                  aria-pressed={annual}
                  onClick={() => setAnnual(true)}
                >
                  Yearly <span>Save 20%</span>
                </button>
              </div>
            </div>
            <div className="pricing-grid">
              {PLAN_ORDER.map((id) => {
                const p = PLANS[id];
                return {
                  name: p.name,
                  desc: p.desc,
                  price: annual ? p.yearlyPerMonth : p.monthly,
                  features: p.features,
                  featured: id === "pro",
                };
              }).map((plan) => (
                <div
                  key={plan.name}
                  className={`pricing-card ${plan.featured ? "featured" : ""}`}
                >
                  <div className="plan-name">
                    <h3>{plan.name}</h3>
                    {plan.featured && <span>MORE POSSIBILITIES</span>}
                  </div>
                  <p>{plan.desc}</p>
                  <div className="price">
                    ${plan.price}
                    <span>{plan.price === 0 ? "" : "/ month"}</span>
                  </div>
                  <span className="billing-note">
                    {plan.price === 0
                      ? "A good place to begin."
                      : annual
                        ? `Billed yearly · $${plan.price * 12}/year`
                        : "Billed monthly"}
                  </span>
                  <Link
                    href={
                      plan.name === "Community"
                        ? "/auth/signup"
                        : plan.name === "Pro"
                          ? "/dashboard/settings?tab=plan"
                          : { pathname: "/contact", query: { topic: "sales", plan: plan.name } }
                    }
                    className={`civic-button ${plan.featured ? "" : "outline"}`}
                  >
                    {plan.name === "Community" ? "Start free" : plan.name === "Pro" ? "Get Pro" : "Talk to us"}
                    <ArrowUpRight size={16} />
                  </Link>
                  <ul>
                    {plan.features.map((f) => (
                      <li key={f}>
                        <Check size={15} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="pricing-note">
              Need a tailored setup?{" "}
              <Link href="/contact?topic=sales">
                Let’s find the right fit <ArrowUpRight size={13} />
              </Link>
            </p>
          </div>
        </section>
        <section className="faq-section site-container section-space">
          <div>
            <div className="eyebrow">A FEW GOOD QUESTIONS</div>
            <h2>
              Let’s clear
              <br />
              things up.
            </h2>
            <p>
              Still curious?{" "}
              <Link href="/contact">
                Get in touch <ArrowUpRight size={14} />
              </Link>
            </p>
          </div>
          <div className="faq-list">
            {[
              {
                q: "Who is Cosmogov for?",
                a: "Cosmogov is for local governments, community groups, organizations, and networks that want to make decisions with their people. You can join as a citizen or create a space for your community.",
              },
              {
                q: "Can we start with a small community?",
                a: "Yes. The free Community plan is a place to start. Create an account, set up your organization, and invite people to discuss and vote on your first proposal.",
              },
              {
                q: "How does voting work?",
                a: "Cosmogov supports direct yes-or-no votes, council votes, and ranked-choice decisions. Proposal creators can choose a voting method and set a closing date and participation threshold.",
              },
              {
                q: "What can government officials do?",
                a: "Officials can use a dedicated government portal to review initiatives, respond to citizen proposals, and update legislation. Government accounts use a verification code supplied by an administrator.",
              },
              {
                q: "Is the AI team a set of independent agents?",
                a: "No. Scout, Bridge, Maker and Studio are four steps you ask for, one at a time, on one AI model. They draft from what your community added. They don’t act on their own, send messages, spend money, or remember people between missions.",
              },
              {
                q: "Can an AI draft be wrong?",
                a: "Yes. A reference shows where a point came from, not that the point is true. That is why every draft lists what still needs checking, and why a plan or a form only joins a mission when a person adopts it.",
              },
              {
                q: "Does AI make decisions for the community?",
                a: "No. AI tools can help explore and develop ideas. Community members and their established governance processes make the decisions.",
              },
            ].map((faq) => (
              <details key={faq.q}>
                <summary>
                  {faq.q}
                  <Plus size={18} />
                </summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="final-cta">
          <div className="site-container">
            <div>
              <div className="eyebrow">THE NEXT CHAPTER STARTS WITH YOU</div>
              <h2>
                A better future
                <br />
                takes <em>all of us.</em>
              </h2>
            </div>
            <div>
              <Link href="/auth/signup" className="civic-button light">
                Find your starting point <ArrowUpRight size={18} />
              </Link>
              <p>Start free. Bring your people. Make a difference.</p>
            </div>
            <BrandMark className="cta-mark" />
          </div>
          <CommonsStreet />
        </section>
      </main>
      <Footer />
    </>
  );
}
