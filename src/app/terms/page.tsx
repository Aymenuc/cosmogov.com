import type { Metadata } from "next";
import Link from "next/link";
import PublicPage, { PublicContents } from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Terms of use | Cosmogov",
  description: "The terms that apply when you use Cosmogov.",
};

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content: 'By accessing or using CosmoGov\'s platform, applications, or services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you and CosmoGov Inc. We reserve the right to modify these Terms at any time, and your continued use of the Service after any changes constitutes your acceptance of the revised Terms. We will make reasonable efforts to notify you of material changes via email or through a prominent notice on the platform. It is your responsibility to review these Terms periodically. Any new features or tools added to the current Service shall also be subject to these Terms.',
  },
  {
    id: 'use',
    title: 'Use of Service',
    content: 'You may use CosmoGov only for lawful purposes and in accordance with these Terms. You agree not to use the Service in any way that violates any applicable federal, state, local, or international law or regulation, including without limitation, any laws regarding the export of data or software. You must not attempt to gain unauthorized access to any portions of the Service, other accounts, computer systems, or networks connected to the Service through hacking, password mining, or any other means. You may not use the Service to transmit any viruses, worms, or other malicious code, or to interfere with or disrupt the integrity or performance of the Service. We reserve the right to suspend or terminate your access to the Service at our sole discretion if we reasonably believe you have violated any provision of these Terms.',
  },
  {
    id: 'user-content',
    title: 'User Content',
    content: 'You retain ownership of any content you submit, post, or display on or through the Service, including proposals, comments, votes, and profile information ("User Content"). By submitting User Content to CosmoGov, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, process, adapt, publicly display, and distribute such User Content solely for the purpose of providing and improving the Service. You represent and warrant that you have all rights necessary to grant us this license for any User Content you submit. You are responsible for ensuring that your User Content does not violate any applicable laws or infringe upon the rights of any third party. CosmoGov reserves the right to remove or modify User Content at its discretion, particularly if it violates community guidelines or applicable law.',
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    content: 'To the maximum extent permitted by applicable law, CosmoGov and its officers, directors, employees, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of, or inability to access or use, the Service. This includes damages resulting from any unauthorized access to or use of our servers or any personal information stored therein, any interruption or cessation of transmission to or from the Service, any bugs, viruses, or similar harmful code transmitted through the Service, or any errors or omissions in any content. In no event shall our total liability to you exceed the amount you have paid to CosmoGov in the twelve months preceding the claim.',
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    content: 'These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or the Service shall be resolved exclusively in the federal or state courts located in San Francisco County, California, and you consent to the personal jurisdiction and venue of such courts. If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. You agree that these Terms and any policies referenced herein constitute the entire agreement between you and CosmoGov regarding the Service.',
  },
];


export default function TermsPage() {
  return (
    <PublicPage
      title="Terms of use"
      intro="These terms apply to your use of Cosmogov."
      meta={<>Terms last updated <time dateTime="2026-04-25">April 25, 2026</time></>}
    >
      <div className="public-reading-layout">
        <PublicContents sections={[
          { id: "workspace", title: "Using the current workspace" },
          ...sections,
          { id: "questions", title: "Questions about these terms" },
        ]} />
        <div className="public-reading">
          <aside id="workspace">
            <h2>Using the current workspace</h2>
            <p>Mission Studio provides drafts for people to review. Before publishing a form, check the audience and retention notice shown to participants. See the <Link href="/docs">product guides</Link> for the workflow and the <Link href="/privacy">privacy policy</Link> for data handling.</p>
          </aside>
          {sections.map(({ id, title, content }) => (
            <section id={id} key={id}>
              <h2>{title}</h2>
              <p>{content}</p>
            </section>
          ))}
          <section id="questions">
            <h2>Questions about these terms</h2>
            <p><Link href="/contact">Contact Cosmogov</Link> if you have a question.</p>
          </section>
        </div>
      </div>
    </PublicPage>
  );
}
