'use client';

import Link from 'next/link';
import { Rocket, Shield, Database, Lock, UserCheck, Mail } from 'lucide-react';
import Footer from '@/components/Footer';

function Starfield() {
  return <div className="fixed inset-0 starfield opacity-20 pointer-events-none" />;
}

const sections = [
  {
    icon: Database,
    title: 'Data Collection',
    content: 'We collect information you provide directly to CosmoGov, including your name, email address, organization details, and any content you create on the platform such as proposals, comments, and votes. We also automatically collect certain technical information when you use our services, including your IP address, browser type, device information, and usage patterns. Location data is collected only when you explicitly enable geo-tagging features for participatory budgeting or local governance activities. We do not sell, rent, or share your personal data with third parties for their own marketing purposes. Analytics data is aggregated and anonymized before being used to improve platform performance and user experience.',
  },
  {
    icon: Shield,
    title: 'Data Usage',
    content: 'We use the information we collect to provide, maintain, and improve CosmoGov\'s services, including processing your votes and proposals, delivering AI-powered insights, and enabling participatory governance features. Your data helps us personalize your experience, provide customer support, send important notifications about governance activities you\'re involved in, and protect against fraud and unauthorized access. We may also use aggregated, non-personally identifiable information for research and analysis to better understand how communities engage with civic technology. When we use your data for any purpose beyond what is described in this policy, we will seek your consent first.',
  },
  {
    icon: Lock,
    title: 'Data Protection',
    content: 'CosmoGov employs industry-leading security measures to protect your information. All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Our infrastructure is hosted on isolated, SOC 2 Type II compliant servers with regular security audits and penetration testing. We implement strict access controls, ensuring that only authorized personnel can access personal data, and all access is logged and monitored. We maintain comprehensive backup and disaster recovery procedures to protect against data loss. In the event of a data breach, we will notify affected users within 72 hours in accordance with applicable regulations and take immediate steps to contain and remediate the incident.',
  },
  {
    icon: UserCheck,
    title: 'Your Rights',
    content: 'You have the right to access, correct, or delete your personal data at any time through your account settings or by contacting our privacy team. You can export all of your data in a machine-readable format. You have the right to object to or restrict the processing of your personal data, and to withdraw consent for any data processing based on consent. If you are a resident of the European Economic Area, you have additional rights under GDPR including the right to data portability and the right to lodge a complaint with a supervisory authority. We honor "Do Not Track" signals and provide granular privacy controls within your account settings. To exercise any of these rights, please contact us at privacy@cosmogov.io.',
  },
  {
    icon: Mail,
    title: 'Contact',
    content: 'If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Data Protection Officer at privacy@cosmogov.io. You can also reach us by mail at CosmoGov Inc., 1234 Stellar Avenue, San Francisco, CA 94105, United States. We aim to respond to all privacy-related inquiries within 30 business days. For urgent matters related to data security, please use our dedicated security channel at security@cosmogov.io. We regularly review and update this privacy policy to reflect changes in our practices and applicable regulations.',
  },
];

export default function PrivacyPage() {
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
            <Shield className="w-3.5 h-3.5 text-cosmic-teal" />
            <span className="text-xs font-medium text-cosmic-teal">Your Privacy Matters</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 font-heading">
            Privacy <span className="text-gradient">Policy</span>
          </h1>
          <p className="text-cosmic-muted text-lg max-w-2xl mx-auto leading-relaxed mb-2">
            How we collect, use, and protect your personal information.
          </p>
          <p className="text-sm text-cosmic-muted/60">Last updated: April 25, 2026</p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title} className="glass-card p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-cosmic-teal/10 flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-cosmic-teal" />
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
