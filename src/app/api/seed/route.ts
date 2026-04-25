import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    // Check if already seeded
    const count = await db.user.count();
    if (count > 0) {
      return NextResponse.json({ message: 'Already seeded', count });
    }

    // Create demo users
    const pw = await hashPassword('demo123');
    const alice = await db.user.create({ data: { email: 'alice@cosmogov.io', name: 'Alice Nova', passwordHash: pw, plan: 'guild', role: 'admin', totalXp: 4850, level: 12, streak: 7 } });
    const bob = await db.user.create({ data: { email: 'bob@cosmogov.io', name: 'Bob Stellar', passwordHash: pw, plan: 'team', role: 'admin', totalXp: 2200, level: 7, streak: 3 } });
    const carol = await db.user.create({ data: { email: 'carol@cosmogov.io', name: 'Carol Cosmos', passwordHash: pw, plan: 'community', totalXp: 890, level: 4, streak: 0 } });

    // Create demo organizations
    const stargate = await db.organization.create({ data: { name: 'Stargate Collective', slug: 'stargate', description: 'Interplanetary governance research lab', createdBy: alice.id, plan: 'guild' } });
    const nebula = await db.organization.create({ data: { name: 'Nebula Alliance', slug: 'nebula', description: 'Decentralized decision making community', createdBy: bob.id, plan: 'team' } });

    // Memberships
    await db.membership.createMany({ data: [
      { userId: alice.id, organizationId: stargate.id, role: 'admin' },
      { userId: bob.id, organizationId: stargate.id, role: 'member' },
      { userId: carol.id, organizationId: stargate.id, role: 'member' },
      { userId: bob.id, organizationId: nebula.id, role: 'admin' },
      { userId: alice.id, organizationId: nebula.id, role: 'member' },
    ]});

    // Demo proposals
    const p1 = await db.proposal.create({ data: { organizationId: stargate.id, title: 'Implement Quadratic Voting for Budget Allocation', description: 'We propose adopting quadratic voting for our quarterly budget decisions. This ensures minority voices are heard while still reflecting majority preferences. Under the current system, 51% can dominate 49% — quadratic voting changes the calculus by making each additional vote cost more, naturally limiting the power of concentrated interests.', category: 'governance', votingType: 'yes_no', options: JSON.stringify(['For', 'Against']), status: 'active', quorum: 10, createdBy: alice.id, closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    const p2 = await db.proposal.create({ data: { organizationId: stargate.id, title: 'Adopt AI-Assisted Proposal Review Pipeline', description: 'Integrate AI analysis into our proposal review process. The AI will evaluate proposal clarity, identify potential biases, assess risk factors, and generate impact summaries before community voting begins.', category: 'technology', votingType: 'single_choice', options: JSON.stringify(['Full Integration', 'Pilot Program', 'Reject']), status: 'active', quorum: 8, createdBy: bob.id, closesAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) } });
    const p3 = await db.proposal.create({ data: { organizationId: nebula.id, title: 'Weekly Gamification Challenges', description: 'Introduce weekly governance games with XP rewards to increase participation. Games like Neural Consensus and Oracle Protocol will run on a weekly schedule with leaderboards.', category: 'engagement', votingType: 'yes_no', options: JSON.stringify(['Yes', 'No']), status: 'closed', quorum: 5, createdBy: bob.id } });
    const p4 = await db.proposal.create({ data: { organizationId: stargate.id, title: 'Open Source Governance Framework', description: 'Release our governance framework as open source to enable other organizations to adopt and improve upon our decision-making processes.', category: 'community', votingType: 'ranked_choice', options: JSON.stringify(['MIT License', 'Apache 2.0', 'GPL v3', 'Keep Proprietary']), status: 'active', quorum: 10, createdBy: alice.id, closesAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) } });
    const p5 = await db.proposal.create({ data: { organizationId: nebula.id, title: 'Implement Delegation System', description: 'Allow members to delegate their voting power to trusted representatives on specific topics. Delegators can override at any time.', category: 'governance', votingType: 'yes_no', options: JSON.stringify(['For', 'Against']), status: 'active', quorum: 8, createdBy: carol.id, closesAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) } });

    // Demo votes
    await db.vote.createMany({ data: [
      { proposalId: p1.id, voterId: alice.id, option: 'For', confidence: 5, reasoning: 'Quadratic voting better represents intensity of preferences' },
      { proposalId: p1.id, voterId: bob.id, option: 'For', confidence: 4 },
      { proposalId: p1.id, voterId: carol.id, option: 'Against', confidence: 3, reasoning: 'Complexity might reduce participation' },
      { proposalId: p2.id, voterId: alice.id, option: 'Pilot Program', confidence: 4 },
      { proposalId: p2.id, voterId: bob.id, option: 'Full Integration', confidence: 5 },
      { proposalId: p3.id, voterId: alice.id, option: 'Yes', confidence: 5 },
      { proposalId: p3.id, voterId: bob.id, option: 'Yes', confidence: 4 },
      { proposalId: p3.id, voterId: carol.id, option: 'Yes', confidence: 3 },
      { proposalId: p4.id, voterId: alice.id, option: 'MIT License', confidence: 4 },
      { proposalId: p4.id, voterId: bob.id, option: 'Apache 2.0', confidence: 3 },
      { proposalId: p4.id, voterId: carol.id, option: 'MIT License', confidence: 4 },
      { proposalId: p5.id, voterId: alice.id, option: 'For', confidence: 5 },
      { proposalId: p5.id, voterId: bob.id, option: 'For', confidence: 3 },
    ]});

    // Demo game results
    await db.gameResult.createMany({ data: [
      { userId: alice.id, gameSlug: 'neural-consensus', gameType: 'neural_consensus', score: 92, xpEarned: 150, accuracy: 0.92 },
      { userId: alice.id, gameSlug: 'oracle-protocol', gameType: 'oracle_protocol', score: 78, xpEarned: 120, accuracy: 0.78 },
      { userId: alice.id, gameSlug: 'signal-detective', gameType: 'signal_detective', score: 85, xpEarned: 135, accuracy: 0.85 },
      { userId: bob.id, gameSlug: 'neural-consensus', gameType: 'neural_consensus', score: 65, xpEarned: 100, accuracy: 0.65 },
      { userId: bob.id, gameSlug: 'cognitive-warfare', gameType: 'cognitive_warfare', score: 71, xpEarned: 110, accuracy: 0.71 },
      { userId: carol.id, gameSlug: 'chrono-autopsy', gameType: 'chrono_autopsy', score: 88, xpEarned: 140, accuracy: 0.88 },
    ]});

    // Demo notifications
    await db.notification.createMany({ data: [
      { userId: alice.id, type: 'vote', title: 'New vote on your proposal', message: 'Bob Stellar voted on "Implement Quadratic Voting"', link: '/dashboard/proposals' },
      { userId: alice.id, type: 'game', title: 'Weekly game results', message: 'Neural Consensus round completed — you ranked #1!' },
      { userId: bob.id, type: 'proposal', title: 'New proposal created', message: 'Alice Nova created "Open Source Governance Framework"' },
    ]});

    // Demo contact messages
    await db.contactMessage.createMany({ data: [
      { name: 'John Dao', email: 'john@dao.io', subject: 'Enterprise Inquiry', message: 'We are interested in deploying CosmoGov for our 500-member DAO. Can we schedule a demo?', category: 'sales', priority: 'high', status: 'new' },
      { name: 'Sarah Light', email: 'sarah@light.org', subject: 'Partnership Opportunity', message: 'Our nonprofit would love to integrate CosmoGov governance tools with our platform.', category: 'partnership', priority: 'normal', status: 'read' },
      { name: 'Mike Validator', email: 'mike@chain.net', subject: 'Bug Report: Voting Anomaly', message: 'During ranked choice voting, the results seem to calculate incorrectly when there are more than 4 options.', category: 'support', priority: 'urgent', status: 'new' },
    ]});

    // Demo billing records
    await db.billingRecord.createMany({ data: [
      { userId: alice.id, plan: 'guild', amount: 14900, status: 'paid', periodStart: new Date('2026-04-01'), periodEnd: new Date('2026-05-01') },
      { userId: bob.id, plan: 'team', amount: 3900, status: 'paid', periodStart: new Date('2026-04-01'), periodEnd: new Date('2026-05-01') },
    ]});

    return NextResponse.json({ message: 'Seeded successfully', users: 3, orgs: 2, proposals: 5 });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
