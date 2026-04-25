'use client';

import Link from 'next/link';
import { Rocket, FileText, Scale, AlertTriangle, Gavel, BookOpen } from 'lucide-react';
import Footer from '@/components/Footer';

function Starfield() {
  return <div className="fixed inset-0 starfield opacity-20 pointer-events-none" />;
}

const sections = [
  {
    icon: FileText,
    title: 'Acceptance of Terms',
    content: 'By accessing or using CosmoGov\'s platform, applications, or services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you and CosmoGov Inc. We reserve the right to modify these Terms at any time, and your continued use of the Service after any changes constitutes your acceptance of the revised Terms. We will make reasonable efforts to notify you of material changes via email or through a prominent notice on the platform. It is your responsibility to review these Terms periodically. Any new features or tools added to the current Service shall also be subject to these Terms.',
  },
  {
    icon: BookOpen,
    title: 'Use of Service',
    content: 'You may use CosmoGov only for lawful purposes and in accordance with these Terms. You agree not to use the Service in any way that violates any applicable federal, state, local, or international law or regulation, including without limitation, any laws regarding the export of data or software. You must not attempt to gain unauthorized access to any portions of the Service, other accounts, computer systems, or networks connected to the Service through hacking, password mining, or any other means. You may not use the Service to transmit any viruses, worms, or other malicious code, or to interfere with or disrupt the integrity or performance of the Service. We reserve the right to suspend or terminate your access to the Service at our sole discretion if we reasonably believe you have violated any provision of these Terms.',
  },
  {
    icon: Scale,
    title: 'User Content',
    content: 'You retain ownership of any content you submit, post, or display on or through the Service, including proposals, comments, votes, and profile information ("User Content"). By submitting User Content to CosmoGov, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, process, adapt, publicly display, and distribute such User Content solely for the purpose of providing and improving the Service. You represent and warrant that you have all rights necessary to grant us this license for any User Content you submit. You are responsible for ensuring that your User Content does not violate any applicable laws or infringe upon the rights of any third party. CosmoGov reserves the right to remove or modify User Content at its discretion, particularly if it violates community guidelines or applicable law.',
  },
  {
    icon: AlertTriangle,
    title: 'Limitation of Liability',
    content: 'To the maximum extent permitted by applicable law, CosmoGov and its officers, directors, employees, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of, or inability to access or use, the Service. This includes damages resulting from any unauthorized access to or use of our servers or any personal information stored therein, any interruption or cessation of transmission to or from the Service, any bugs, viruses, or similar harmful code transmitted through the Service, or any errors or omissions in any content. In no event shall our total liability to you exceed the amount you have paid to CosmoGov in the twelve months preceding the claim.',
  },
  {
    icon: Gavel,
    title: 'Governing Law',
    content: 'These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or the Service shall be resolved exclusively in the federal or state courts located in San Francisco County, California, and you consent to the personal jurisdiction and venue of such courts. If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. You agree that these Terms and any policies referenced herein constitute the entire agreement between you and CosmoGov regarding the Service.',
  },
];

export default function TermsPage() {
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
            <FileText className="w-3.5 h-3.5 text-cosmic-teal" />
            <span className="text-xs font-medium text-cosmic-teal">Legal</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 font-heading">
            Terms of <span className="text-gradient">Service</span>
          </h1>
          <p className="text-cosmic-muted text-lg max-w-2xl mx-auto leading-relaxed mb-2">
            The rules and guidelines for using CosmoGov.
          </p>
          <p className="text-sm text-cosmic-muted/60">Last updated: April 25, 2026</p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title} className="glass-card p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-cosmic-violet/10 flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-cosmic-violet" />
                </div>
                <h2 className="text-xl font-bold text-white font-heading">{section.title}</h2>
              </div>
              <p className="text-cosmic-muted leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
