// Runs inside the disposable PostgreSQL/app harness in check-missions.cjs.
module.exports = async function ({ check, db, base, owner, member, org, ownerCookie, memberCookie, login, passwordHash }) {
  const assert = require('node:assert/strict');
  const crypto = require('node:crypto');
  const fs = require('node:fs');
  const path = require('node:path');
  const admin = await db.user.create({ data: { email: 'integrity-admin@example.test', name: 'Reviewer', role: 'admin', passwordHash } });
  const adminCookie = await login(admin.email);
  const call = async (route, { method = 'GET', body, cookie = ownerCookie } = {}) => {
    const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, data, response };
  };
  await check('HTTP seed endpoints cannot create users, roles or sample data', async () => {
    const before = await db.user.count();
    for (const endpoint of ['/api/seed', '/api/geo/seed-demo', '/api/participation/seed', '/api/legislation/seed']) assert.ok([404, 405].includes((await call(endpoint, { method: 'POST', body: {}, cookie: '' })).status), endpoint);
    assert.equal(await db.user.count(), before);
  });
  await check('Official invitations are hashed, email-bound, expiring and single-use', async () => {
    assert.equal((await call('/api/admin/official-invitations', { method: 'POST', cookie: memberCookie, body: { email: 'official@example.test' } })).status, 403);
    const email = 'official@example.test';
    const issued = await call('/api/admin/official-invitations', { method: 'POST', cookie: adminCookie, body: { email } }); assert.equal(issued.status, 201);
    const stored = await db.officialInvitation.findUniqueOrThrow({ where: { id: issued.data.id } }); assert.notEqual(stored.tokenHash, issued.data.code); assert.equal(stored.tokenHash, crypto.createHash('sha256').update(issued.data.code).digest('hex'));
    const signup = (address, code) => call('/api/auth/signup', { method: 'POST', cookie: '', body: { email: address, password: 'A-secure-test-password!', name: 'Official', role: 'gov_official', govCode: code } });
    assert.equal((await signup('bad-code@example.test', 'GOV-2026-ALPHA')).status, 403);
    assert.equal((await signup('wrong-address@example.test', issued.data.code)).status, 403);
    const expired = await call('/api/admin/official-invitations', { method: 'POST', cookie: adminCookie, body: { email: 'expired@example.test' } });
    await db.officialInvitation.update({ where: { id: expired.data.id }, data: { expiresAt: new Date(0) } });
    assert.equal((await signup('expired@example.test', expired.data.code)).status, 403);
    const result = await signup(email, issued.data.code); assert.equal(result.status, 201); assert.equal(result.data.role, 'gov_official');
    assert.equal((await signup(email, issued.data.code)).status, 409);
    assert.ok((await db.officialInvitation.findUniqueOrThrow({ where: { id: issued.data.id } })).usedAt);
    const list = await call('/api/admin/official-invitations', { cookie: adminCookie }); assert.equal(list.status, 200); assert.ok(!JSON.stringify(list.data).includes('tokenHash')); assert.ok(!JSON.stringify(list.data).includes(issued.data.code));
  });
  await check('Proposal reads expose aggregate results and only the caller’s ballot', async () => {
    const proposal = await db.proposal.create({ data: { title: 'Private ballot test', description: 'A community decision.', organizationId: org.id, createdBy: owner.id, options: '["For","Against"]', isAnonymous: true, votes: { create: [{ voterId: owner.id, option: 'For' }, { voterId: member.id, option: 'Against' }] } } });
    for (const route of ['/api/proposals', '/api/proposals/' + proposal.id]) {
      const result = await call(route); assert.equal(result.status, 200);
      const value = Array.isArray(result.data) ? result.data.find(p => p.id === proposal.id) : result.data;
      assert.equal(value.votes.length, 1); assert.equal(value.votes[0].voterId, owner.id); assert.equal(value._count.votes, 2);
      assert.deepEqual(value.voteTotals.sort((a,b) => a.option.localeCompare(b.option)), [{ option: 'Against', count: 1 }, { option: 'For', count: 1 }]);
      assert.ok(!JSON.stringify(value).includes(member.id)); assert.ok(!('email' in value.creator));
    }
    assert.equal((await call('/api/proposals/' + proposal.id, { method: 'PATCH', cookie: memberCookie, body: { title: 'Hijacked' } })).status, 403);
    assert.equal((await call('/api/proposals/' + proposal.id, { method: 'PATCH', body: { createdBy: member.id } })).status, 400);
    assert.equal((await call('/api/proposals/' + proposal.id, { method: 'PATCH', body: { options: ['One', 'Two'] } })).status, 409);
  });
  await check('Voting gives no XP and unsupported ranked-choice ballots are rejected', async () => {
    const proposal = await db.proposal.create({ data: { title: 'An open decision', description: 'A bounded ballot.', createdBy: owner.id, options: '["For","Against"]' } });
    const xp = (await db.user.findUniqueOrThrow({ where: { id: member.id } })).totalXp;
    assert.equal((await call(`/api/proposals/${proposal.id}/vote`, { method: 'POST', cookie: memberCookie, body: { option: 'For' } })).status, 200);
    assert.equal((await call(`/api/proposals/${proposal.id}/vote`, { method: 'POST', cookie: memberCookie, body: { option: 'Against' } })).status, 200);
    assert.equal(await db.vote.count({ where: { proposalId: proposal.id, voterId: member.id } }), 1);
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: member.id } })).totalXp, xp);
    await db.proposal.update({ where: { id: proposal.id }, data: { votingType: 'ranked_choice' } });
    assert.equal((await call(`/api/proposals/${proposal.id}/vote`, { method: 'POST', body: { option: 'For' } })).status, 409);
  });
  await check('Concurrent budget allocations cannot exceed a voter’s allowance', async () => {
    const process = await db.participatoryProcess.create({ data: { title: 'Budget allocation', slug: 'integrity-budget', description: 'Each person has 100 credits.', currentPhase: 'voting', totalBudget: 100, createdBy: owner.id } });
    const one = await db.budgetProject.create({ data: { processId: process.id, title: 'Project one', description: 'First project.', budgetRequested: 100, createdBy: owner.id } });
    const two = await db.budgetProject.create({ data: { processId: process.id, title: 'Project two', description: 'Second project.', budgetRequested: 100, createdBy: owner.id } });
    const results = await Promise.all([one, two].map(project => call('/api/participation/budget', { method: 'POST', body: { projectId: project.id, amount: 70 } })));
    assert.equal(results.filter(r => r.status === 200).length, 1); assert.ok(results.some(r => [400,409].includes(r.status)));
    const sum = await db.budgetVote.aggregate({ where: { userId: owner.id, project: { processId: process.id } }, _sum: { amount: true } }); assert.equal(sum._sum.amount, 70);
    const vote = await db.budgetVote.findFirstOrThrow({ where: { userId: owner.id, project: { processId: process.id } } });
    assert.equal((await call('/api/participation/budget', { method: 'POST', body: { projectId: vote.projectId, amount: 0 } })).status, 200);
    assert.equal((await call('/api/participation/budget', { method: 'POST', body: { projectId: one.id, amount: 1000000 } })).status, 400);
    const pool = await call('/api/participation/budget?processId=' + process.id); assert.equal(pool.data.budgetPool.remaining, 100);
    await db.participatoryProcess.update({ where: { id: process.id }, data: { currentPhase: 'proposal' } });
    assert.equal((await call('/api/participation/budget', { method: 'POST', body: { projectId: one.id, amount: 1 } })).status, 409);
  });
  await check('Only reviewed signatures count toward a formal response threshold', async () => {
    const proposal = await db.bindingProposal.create({ data: { title: 'A request for response', description: 'Eligibility must be checked.', createdBy: owner.id, signatureGoal: 1 } });
    const path = `/api/binding-proposals/${proposal.id}/sign`;
    assert.equal((await call(path, { method: 'POST', body: {} })).status, 201);
    assert.equal((await call(path, { method: 'POST', body: {} })).status, 409);
    const before = await db.bindingProposal.findUniqueOrThrow({ where: { id: proposal.id } }); assert.equal(before.signatureCount, 0); assert.equal(before.status, 'collecting');
    const signature = await db.bindingProposalSignature.findFirstOrThrow({ where: { proposalId: proposal.id } });
    const body = { id: signature.id, verified: true, reason: 'Eligibility checked against the pilot register.' };
    assert.equal((await call('/api/admin/signatures', { method: 'PATCH', cookie: memberCookie, body })).status, 403);
    assert.equal((await call('/api/admin/signatures', { method: 'PATCH', cookie: adminCookie, body })).status, 200);
    const after = await db.bindingProposal.findUniqueOrThrow({ where: { id: proposal.id } }); assert.equal(after.signatureCount, 1); assert.equal(after.status, 'threshold_reached');
    const view = await call('/api/binding-proposals/' + proposal.id, { cookie: memberCookie }); assert.equal(view.data.proposal.signatures.length, 0); assert.equal(view.data.proposal.isBinding, false);
    assert.equal((await call('/api/admin/signatures', { method: 'PATCH', cookie: adminCookie, body: { ...body, verified: false } })).status, 200);
    assert.equal((await db.bindingProposal.findUniqueOrThrow({ where: { id: proposal.id } })).status, 'collecting');
  });
  await check('Every exported admin and government handler rejects unauthenticated and ordinary users', async () => {
    for (const dir of ['admin', 'gov-portal']) for (const name of fs.readdirSync(path.join(__dirname, '../src/app/api', dir), { recursive: true }).filter(name => name.endsWith('route.ts'))) {
      const source = fs.readFileSync(path.join(__dirname, '../src/app/api', dir, name), 'utf8');
      const endpoint = `/api/${dir}/${name.replaceAll(path.sep, '/').replace('/route.ts', '').replace('route.ts','').replace(/\[[^\]]+\]/g, 'missing')}`.replace(/\/$/, '');
      for (const match of source.matchAll(/export async function (GET|POST|PATCH|DELETE)\(/g)) {
        const method = match[1], body = method === 'GET' ? undefined : {};
        assert.ok([401,403].includes((await call(endpoint, { method, body, cookie: '' })).status), `${method} ${endpoint} permits unauthenticated access`);
        assert.equal((await call(endpoint, { method, body, cookie: memberCookie })).status, 403, `${method} ${endpoint} permits ordinary users`);
      }
    }
  });
  await check('Logout revokes its token and sign-out-everywhere revokes other signed sessions', async () => {
    const person = await db.user.create({ data: { email: 'sessions@example.test', name: 'Sessions', passwordHash } });
    const first = await login(person.email), second = await login(person.email);
    assert.equal((await call('/api/auth/logout', { method: 'POST', cookie: first })).status, 200);
    assert.equal((await call('/api/auth/me', { cookie: first })).status, 401);
    assert.equal((await call('/api/auth/me', { cookie: second })).status, 200);
    assert.equal((await call('/api/auth/sessions/revoke', { method: 'POST', cookie: second })).status, 200);
    assert.equal((await call('/api/auth/me', { cookie: second })).status, 401);
    assert.equal((await call('/api/auth/me', { cookie: await login(person.email) })).status, 200);
  });
  await check('Login throttling is persistent and returns a retry interval', async () => {
    for (let i = 0; i < 10; i++) assert.equal((await call('/api/auth/login', { method: 'POST', cookie: '', body: { email: 'rate-limit@example.test', password: 'Invalid-password' } })).status, 401);
    const result = await call('/api/auth/login', { method: 'POST', cookie: '', body: { email: 'rate-limit@example.test', password: 'Invalid-password' } }); assert.equal(result.status, 429); assert.ok(Number(result.response.headers.get('retry-after')) > 0);
  });
};
