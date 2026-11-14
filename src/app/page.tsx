"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  CircleCheck,
  Fingerprint,
  Globe2,
  Landmark,
  Leaf,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  Vote,
  Wallet,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { BrandMark } from "@/components/Brand";
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
        <img
          src="/images/park.jpg"
          alt="A green public park with a path and mature trees"
        />
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
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="landing-page">
        <section className="landing-hero site-container">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" /> THE FUTURE IS PARTICIPATORY
            </div>
            <h1>
              Better decisions.
              <br />
              Made <em>together.</em>
            </h1>
            <p>
              Your community has a voice. Give it a place to shape what comes
              next. Propose ideas, make shared decisions, and turn participation
              into progress.
            </p>
            <div className="hero-actions">
              <Link href="/auth/signup" className="civic-button">
                Build your community <ArrowUpRight size={18} />
              </Link>
              <a href="#platform" className="text-link">
                Explore the platform <ArrowRight size={17} />
              </a>
            </div>
            <div className="hero-reassurance">
              <span>
                <Check size={14} /> Free to get started
              </span>
              <span>
                <Check size={14} /> Built for every voice
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="orbit-label">
              <BrandMark />
              <span>
                Small ideas.
                <br />
                <strong>Shared possibilities.</strong>
              </span>
            </div>
            <CommunityPreview />
            <div className="floating-outcome">
              <div>
                <CheckCheck size={20} />
              </div>
              <span>
                A voice. A vote.
                <br />
                <strong>A visible difference.</strong>
              </span>
              <span className="tiny-star">✳</span>
            </div>
            <span className="visual-coordinate">
              PEOPLE → PARTICIPATION → PROGRESS
            </span>
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
        <section
          id="platform"
          className="platform-section site-container section-space"
        >
          <div className="section-heading">
            <div>
              <div className="eyebrow">PARTICIPATION, WITH PURPOSE</div>
              <h2>
                Good things happen
                <br />
                when people have a say.
              </h2>
            </div>
            <p>
              From the first conversation to the final decision.
              <br />
              Everything your community needs to move forward.
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
                <p>Follow official responses and see where decisions lead.</p>
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
        <section id="how-it-works" className="how-section">
          <div className="site-container section-space">
            <div className="section-heading">
              <div>
                <div className="eyebrow">A SIMPLE WAY FORWARD</div>
                <h2>
                  Start a conversation.
                  <br />
                  Create a ripple.
                </h2>
              </div>
              <Link href="/auth/signup" className="civic-button outline">
                Let’s get started <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="steps-grid">
              {[
                {
                  n: "01",
                  title: "Make a place for your people.",
                  copy: "Create your community and invite the people who care about its future.",
                  icon: Users,
                },
                {
                  n: "02",
                  title: "Put ideas into motion.",
                  copy: "Open a proposal, launch a survey, or bring people together in an assembly.",
                  icon: MessageCircle,
                },
                {
                  n: "03",
                  title: "Move forward, together.",
                  copy: "Make a decision, share the outcome, and keep the community in the loop.",
                  icon: Vote,
                },
              ].map((step) => (
                <div key={step.n}>
                  <div className="step-top">
                    <span>{step.n}</span>
                    <step.icon size={27} strokeWidth={1.3} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mission-section site-container section-space">
          <div className="mission-image">
            <img
              src="/images/city.jpg"
              alt="A city street, home to many different communities"
            />
            <div>
              <Globe2 size={20} />
              <span>
                Many perspectives.
                <br />
                <strong>One shared future.</strong>
              </span>
            </div>
          </div>
          <div className="mission-copy">
            <div className="eyebrow">BUILT AROUND PEOPLE</div>
            <h2>
              Democracy is
              <br />
              an everyday thing.
            </h2>
            <p>
              It’s the park down the street. The priorities in a public budget.
              The ideas that deserve to be heard.
            </p>
            <p>
              Cosmogov brings those conversations closer to the people they
              affect—with tools for communities to participate, deliberate, and
              act.
            </p>
            <Link href="/about" className="text-link">
              The idea behind Cosmogov <ArrowUpRight size={17} />
            </Link>
            <div className="mission-values">
              <span>
                <Fingerprint size={19} />
                Every voice matters
              </span>
              <span>
                <Globe2 size={19} />
                Every community belongs
              </span>
            </div>
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
              <p>Start with your community. Grow at your own pace.</p>
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
              {[
                {
                  name: "Community",
                  desc: "For people coming together.",
                  price: 0,
                  features: [
                    "Create and join communities",
                    "Proposals and community voting",
                    "Discussion and participation tools",
                    "Community support",
                  ],
                  action: "Start for free",
                  href: "/auth/signup",
                },
                {
                  name: "Pro",
                  desc: "For communities ready to do more.",
                  price: annual ? 39 : 49,
                  features: [
                    "Everything in Community",
                    "Advanced governance tools",
                    "AI-powered assistance",
                    "Analytics and participation insights",
                  ],
                  action: "Get started with Pro",
                  href: "/auth/signup",
                  featured: true,
                },
                {
                  name: "Government",
                  desc: "For public participation at scale.",
                  price: annual ? 159 : 199,
                  features: [
                    "Everything in Pro",
                    "Government response portal",
                    "Official verification tools",
                    "Onboarding and migration support",
                  ],
                  action: "Talk to us",
                  href: "/contact",
                },
              ].map((plan) => (
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
                    <span>{plan.price === 0 ? "/ forever" : "/ month"}</span>
                  </div>
                  <span className="billing-note">
                    {plan.price === 0
                      ? "A good place to begin."
                      : annual
                        ? `Billed yearly · $${plan.price * 12}/year`
                        : "Billed monthly"}
                  </span>
                  <Link
                    href={plan.href}
                    className={`civic-button ${plan.featured ? "" : "outline"}`}
                  >
                    {plan.action}
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
              <Link href="/contact">
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
        </section>
      </main>
      <Footer />
    </>
  );
}
