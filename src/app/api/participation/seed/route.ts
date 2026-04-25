import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    // Seed sample initiatives
    const initiatives = await Promise.all([
      db.citizenInitiative.create({
        data: {
          title: 'Expand Public Transit to Outer Districts',
          description: 'Our outer districts have been underserved by public transit for too long. This initiative demands the city allocate funds to extend metro lines and bus routes to reach all neighborhoods, ensuring equitable access to transportation for every citizen.',
          type: 'petition',
          signatureGoal: 1000,
          signatureCount: 847,
          status: 'collecting',
          closesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdBy: session.id,
        },
      }),
      db.citizenInitiative.create({
        data: {
          title: 'Mandate Renewable Energy for All New Buildings',
          description: 'All new construction projects should be required to incorporate renewable energy sources—solar panels, wind turbines, or geothermal systems. This referendum ensures our city leads the transition to clean energy.',
          type: 'referendum',
          signatureGoal: 2000,
          signatureCount: 2150,
          status: 'threshold_reached',
          closesAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          createdBy: session.id,
        },
      }),
      db.citizenInitiative.create({
        data: {
          title: 'Recall District 7 Council Member for Ethics Violations',
          description: 'Multiple ethics violations have been documented regarding Council Member Vex Harlow. Citizens of District 7 demand accountability and a special election to replace this seat.',
          type: 'recall',
          signatureGoal: 500,
          signatureCount: 312,
          status: 'collecting',
          closesAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          createdBy: session.id,
        },
      }),
      db.citizenInitiative.create({
        data: {
          title: 'Universal Digital Literacy Program',
          description: 'Propose a city-wide digital literacy program that provides free training, devices, and internet access to all residents. No one should be left behind in the digital age.',
          type: 'proposal',
          signatureGoal: 1500,
          signatureCount: 1580,
          status: 'government_response',
          governmentResponse: 'The City Council acknowledges the initiative and has allocated initial funding for a pilot program in 3 districts. Full implementation will be discussed in the next budget cycle.',
          responseDate: new Date(),
          closesAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          createdBy: session.id,
        },
      }),
      db.citizenInitiative.create({
        data: {
          title: 'Protect Urban Green Spaces from Development',
          description: 'Our parks and green spaces are being threatened by commercial development. This initiative calls for a binding resolution to protect all existing public green spaces from rezoning.',
          type: 'petition',
          signatureGoal: 3000,
          signatureCount: 3200,
          status: 'enacted',
          closesAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          createdBy: session.id,
        },
      }),
    ]);

    // Seed sample assemblies
    const assemblies = await Promise.all([
      db.assembly.create({
        data: {
          name: 'Citywide Advisory Council',
          slug: 'citywide-advisory-council',
          description: 'A general advisory assembly that deliberates on city-wide policies, budgets, and strategic initiatives. Open to all registered citizens who wish to contribute their voice.',
          purpose: 'advisory',
          scope: 'general',
          meetingCadence: 'monthly',
          memberCount: 1,
          isPublic: true,
          createdBy: session.id,
          members: {
            create: [{ userId: session.id, role: 'coordinator' }],
          },
        },
      }),
      db.assembly.create({
        data: {
          name: 'Nova Heights Neighborhood Assembly',
          slug: 'nova-heights-neighborhood',
          description: 'Residents of Nova Heights working together to improve local infrastructure, safety, and community services. Focused on neighborhood-level issues and solutions.',
          purpose: 'deliberation',
          scope: 'neighborhood',
          meetingCadence: 'biweekly',
          memberCount: 1,
          isPublic: true,
          createdBy: session.id,
          members: {
            create: [{ userId: session.id, role: 'facilitator' }],
          },
        },
      }),
      db.assembly.create({
        data: {
          name: 'Environmental Policy Working Group',
          slug: 'environmental-policy-wg',
          description: 'A thematic working group focused on developing and advocating for environmental policies. Members research, draft proposals, and coordinate advocacy campaigns.',
          purpose: 'working_group',
          scope: 'thematic',
          meetingCadence: 'weekly',
          memberCount: 1,
          isPublic: true,
          createdBy: session.id,
          members: {
            create: [{ userId: session.id, role: 'coordinator' }],
          },
        },
      }),
      db.assembly.create({
        data: {
          name: 'Budget Decision Committee',
          slug: 'budget-decision-committee',
          description: 'The official decision-making body for participatory budget allocation. This committee reviews proposals, evaluates community priorities, and decides on fund distribution.',
          purpose: 'decision_making',
          scope: 'sectoral',
          meetingCadence: 'monthly',
          memberCount: 1,
          isPublic: true,
          createdBy: session.id,
          members: {
            create: [{ userId: session.id, role: 'coordinator' }],
          },
        },
      }),
    ]);

    // Seed sample meetings
    const now = Date.now();
    const meetings = await Promise.all([
      db.meeting.create({
        data: {
          title: 'Monthly City Advisory Session',
          description: 'Regular monthly meeting of the Citywide Advisory Council. Agenda includes budget review, new policy proposals, and community feedback.',
          type: 'hybrid',
          address: 'City Hall, Room 402, Civic Center',
          videoUrl: 'https://meet.example.com/city-advisory',
          startsAt: new Date(now + 3 * 24 * 60 * 60 * 1000),
          endsAt: new Date(now + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          attendeeCount: 1,
          maxAttendees: 100,
          status: 'scheduled',
          agenda: JSON.stringify([
            { item: 'Welcome & Roll Call', duration: 10, presenter: 'Coordinator' },
            { item: 'Budget Review Q3', duration: 30, presenter: 'Finance Lead' },
            { item: 'New Policy Proposals', duration: 45, presenter: 'Policy Team' },
            { item: 'Community Feedback Session', duration: 30, presenter: 'All' },
            { item: 'Action Items & Next Steps', duration: 15, presenter: 'Coordinator' },
          ]),
          assemblyId: assemblies[0].id,
          createdBy: session.id,
          attendees: { create: { userId: session.id, role: 'organizer' } },
        },
      }),
      db.meeting.create({
        data: {
          title: 'Nova Heights Safety Walk & Discussion',
          description: 'Join us for a neighborhood safety walkthrough followed by a community discussion on improving lighting, crosswalks, and emergency services.',
          type: 'in_person',
          address: 'Nova Heights Community Center, 142 Starlight Ave',
          startsAt: new Date(now + 5 * 24 * 60 * 60 * 1000),
          endsAt: new Date(now + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
          attendeeCount: 1,
          maxAttendees: 50,
          status: 'scheduled',
          agenda: JSON.stringify([
            { item: 'Safety Walk through District', duration: 60, presenter: 'Facilitator' },
            { item: 'Findings Discussion', duration: 30, presenter: 'All' },
            { item: 'Action Plan Drafting', duration: 45, presenter: 'Working Group' },
          ]),
          assemblyId: assemblies[1].id,
          createdBy: session.id,
          attendees: { create: { userId: session.id, role: 'organizer' } },
        },
      }),
      db.meeting.create({
        data: {
          title: 'Environmental Policy Hackathon',
          description: 'Collaborative online session to draft environmental policy proposals for the next council cycle. Bring your ideas and research!',
          type: 'virtual',
          videoUrl: 'https://meet.example.com/eco-hackathon',
          startsAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
          endsAt: new Date(now + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          attendeeCount: 1,
          maxAttendees: 200,
          status: 'scheduled',
          agenda: JSON.stringify([
            { item: 'Opening & Research Overview', duration: 20, presenter: 'Coordinator' },
            { item: 'Breakout: Draft Proposals', duration: 90, presenter: 'Teams' },
            { item: 'Present & Discuss', duration: 60, presenter: 'All' },
            { item: 'Vote on Priorities', duration: 30, presenter: 'Coordinator' },
          ]),
          assemblyId: assemblies[2].id,
          createdBy: session.id,
          attendees: { create: { userId: session.id, role: 'organizer' } },
        },
      }),
      db.meeting.create({
        data: {
          title: 'Q1 Budget Review & Retrospective',
          description: 'Review of Q1 budget spending and outcomes. Lessons learned for the next cycle.',
          type: 'hybrid',
          address: 'Government Center, Conference Room A',
          startsAt: new Date(now - 15 * 24 * 60 * 60 * 1000),
          endsAt: new Date(now - 15 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          attendeeCount: 1,
          status: 'completed',
          agenda: JSON.stringify([
            { item: 'Q1 Spending Review', duration: 30, presenter: 'Finance Lead' },
            { item: 'Outcomes Assessment', duration: 30, presenter: 'Committee' },
            { item: 'Lessons Learned', duration: 30, presenter: 'All' },
          ]),
          minutes: 'Q1 spending was within budget across all categories. Key outcomes include: 3 new community centers opened, 12km of bike lanes completed, and 500 new trees planted. Areas for improvement: procurement delays and community engagement in outer districts.',
          recordingUrl: 'https://recordings.example.com/budget-q1-review',
          assemblyId: assemblies[3].id,
          createdBy: session.id,
          attendees: { create: { userId: session.id, role: 'organizer', attended: true } },
        },
      }),
    ]);

    return NextResponse.json({
      seeded: true,
      initiatives: initiatives.length,
      assemblies: assemblies.length,
      meetings: meetings.length,
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
