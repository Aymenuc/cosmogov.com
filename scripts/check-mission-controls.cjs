module.exports = async function ({ check, db, base, owner, member, org, ownerCookie, memberCookie, login, passwordHash, cronSecret }) {
  const assert = require('node:assert/strict');
  const call = async (path, { method = 'GET', body, cookie = ownerCookie, headers = {} } = {}) => { const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...headers, ...(cookie ? { Cookie: cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); const raw = await response.text(); let data; try { data = JSON.parse(raw); } catch { data = raw; } return { response, data, status: response.status }; };
  const mission = await db.mission.create({ data: { title: 'Mission controls fixture', goal: 'Review visibility, retention and evidence.', organizationId: org.id, createdBy: owner.id } });
  const path = '/api/missions/' + mission.id;
  const other = await db.user.create({ data: { email: 'controls-member@example.test', name: 'Other participant', passwordHash } });
  await db.membership.create({ data: { userId: other.id, organizationId: org.id } }); const otherCookie = await login(other.email);
  const tool = { title: 'Practical offers', description: 'Tell us what you can offer.', fields: [{ id: 'f1', label: 'Offer', kind: 'text', options: [], required: true }] };
  const draft = await call(path + '/tools/drafts', { method: 'POST', body: { tool, inputRevision: 0 } }); assert.equal(draft.status, 201); const runId = draft.data.id;
  assert.equal((await call(`${path}/runs/${runId}/accept`, { method: 'POST' })).status, 200);
  const answerPath = `${path}/tools/${runId}/responses`;
  await check('Private forms expose only permitted answers and save their retention notice', async () => {
    assert.equal((await call(answerPath, { method: 'POST', cookie: memberCookie, body: { values: { f1: '=HYPERLINK("https://example.test")' } } })).status, 200);
    const saved = await db.missionToolResponse.findUniqueOrThrow({ where: { runId_authorId: { runId, authorId: member.id } } });
    assert.equal(saved.noticeVersion, 'mission-form-v2'); assert.equal(saved.notice.visibility, 'organizers'); assert.equal(saved.notice.retentionDays, 90); assert.ok(saved.expiresAt > new Date());
    assert.equal((await call(path, { cookie: ownerCookie })).data.toolResponses.length, 1);
    assert.equal((await call(path, { cookie: memberCookie })).data.toolResponses.length, 1);
    assert.equal((await call(path, { cookie: otherCookie })).data.toolResponses.length, 0);
  });
  await check('CSV export is organizer-only and neutralizes spreadsheet formulas', async () => {
    assert.equal((await call(`${path}/tools/${runId}/export`, { cookie: memberCookie })).status, 403);
    const result = await call(`${path}/tools/${runId}/export`); assert.equal(result.status, 200); assert.match(result.response.headers.get('content-type'), /text\/csv/); assert.ok(result.data.includes("'=HYPERLINK")); assert.ok(result.data.includes('Noura')); assert.ok(!result.data.includes(member.email));
  });
  await check('Closing, unpublishing and reopening are authorized and preserve existing responses', async () => {
    const statePath = `${path}/tools/${runId}`;
    assert.equal((await call(statePath, { method: 'PATCH', cookie: memberCookie, body: { action: 'close' } })).status, 403);
    assert.equal((await call(statePath, { method: 'PATCH', body: { action: 'close', responseVisibility: 'members' } })).status, 400);
    assert.equal((await call(statePath, { method: 'PATCH', body: { action: 'close' } })).status, 200);
    assert.equal((await call(answerPath, { method: 'POST', cookie: memberCookie, body: { values: { f1: 'Changed' } } })).status, 409);
    assert.equal(await db.missionToolResponse.count({ where: { runId } }), 1);
    assert.equal((await call(statePath, { method: 'PATCH', body: { action: 'unpublish' } })).status, 200);
    assert.equal((await call(path, { cookie: otherCookie })).data.runs.filter(run => run.id === runId).length, 0);
    assert.equal((await call(path, { cookie: memberCookie })).data.toolResponses.length, 1);
    assert.equal((await call(answerPath, { method: 'DELETE', cookie: memberCookie })).status, 200);
    assert.equal((await call(statePath, { method: 'PATCH', body: { action: 'reopen' } })).status, 200);
  });
  await check('Sensitive-question review is enforced by the server before publication', async () => {
    const sensitive = { ...tool, fields: [{ ...tool.fields[0], label: 'Your email address' }] };
    assert.equal((await call(path + '/tools/drafts', { method: 'POST', body: { tool: sensitive, inputRevision: 0 } })).status, 400);
    assert.equal((await call(path + '/tools/drafts', { method: 'POST', body: { tool: sensitive, inputRevision: 0, settings: { responseVisibility: 'members', retentionDays: 30, sensitiveReason: 'A necessary way to coordinate this specific service.' } } })).status, 400);
    const result = await call(path + '/tools/drafts', { method: 'POST', body: { tool: sensitive, inputRevision: 0, settings: { responseVisibility: 'organizers', retentionDays: 30, sensitiveReason: 'A necessary way to coordinate this specific service.' } } }); assert.equal(result.status, 201);
    assert.equal((await call(`${path}/runs/${result.data.id}/accept`, { method: 'POST' })).status, 200);
  });
  await check('Task completion requires evidence and records an atomic actor history', async () => {
    const run = await db.missionRun.create({ data: { missionId: mission.id, requestedBy: member.id, stage: 'plan', status: 'completed', inputRevision: 0, origin: 'manual' } });
    const task = await db.missionTask.create({ data: { missionId: mission.id, runId: run.id, position: 0, title: 'Confirm venue', detail: 'Get a written answer.', minutes: 10 } });
    const taskPath = `${path}/tasks/${task.id}`;
    assert.equal((await call(taskPath, { method: 'PATCH', cookie: memberCookie, body: { action: 'claim' } })).status, 200);
    assert.equal((await call(taskPath, { method: 'PATCH', cookie: memberCookie, body: { action: 'complete' } })).status, 400);
    assert.equal((await call(taskPath, { method: 'PATCH', cookie: otherCookie, body: { action: 'complete', evidence: { note: 'This should not be accepted as somebody else’s work.' } } })).status, 403);
    assert.equal((await call(taskPath, { method: 'PATCH', cookie: memberCookie, body: { action: 'complete', evidence: { note: 'The venue confirmed availability in writing today.', url: 'https://example.test/venue' } } })).status, 200);
    const saved = await db.missionTask.findUniqueOrThrow({ where: { id: task.id }, include: { events: true } }); assert.equal(saved.status, 'done'); assert.equal(saved.evidence.length, 1); assert.equal(saved.events.length, 2); assert.ok(saved.events.every(event => event.actorId === member.id));
  });
  await check('Expired responses are hidden and the authenticated cleanup job deletes old records', async () => {
    await call(answerPath, { method: 'POST', cookie: memberCookie, body: { values: { f1: 'Expired answer' } } });
    await db.missionToolResponse.update({ where: { runId_authorId: { runId, authorId: member.id } }, data: { expiresAt: new Date(0) } });
    assert.equal((await call(path, { cookie: memberCookie })).data.toolResponses.length, 0);
    await db.rateLimitBucket.create({ data: { key: 'expired-fixture', expiresAt: new Date(0) } });
    await db.revokedSession.create({ data: { tokenHash: 'expired-fixture', expiresAt: new Date(0) } });
    assert.equal((await call('/api/maintenance/cleanup', { cookie: '' })).status, 401);
    const cleanup = await call('/api/maintenance/cleanup', { cookie: '', headers: { Authorization: `Bearer ${cronSecret}` } }); assert.equal(cleanup.status, 200); assert.ok(cleanup.data.deletedLimits >= 1); assert.ok(cleanup.data.deletedRevocations >= 1);
  });
  await check('Mission deletion requires exact confirmation and cascades through its records', async () => {
    assert.equal((await call(path, { method: 'DELETE', cookie: memberCookie, body: { confirmation: mission.title } })).status, 403);
    assert.equal((await call(path, { method: 'DELETE', body: { confirmation: 'Wrong title' } })).status, 400);
    await db.mission.update({ where: { id: mission.id }, data: { runLeaseUntil: new Date(Date.now() + 100000) } });
    assert.equal((await call(path, { method: 'DELETE', body: { confirmation: mission.title } })).status, 409);
    await db.mission.update({ where: { id: mission.id }, data: { runLeaseUntil: null } });
    assert.equal((await call(path, { method: 'DELETE', body: { confirmation: mission.title } })).status, 200);
    assert.equal(await db.missionRun.count({ where: { missionId: mission.id } }), 0); assert.equal(await db.missionEvent.count({ where: { missionId: mission.id } }), 0); assert.equal(await db.missionToolResponse.count({ where: { missionId: mission.id } }), 0);
  });
};
