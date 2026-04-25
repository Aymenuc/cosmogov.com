import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo cities with real coordinates
const DEMO_LOCATIONS = [
  { cityName: 'Barcelona', countryName: 'Spain', latitude: 41.3851, longitude: 2.1734, countryId: '207', stateId: '3374', cityId: '64861' },
  { cityName: 'Paris', countryName: 'France', latitude: 48.8566, longitude: 2.3522, countryId: '73', stateId: '1109', cityId: '2988507' },
  { cityName: 'Berlin', countryName: 'Germany', latitude: 52.5200, longitude: 13.4050, countryId: '82', stateId: '1177', cityId: '2950159' },
  { cityName: 'New York', countryName: 'United States', latitude: 40.7128, longitude: -74.0060, countryId: '231', stateId: '3725', cityId: '5128581' },
  { cityName: 'São Paulo', countryName: 'Brazil', latitude: -23.5505, longitude: -46.6333, countryId: '31', stateId: '473', cityId: '3448439' },
  { cityName: 'Tokyo', countryName: 'Japan', latitude: 35.6762, longitude: 139.6503, countryId: '109', stateId: '1864', cityId: '1850147' },
  { cityName: 'Mumbai', countryName: 'India', latitude: 19.0760, longitude: 72.8777, countryId: '101', stateId: '1592', cityId: '1275339' },
  { cityName: 'Lagos', countryName: 'Nigeria', latitude: 6.5244, longitude: 3.3792, countryId: '158', stateId: '2504', cityId: '2332459' },
  { cityName: 'Sydney', countryName: 'Australia', latitude: -33.8688, longitude: 151.2093, countryId: '14', stateId: '142', cityId: '2147714' },
  { cityName: 'Reykjavik', countryName: 'Iceland', latitude: 64.1466, longitude: -21.9426, countryId: '101', stateId: '1592', cityId: '6692261' },
  { cityName: 'Mexico City', countryName: 'Mexico', latitude: 19.4326, longitude: -99.1332, countryId: '142', stateId: '2332', cityId: '3530597' },
  { cityName: 'Seoul', countryName: 'South Korea', latitude: 37.5665, longitude: 126.9780, countryId: '116', stateId: '1872', cityId: '1835848' },
  { cityName: 'Nairobi', countryName: 'Kenya', latitude: -1.2921, longitude: 36.8219, countryId: '113', stateId: '1880', cityId: '184745' },
  { cityName: 'Buenos Aires', countryName: 'Argentina', latitude: -34.6037, longitude: -58.3816, countryId: '11', stateId: '45', cityId: '3433955' },
  { cityName: 'Dubai', countryName: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, countryId: '230', stateId: '3885', cityId: '292223' },
];

const PROPOSAL_TEMPLATES = [
  { title: 'Digital Rights Charter for Smart Cities', description: 'A comprehensive charter establishing digital rights for citizens in smart city environments, ensuring data privacy, algorithmic transparency, and equitable access to digital services.', category: 'governance', status: 'active' },
  { title: 'Participatory Budget Allocation for Urban Green Spaces', description: 'Proposal to allocate 15% of the municipal budget toward creating and maintaining urban green spaces, community gardens, and biodiversity corridors in underserved neighborhoods.', category: 'finance', status: 'active' },
  { title: 'Open Data Policy for Government Operations', description: 'Mandating that all non-sensitive government data be published in machine-readable formats within 30 days of creation, enabling civic tech innovation and citizen oversight.', category: 'technology', status: 'active' },
  { title: 'Youth Council Representation Act', description: 'Establishing mandatory youth representation (ages 16-25) on all city councils and advisory boards, ensuring that policies affecting young people are shaped by their voices.', category: 'community', status: 'active' },
  { title: 'Sustainable Transportation Initiative', description: 'A comprehensive plan to transition public transit to zero-emission vehicles, expand bike infrastructure, and create pedestrian-first zones in city centers within 5 years.', category: 'governance', status: 'active' },
  { title: 'Civic Engagement Reward Program', description: 'Implementing a gamified system where citizens earn transferable credits for participating in public consultations, voting, and community service.', category: 'engagement', status: 'active' },
  { title: 'Algorithmic Accountability Framework', description: 'Requiring all AI systems used in public decision-making to undergo mandatory bias audits, publish impact assessments, and include human oversight mechanisms.', category: 'technology', status: 'active' },
  { title: 'Community Land Trust Expansion', description: 'Expanding the community land trust model to preserve affordable housing and prevent displacement, with priority given to long-term residents and vulnerable populations.', category: 'finance', status: 'active' },
  { title: 'Digital Literacy for All Ages', description: 'Creating free digital literacy programs in public libraries and community centers, with specialized curricula for seniors, immigrants, and underserved communities.', category: 'community', status: 'active' },
  { title: 'Climate Resilience Action Plan', description: 'Developing neighborhood-level climate resilience plans with community input, focusing on flood protection, heat island mitigation, and emergency preparedness.', category: 'governance', status: 'active' },
  { title: 'Transparent Procurement Platform', description: 'Building an open-source platform for government procurement that enables real-time tracking, public comment periods, and automated conflict-of-interest detection.', category: 'technology', status: 'active' },
  { title: 'Cultural Heritage Preservation Fund', description: 'Establishing a dedicated fund for preserving and promoting local cultural heritage sites, traditional crafts, and indigenous knowledge systems through participatory processes.', category: 'community', status: 'active' },
  { title: 'Universal Basic Services Pilot', description: 'Launching a 2-year pilot program providing universal access to essential services including internet, transportation, and childcare in selected districts.', category: 'finance', status: 'active' },
  { title: 'Civic Innovation Lab Network', description: 'Creating a global network of civic innovation labs where citizens, technologists, and policymakers co-create solutions to local governance challenges.', category: 'engagement', status: 'active' },
  { title: 'Public Space Reclaim Initiative', description: 'Reclaiming underutilized public spaces through participatory design processes, transforming parking lots and vacant lots into community hubs, playgrounds, and markets.', category: 'community', status: 'active' },
];

const PROCESS_TEMPLATES = [
  { title: 'Barcelona Digital City Strategy', description: 'A city-wide participatory process to co-create Barcelona\'s digital transformation strategy, engaging citizens in shaping smart city policies.', shortDescription: 'Co-creating Barcelona\'s digital future', category: 'urban_planning', currentPhase: 'proposal', scope: 'city' },
  { title: 'Paris Climate Action 2030', description: 'An inclusive process to develop Paris\'s climate action plan for 2030, combining citizen assemblies, expert panels, and digital participation.', shortDescription: 'Shaping Paris\'s climate future together', category: 'environment', currentPhase: 'deliberation', scope: 'city' },
  { title: 'Berlin Housing Affordability Process', description: 'Participatory process addressing Berlin\'s housing crisis through community-led policy recommendations and budget allocation.', shortDescription: 'Community-driven housing solutions', category: 'budget', currentPhase: 'voting', scope: 'city' },
  { title: 'New York Civic Tech Initiative', description: 'Engaging New Yorkers in designing and prioritizing civic technology solutions for city services and democratic participation.', shortDescription: 'Tech for the people, by the people', category: 'technology', currentPhase: 'information', scope: 'city' },
  { title: 'São Paulo Urban Mobility Plan', description: 'A participatory urban mobility planning process connecting communities across São Paulo to co-design transportation solutions.', shortDescription: 'Moving São Paulo forward together', category: 'urban_planning', currentPhase: 'proposal', scope: 'city' },
  { title: 'Tokyo Aging Society Initiative', description: 'Engaging citizens in developing policies for Tokyo\'s super-aging society through intergenerational dialogue and participatory design.', shortDescription: 'Designing an age-friendly Tokyo', category: 'policy', currentPhase: 'deliberation', scope: 'city' },
  { title: 'Mumbai Water Security Process', description: 'A community-driven process to ensure equitable water access and sustainable water management across Mumbai\'s diverse neighborhoods.', shortDescription: 'Water for all Mumbaikars', category: 'environment', currentPhase: 'proposal', scope: 'city' },
  { title: 'Sydney Harbor Sustainability Process', description: 'A multi-stakeholder process to balance development, environment, and community needs around Sydney Harbor.', shortDescription: 'A sustainable harbor for future generations', category: 'environment', currentPhase: 'information', scope: 'city' },
];

const ASSEMBLY_TEMPLATES = [
  { name: 'Barcelona Digital Rights Assembly', description: 'A citizens\' assembly focused on establishing digital rights frameworks for Barcelona\'s smart city initiatives.', purpose: 'advisory', scope: 'thematic', meetingCadence: 'biweekly' },
  { name: 'Paris Climate Citizens Assembly', description: 'A representative assembly of Parisians working together to shape climate policy and ensure just transitions.', purpose: 'decision_making', scope: 'thematic', meetingCadence: 'monthly' },
  { name: 'Berlin Housing Assembly', description: 'An assembly of residents, experts, and policymakers collaborating on affordable housing solutions.', purpose: 'deliberation', scope: 'general', meetingCadence: 'weekly' },
  { name: 'Mumbai Water Governance Assembly', description: 'A community assembly ensuring equitable representation in water resource management decisions.', purpose: 'advisory', scope: 'thematic', meetingCadence: 'monthly' },
  { name: 'Nairobi Youth Assembly', description: 'An assembly empowering young Kenyans to participate in local governance and community development.', purpose: 'deliberation', scope: 'general', meetingCadence: 'biweekly' },
  { name: 'Seoul Innovation Assembly', description: 'A forward-thinking assembly exploring technological innovation in public services and democratic processes.', purpose: 'advisory', scope: 'thematic', meetingCadence: 'monthly' },
];

const INITIATIVE_TEMPLATES = [
  { title: 'Right to Disconnect Initiative', description: 'A citizen initiative advocating for the legal right to disconnect from digital communications outside working hours, protecting work-life balance.', type: 'petition', signatureGoal: 50000, status: 'collecting' },
  { title: 'Plastic-Free City by 2030', description: 'An initiative to phase out single-use plastics in city limits by 2030, with support for businesses and communities transitioning to sustainable alternatives.', type: 'petition', signatureGoal: 100000, status: 'collecting' },
  { title: 'Free Public WiFi for All', description: 'Mandating free, high-speed public WiFi coverage across the entire metropolitan area, bridging the digital divide.', type: 'proposal', signatureGoal: 25000, status: 'collecting' },
  { title: 'Citizen Oversight of Surveillance', description: 'Establishing civilian oversight boards with real authority to review and approve public surveillance technologies.', type: 'petition', signatureGoal: 30000, status: 'threshold_reached' },
  { title: 'Universal School Meals', description: 'Ensuring every child in public schools receives a nutritious meal regardless of family income, funded through progressive taxation.', type: 'proposal', signatureGoal: 75000, status: 'collecting' },
];

const MEETING_TEMPLATES = [
  { title: 'Digital Rights Town Hall', description: 'Open town hall to discuss digital rights, data privacy, and algorithmic accountability in city governance.', type: 'hybrid', address: 'Civic Center, Main Hall', status: 'scheduled' },
  { title: 'Climate Action Workshop', description: 'Hands-on workshop where citizens co-design neighborhood climate resilience plans with urban planners and scientists.', type: 'in_person', address: 'Community Center, Room 201', status: 'scheduled' },
  { title: 'Housing Policy Forum', description: 'Public forum bringing together residents, landlords, and policymakers to discuss affordable housing solutions.', type: 'virtual', status: 'scheduled' },
  { title: 'Youth Civic Engagement Summit', description: 'A summit empowering young people to participate in local governance, featuring workshops, panels, and networking.', type: 'hybrid', address: 'University Auditorium', status: 'scheduled' },
];

const DEBATE_TEMPLATES = [
  { title: 'Surveillance vs. Privacy: Finding the Balance', description: 'A structured debate exploring the tension between public safety surveillance and individual privacy rights in smart cities.', topic: 'Should cities deploy facial recognition in public spaces?', status: 'active', phase: 'debate', consensusLevel: 0.35 },
  { title: 'Growth vs. Sustainability: The Urban Dilemma', description: 'Debating how cities can balance economic growth with environmental sustainability and social equity.', topic: 'Can cities achieve both economic growth and carbon neutrality by 2030?', status: 'active', phase: 'deliberation', consensusLevel: 0.48 },
  { title: 'AI in Governance: Tool or Threat?', description: 'Exploring whether artificial intelligence enhances or undermines democratic participation and decision-making.', topic: 'Should AI systems be allowed to make decisions in public service allocation?', status: 'waiting', phase: 'opening', consensusLevel: 0.12 },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function GET() {
  try {
    // Get first user or skip if no users
    const firstUser = await db.user.findFirst();
    if (!firstUser) {
      return NextResponse.json({ error: 'No users found. Create a user first.' }, { status: 400 });
    }

    const results = {
      proposals: 0,
      processes: 0,
      assemblies: 0,
      initiatives: 0,
      meetings: 0,
      debates: 0,
      skipped: [] as string[],
    };

    // Check if demo data already exists by looking for a known demo proposal
    const existingDemo = await db.proposal.findFirst({
      where: { title: 'Digital Rights Charter for Smart Cities' },
    });
    if (existingDemo) {
      return NextResponse.json({
        message: 'Demo data already exists. Skipping seed.',
        tip: 'Delete existing data manually to re-seed.',
      });
    }

    // ─── Seed Proposals (15) ───
    for (let i = 0; i < 15; i++) {
      const template = PROPOSAL_TEMPLATES[i];
      const location = DEMO_LOCATIONS[i];

      try {
        await db.proposal.create({
          data: {
            title: template.title,
            description: template.description,
            category: template.category,
            status: template.status,
            votingType: 'yes_no',
            options: JSON.stringify(['For', 'Against']),
            countryId: location.countryId,
            countryName: location.countryName,
            stateId: location.stateId,
            stateName: '',
            cityId: location.cityId,
            cityName: location.cityName,
            latitude: location.latitude,
            longitude: location.longitude,
            createdBy: firstUser.id,
          },
        });
        results.proposals++;
      } catch (err) {
        console.error(`Failed to create proposal: ${template.title}`, err);
        results.skipped.push(`proposal: ${template.title}`);
      }
    }

    // ─── Seed Participatory Processes (8) ───
    for (let i = 0; i < 8; i++) {
      const template = PROCESS_TEMPLATES[i];
      const location = DEMO_LOCATIONS[i];

      try {
        await db.participatoryProcess.create({
          data: {
            slug: slugify(`${template.title}-${Date.now()}-${i}`),
            title: template.title,
            description: template.description,
            shortDescription: template.shortDescription,
            category: template.category,
            currentPhase: template.currentPhase,
            scope: template.scope,
            countryId: location.countryId,
            countryName: location.countryName,
            stateId: location.stateId,
            stateName: '',
            cityId: location.cityId,
            cityName: location.cityName,
            latitude: location.latitude,
            longitude: location.longitude,
            isPublic: true,
            allowProposals: true,
            allowComments: true,
            createdBy: firstUser.id,
          },
        });
        results.processes++;
      } catch (err) {
        console.error(`Failed to create process: ${template.title}`, err);
        results.skipped.push(`process: ${template.title}`);
      }
    }

    // ─── Seed Assemblies (6) ───
    for (let i = 0; i < 6; i++) {
      const template = ASSEMBLY_TEMPLATES[i];
      const location = DEMO_LOCATIONS[i];

      try {
        await db.assembly.create({
          data: {
            slug: slugify(`${template.name}-${Date.now()}-${i}`),
            name: template.name,
            description: template.description,
            purpose: template.purpose,
            scope: template.scope,
            meetingCadence: template.meetingCadence,
            isPublic: true,
            countryId: location.countryId,
            countryName: location.countryName,
            stateId: location.stateId,
            stateName: '',
            cityId: location.cityId,
            cityName: location.cityName,
            latitude: location.latitude,
            longitude: location.longitude,
            createdBy: firstUser.id,
          },
        });
        results.assemblies++;
      } catch (err) {
        console.error(`Failed to create assembly: ${template.name}`, err);
        results.skipped.push(`assembly: ${template.name}`);
      }
    }

    // ─── Seed Citizen Initiatives (5) ───
    for (let i = 0; i < 5; i++) {
      const template = INITIATIVE_TEMPLATES[i];
      const location = DEMO_LOCATIONS[i];

      try {
        await db.citizenInitiative.create({
          data: {
            title: template.title,
            description: template.description,
            type: template.type,
            signatureGoal: template.signatureGoal,
            status: template.status,
            countryId: location.countryId,
            countryName: location.countryName,
            stateId: location.stateId,
            stateName: '',
            cityId: location.cityId,
            cityName: location.cityName,
            latitude: location.latitude,
            longitude: location.longitude,
            createdBy: firstUser.id,
          },
        });
        results.initiatives++;
      } catch (err) {
        console.error(`Failed to create initiative: ${template.title}`, err);
        results.skipped.push(`initiative: ${template.title}`);
      }
    }

    // ─── Seed Meetings (4) ───
    for (let i = 0; i < 4; i++) {
      const template = MEETING_TEMPLATES[i];
      const location = DEMO_LOCATIONS[i];

      try {
        const startsAt = new Date();
        startsAt.setDate(startsAt.getDate() + 7 + i * 3);
        const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);

        await db.meeting.create({
          data: {
            title: template.title,
            description: template.description,
            type: template.type,
            address: template.address || null,
            status: template.status,
            startsAt,
            endsAt,
            countryId: location.countryId,
            countryName: location.countryName,
            stateId: location.stateId,
            stateName: '',
            cityId: location.cityId,
            cityName: location.cityName,
            latitude: location.latitude,
            longitude: location.longitude,
            createdBy: firstUser.id,
          },
        });
        results.meetings++;
      } catch (err) {
        console.error(`Failed to create meeting: ${template.title}`, err);
        results.skipped.push(`meeting: ${template.title}`);
      }
    }

    // ─── Seed Debate Sessions (3) ───
    for (let i = 0; i < 3; i++) {
      const template = DEBATE_TEMPLATES[i];
      const location = DEMO_LOCATIONS[i];

      try {
        await db.debateSession.create({
          data: {
            title: template.title,
            description: template.description,
            topic: template.topic,
            status: template.status,
            phase: template.phase,
            consensusLevel: template.consensusLevel,
            isPublic: true,
            countryId: location.countryId,
            countryName: location.countryName,
            stateId: location.stateId,
            stateName: '',
            cityId: location.cityId,
            cityName: location.cityName,
            latitude: location.latitude,
            longitude: location.longitude,
            createdBy: firstUser.id,
          },
        });
        results.debates++;
      } catch (err) {
        console.error(`Failed to create debate: ${template.title}`, err);
        results.skipped.push(`debate: ${template.title}`);
      }
    }

    return NextResponse.json({
      message: 'Demo data seeded successfully!',
      results,
      totalCreated: results.proposals + results.processes + results.assemblies + results.initiatives + results.meetings + results.debates,
      locations: DEMO_LOCATIONS.map(l => `${l.cityName}, ${l.countryName}`),
    });
  } catch (error) {
    console.error('[SEED_DEMO_ERROR]', error);
    return NextResponse.json({ error: 'Failed to seed demo data' }, { status: 500 });
  }
}
