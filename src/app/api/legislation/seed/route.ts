import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Check if legislation already exists
    const existing = await db.legislation.count();
    if (existing > 0) {
      return NextResponse.json({ message: 'Legislation already seeded', count: existing });
    }

    // Ensure we have a user to assign as creator
    let user = await db.user.findFirst();
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'legislation-seed@cosmogov.io',
          name: 'Legislative Seed Bot',
          role: 'admin',
        },
      });
    }

    const bills = [
      {
        title: 'Digital Privacy Protection Act',
        description: 'Comprehensive legislation to protect citizens\' digital privacy rights, regulate data collection practices, and establish penalties for unauthorized surveillance by both government and corporate entities.',
        billNumber: 'HB-2026-001',
        status: 'public_comment',
        category: 'technology',
        sponsorName: 'Sen. Alara Voss',
        cosponsors: JSON.stringify(['Rep. Kai Chen', 'Rep. Nia Okafor']),
        fullText: `SECTION 1. SHORT TITLE\nThis Act may be cited as the "Digital Privacy Protection Act of 2026."\n\nSECTION 2. DEFINITIONS\n(1) "Personal Data" means any information relating to an identified or identifiable natural person.\n(2) "Data Controller" means any entity that determines the purposes and means of processing personal data.\n(3) "Processing" means any operation performed on personal data, whether or not by automated means.\n\nSECTION 3. CITIZEN DATA RIGHTS\n(a) Right to Access — Citizens shall have the right to obtain confirmation as to whether personal data concerning them is being processed.\n(b) Right to Rectification — Citizens shall have the right to request correction of inaccurate personal data.\n(c) Right to Erasure — Citizens shall have the right to request deletion of their personal data.\n(d) Right to Portability — Citizens shall have the right to receive their personal data in a structured, commonly used format.\n\nSECTION 4. CORPORATE OBLIGATIONS\n(a) Data Minimization — Data controllers shall collect only the minimum personal data necessary for the specified purpose.\n(b) Consent Requirements — Processing of personal data shall be lawful only if the data subject has given explicit consent.\n(c) Breach Notification — Data controllers must notify affected citizens within 72 hours of discovering a data breach.\n\nSECTION 5. ENFORCEMENT\nViolations of this Act shall be subject to civil penalties of up to 4% of annual global revenue.`,
        summaryAi: 'This bill establishes comprehensive digital privacy protections for citizens, including rights to access, correct, delete, and port personal data. It mandates data minimization, explicit consent for data processing, and 72-hour breach notification requirements. Violations carry penalties of up to 4% of annual global revenue.',
        supportCount: 47,
        opposeCount: 12,
        commentCount: 23,
        amendmentCount: 3,
        quorumRequired: 100,
        votingOpensAt: new Date('2026-05-01'),
        votingClosesAt: new Date('2026-06-01'),
      },
      {
        title: 'Green Infrastructure Bond Act',
        description: 'Authorization of $2.5 billion in green bonds to fund renewable energy infrastructure, public transit expansion, and climate resilience projects across all districts.',
        billNumber: 'HB-2026-005',
        status: 'voting',
        category: 'environment',
        sponsorName: 'Rep. Marcus Webb',
        cosponsors: JSON.stringify(['Sen. Priya Sharma', 'Rep. Leo Tanaka', 'Rep. Fatima Al-Rashid']),
        fullText: `SECTION 1. AUTHORIZATION\nThere is hereby authorized the issuance of Green Infrastructure Bonds in an amount not exceeding $2,500,000,000.\n\nSECTION 2. ALLOCATION\n(a) Renewable Energy — 40% shall be allocated to solar, wind, and geothermal energy projects.\n(b) Public Transit — 30% shall be allocated to expansion of zero-emission public transportation.\n(c) Climate Resilience — 20% shall be allocated to flood defenses, heat mitigation, and emergency preparedness.\n(d) Green Spaces — 10% shall be allocated to urban parks, community gardens, and reforestation.\n\nSECTION 3. OVERSIGHT\nA Green Bond Oversight Commission shall be established with 7 citizen representatives and 3 technical experts to ensure transparent allocation.`,
        summaryAi: 'This bill authorizes $2.5B in green bonds: 40% for renewable energy, 30% for zero-emission transit, 20% for climate resilience, and 10% for green spaces. A citizen-majority oversight commission will ensure transparent spending.',
        supportCount: 134,
        opposeCount: 28,
        commentCount: 56,
        amendmentCount: 7,
        quorumRequired: 200,
        votingOpensAt: new Date('2026-03-15'),
        votingClosesAt: new Date('2026-04-15'),
      },
      {
        title: 'Universal Early Childhood Education Act',
        description: 'Mandating free, high-quality early childhood education for all children aged 3-5, with emphasis on equitable access regardless of income, location, or disability status.',
        billNumber: 'HB-2026-008',
        status: 'amendment',
        category: 'education',
        sponsorName: 'Rep. Nia Okafor',
        cosponsors: JSON.stringify(['Sen. James Cooper']),
        fullText: `SECTION 1. UNIVERSAL ACCESS\nAll children aged 3-5 shall be entitled to free early childhood education programs.\n\nSECTION 2. QUALITY STANDARDS\n(a) Maximum class size of 15 students per teacher.\n(b) Curriculum aligned with evidence-based early learning frameworks.\n(c) All facilities must meet safety and accessibility standards.\n\nSECTION 3. FUNDING\nThe Department of Education shall allocate grants to cover 100% of program costs for districts below the median income threshold and 60% for all other districts.`,
        summaryAi: 'This bill guarantees free early childhood education for all 3-5 year olds. It sets quality standards (max 15:1 ratio, evidence-based curriculum) and provides full funding for lower-income districts.',
        supportCount: 89,
        opposeCount: 15,
        commentCount: 42,
        amendmentCount: 5,
        quorumRequired: 150,
      },
      {
        title: 'Community Policing Reform Act',
        description: 'Reforming police practices through mandatory body cameras, de-escalation training, civilian oversight boards, and community policing initiatives.',
        billNumber: 'HB-2026-012',
        status: 'draft',
        category: 'security',
        sponsorName: 'Rep. Kai Chen',
        cosponsors: JSON.stringify([]),
        fullText: `SECTION 1. BODY CAMERA REQUIREMENTS\nAll law enforcement officers shall wear active body cameras during all public interactions.\n\nSECTION 2. DE-ESCALATION\n(a) All officers must complete 40 hours of de-escalation training annually.\n(b) Use of force shall be a last resort after all de-escalation techniques have been exhausted.\n\nSECTION 3. CIVILIAN OVERSIGHT\nEach district shall establish a Civilian Review Board with subpoena power.`,
        summaryAi: 'This draft bill proposes mandatory body cameras, 40-hour annual de-escalation training, and civilian review boards with subpoena power to reform policing practices.',
        supportCount: 56,
        opposeCount: 34,
        commentCount: 38,
        amendmentCount: 2,
        quorumRequired: 100,
      },
      {
        title: 'Affordable Housing Preservation Act',
        description: 'Protecting existing affordable housing stock from demolition or conversion, establishing rent stabilization mechanisms, and creating a Housing Trust Fund for new affordable units.',
        billNumber: 'SB-2026-003',
        status: 'public_comment',
        category: 'infrastructure',
        sponsorName: 'Sen. Priya Sharma',
        cosponsors: JSON.stringify(['Rep. Marcus Webb', 'Rep. Fatima Al-Rashid']),
        fullText: `SECTION 1. PRESERVATION\nNo affordable housing unit receiving public funds may be demolished or converted to market-rate for 30 years after receipt of such funds.\n\nSECTION 2. RENT STABILIZATION\nAnnual rent increases shall not exceed the Consumer Price Index plus 2%.\n\nSECTION 3. HOUSING TRUST FUND\nA Housing Trust Fund shall be established, capitalized at $500M annually from real estate transaction fees.`,
        summaryAi: 'This bill protects affordable housing from demolition/conversion for 30 years, caps rent increases at CPI+2%, and creates a $500M/year Housing Trust Fund from real estate fees.',
        supportCount: 112,
        opposeCount: 19,
        commentCount: 67,
        amendmentCount: 4,
        quorumRequired: 150,
      },
      {
        title: 'Public Health Emergency Preparedness Act',
        description: 'Strengthening pandemic response capabilities, securing medical supply chains, and establishing a permanent public health emergency fund.',
        billNumber: 'HB-2026-015',
        status: 'enacted',
        category: 'health',
        sponsorName: 'Rep. Leo Tanaka',
        cosponsors: JSON.stringify(['Sen. Alara Voss', 'Rep. Nia Okafor', 'Sen. James Cooper']),
        fullText: `SECTION 1. EMERGENCY FUND\nA permanent Public Health Emergency Fund of $1B shall be established.\n\nSECTION 2. SUPPLY CHAIN\n(a) Strategic reserves of essential medical supplies shall be maintained at 120-day capacity.\n(b) Domestic manufacturing incentives for critical medical equipment.\n\nSECTION 3. RESPONSE PROTOCOLS\nStandardized emergency response protocols shall be developed and tested annually.`,
        summaryAi: 'This enacted law establishes a $1B permanent emergency fund, requires 120-day strategic medical reserves, incentivizes domestic manufacturing, and mandates annual emergency response testing.',
        supportCount: 201,
        opposeCount: 8,
        commentCount: 31,
        amendmentCount: 6,
        quorumRequired: 100,
        enactedAt: new Date('2026-02-15'),
      },
      {
        title: 'Open Data and Transparency Act',
        description: 'Requiring all government datasets to be published in machine-readable formats, establishing data standards, and creating a public data portal for citizen access.',
        billNumber: 'HB-2026-020',
        status: 'review',
        category: 'political',
        sponsorName: 'Sen. James Cooper',
        cosponsors: JSON.stringify(['Rep. Kai Chen']),
        fullText: `SECTION 1. OPEN DATA REQUIREMENT\nAll non-classified government datasets shall be published in machine-readable, open formats within 90 days of creation.\n\nSECTION 2. DATA PORTAL\nA centralized Open Data Portal shall be established for citizen access.\n\nSECTION 3. API ACCESS\nAll published datasets shall be accessible via public APIs with rate limits sufficient for civic use.`,
        summaryAi: 'This bill mandates machine-readable publication of all non-classified government datasets within 90 days, a centralized data portal, and public API access for civic use.',
        supportCount: 78,
        opposeCount: 5,
        commentCount: 19,
        amendmentCount: 1,
        quorumRequired: 100,
      },
      {
        title: 'Cultural Heritage Preservation Act',
        description: 'Funding the preservation and digital archiving of cultural heritage sites, traditional arts, and community history projects.',
        billNumber: 'SB-2026-007',
        status: 'public_comment',
        category: 'culture',
        sponsorName: 'Rep. Fatima Al-Rashid',
        cosponsors: JSON.stringify(['Sen. Priya Sharma']),
        fullText: `SECTION 1. HERITAGE FUND\nA Cultural Heritage Preservation Fund of $200M shall be established.\n\nSECTION 2. DIGITAL ARCHIVE\nAll registered heritage sites shall be digitally documented using 3D scanning and photogrammetry.\n\nSECTION 3. COMMUNITY GRANTS\nGrants up to $50,000 shall be available for community history and traditional arts projects.`,
        summaryAi: 'This bill creates a $200M heritage fund, mandates 3D digital documentation of heritage sites, and offers up to $50K grants for community cultural projects.',
        supportCount: 65,
        opposeCount: 3,
        commentCount: 15,
        amendmentCount: 2,
        quorumRequired: 100,
      },
    ];

    const createdBills = [];
    for (const bill of bills) {
      const created = await db.legislation.create({
        data: {
          ...bill,
          currentVersion: 1,
          versions: JSON.stringify([{ version: 1, changes: 'Initial draft', date: new Date().toISOString() }]),
          createdBy: user.id,
          sponsorId: user.id,
        },
      });
      createdBills.push(created);
    }

    // Add some comments
    const commentTemplates = [
      { content: 'This legislation is a crucial step forward. The privacy protections outlined in Section 3 are exactly what citizens need.', type: 'support', sectionRef: 'Section 3' },
      { content: 'I suggest adding a provision for regular audits of data controllers to ensure compliance.', type: 'suggestion', sectionRef: 'Section 4' },
      { content: 'How will this be enforced for international companies operating in our jurisdiction?', type: 'question', sectionRef: null },
      { content: 'The 72-hour breach notification is too generous. It should be 48 hours maximum.', type: 'objection', sectionRef: 'Section 4(c)' },
      { content: 'Fully support this bill. Our community has been waiting for these protections.', type: 'support', sectionRef: null },
    ];

    for (let i = 0; i < Math.min(3, createdBills.length); i++) {
      for (const template of commentTemplates) {
        await db.legislationComment.create({
          data: {
            legislationId: createdBills[i].id,
            userId: user.id,
            content: template.content,
            type: template.type,
            sectionRef: template.sectionRef,
            aiSentiment: template.type === 'support' ? 'positive' : template.type === 'objection' ? 'negative' : 'neutral',
          },
        });
      }
    }

    // Add some amendments
    const amendmentTemplates = [
      { title: 'Extend Breach Notification Timeline', description: 'Extend breach notification to 96 hours for small businesses with fewer than 50 employees.', sectionRef: 'Section 4(c)', originalText: 'Data controllers must notify affected citizens within 72 hours of discovering a data breach.', proposedText: 'Data controllers must notify affected citizens within 72 hours of discovering a data breach. Small businesses with fewer than 50 employees shall have 96 hours to provide such notification.', rationale: 'Small businesses may need additional time to identify and assess the scope of a breach.' },
      { title: 'Add Biometric Data Protections', description: 'Include explicit protections for biometric data including facial recognition, fingerprints, and voice prints.', sectionRef: 'Section 2', originalText: '"Personal Data" means any information relating to an identified or identifiable natural person.', proposedText: '"Personal Data" means any information relating to an identified or identifiable natural person, including biometric data such as facial geometry, fingerprints, voice prints, and iris scans.', rationale: 'Biometric data is uniquely sensitive and cannot be changed if compromised.' },
    ];

    for (let i = 0; i < Math.min(2, createdBills.length); i++) {
      for (const template of amendmentTemplates) {
        await db.legislationAmendment.create({
          data: {
            legislationId: createdBills[i].id,
            userId: user.id,
            title: template.title,
            description: template.description,
            sectionRef: template.sectionRef,
            originalText: template.originalText,
            proposedText: template.proposedText,
            rationale: template.rationale,
            status: i === 0 ? 'proposed' : 'seconded',
            secondCount: i === 0 ? 3 : 7,
            supportCount: i === 0 ? 12 : 23,
            opposeCount: i === 0 ? 2 : 4,
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Legislation seeded successfully',
      billsCreated: createdBills.length,
      commentsAdded: Math.min(3, createdBills.length) * commentTemplates.length,
      amendmentsAdded: Math.min(2, createdBills.length) * amendmentTemplates.length,
    });
  } catch (error) {
    console.error('Error seeding legislation:', error);
    return NextResponse.json({ error: 'Failed to seed legislation' }, { status: 500 });
  }
}
