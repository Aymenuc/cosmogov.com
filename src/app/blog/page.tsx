'use client';

import Link from 'next/link';
import { Rocket, Calendar, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';

function Starfield() {
  return <div className="fixed inset-0 starfield opacity-20 pointer-events-none" />;
}

const posts = [
  {
    slug: 'the-future-of-participatory-democracy',
    title: 'The Future of Participatory Democracy',
    date: 'April 18, 2026',
    excerpt: 'As cities and organizations around the world experiment with new forms of civic engagement, a clear trend is emerging: participatory democracy is no longer a nice-to-have — it is becoming an expectation. From Barcelona\'s Decidim platform to Iceland\'s constitutional crowdsourcing, citizens are demanding a seat at the table. But what does the next generation of participatory tools look like, and how can technology scale these experiments from local pilots to global movements? We explore the trends shaping the future of civic participation and what they mean for communities everywhere.',
    accent: 'teal',
  },
  {
    slug: 'how-ai-is-transforming-civic-engagement',
    title: 'How AI is Transforming Civic Engagement',
    date: 'April 10, 2026',
    excerpt: 'Artificial intelligence is reshaping every industry, and civic technology is no exception. At CosmoGov, we have seen firsthand how AI can draft better proposals, identify hidden biases in deliberation, and predict the outcomes of policy decisions with remarkable accuracy. But the integration of AI into governance also raises important questions about transparency, accountability, and the risk of algorithmic bias. In this post, we examine the promise and the pitfalls of AI-powered civic engagement, and share our principles for deploying AI responsibly in democratic processes.',
    accent: 'violet',
  },
  {
    slug: 'building-trust-through-transparent-governance',
    title: 'Building Trust Through Transparent Governance',
    date: 'March 28, 2026',
    excerpt: 'Trust is the foundation of any functioning democracy, yet it is in short supply. Surveys show that public trust in institutions continues to decline globally, driven by perceived opacity, unfulfilled promises, and the sense that decisions are made behind closed doors. Transparent governance — where every proposal, vote, and outcome is publicly visible and auditable — offers a path forward. We discuss how radical transparency not only rebuilds trust but also improves decision quality by enabling broader scrutiny and more informed participation from all stakeholders.',
    accent: 'amber',
  },
  {
    slug: 'gamification-in-public-policy',
    title: 'Gamification in Public Policy',
    date: 'March 15, 2026',
    excerpt: 'Can games make us better citizens? The emerging field of civic gamification suggests they can. By applying game design principles — such as progression systems, rewards, and competitive challenges — to civic participation, platforms like CosmoGov are making governance engaging rather than burdensome. Our governance games have shown that users who play regularly demonstrate improved decision-making skills, higher participation rates in real proposals, and greater understanding of democratic processes. We share the research behind gamified civic engagement and our vision for making every citizen a more capable participant.',
    accent: 'rose',
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

export default function BlogPage() {
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

      <main className="relative z-10 flex-grow max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-6">
            <Rocket className="w-3.5 h-3.5 text-cosmic-teal" />
            <span className="text-xs font-medium text-cosmic-teal">Insights & Updates</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 font-heading">
            CosmoGov <span className="text-gradient">Blog</span>
          </h1>
          <p className="text-cosmic-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Thoughts on civic technology, democratic innovation, and the future of governance. Deep dives, case studies, and product updates from the team building interstellar civic infrastructure.
          </p>
        </div>

        <div className="space-y-8">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
              <article className="glass-card p-8 group hover:scale-[1.01] transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${accentTextMap[post.accent]} ${accentBgMap[post.accent]} px-2.5 py-1 rounded-full`}>
                    <Calendar className="w-3 h-3" /> {post.date}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-heading mb-3 group-hover:text-cosmic-teal transition-colors">
                  {post.title}
                </h2>
                <p className="text-cosmic-muted text-sm leading-relaxed mb-5">{post.excerpt}</p>
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${accentTextMap[post.accent]} group-hover:gap-2.5 transition-all`}>
                  Read More <ArrowRight className="w-4 h-4" />
                </span>
              </article>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
