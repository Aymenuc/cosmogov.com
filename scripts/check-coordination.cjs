module.exports = async function ({ check, db, base, owner, member, org, ownerCookie, memberCookie, outsiderCookie }) {
  const assert = require('node:assert/strict');
  const call = async (path, { method = 'GET', body, cookie = ownerCookie } = {}) => { const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); const data = await response.json(); return { status: response.status, data }; };
  const mission = await db.mission.create({ data: { title: 'Repair work together', goal: 'Match practical offers to a small repair session.', organizationId: org.id, createdBy: owner.id } });
  const path = '/api/missions/' + mission.id;
  const plan = await db.missionRun.create({ data: { missionId: mission.id, requestedBy: owner.id, stage: 'plan', origin: 'manual', status: 'completed', inputRevision: 0, acceptedAt: new Date(), reviewedBy: owner.id, output: { headline: 'A plan to review', summary: 'Use practical offers for a repair session.', findings: [], questions: [], tasks: [{ title: 'Repair clothes', detail: 'Use sewing equipment at the repair table.', minutes: 30 }], tool: null } } });
  const task = await db.missionTask.create({ data: { missionId: mission.id, runId: plan.id, position: 0, title: 'Repair clothes', detail: 'Use sewing equipment at the repair table.', minutes: 30 } });
  const tool = { title: 'Repair offers', description: 'Offer practical skills and equipment.', fields: [{ id: 'f1', label: 'What could you offer?', kind: 'choice', options: ['Sewing equipment', 'Welcoming'], required: true }] };
  const drafted = await call(path + '/tools/drafts', { method: 'POST', body: { inputRevision: 0, tool } }); assert.equal(drafted.status, 201); const formId = drafted.data.id;
  assert.equal((await call(`${path}/runs/${formId}/accept`, { method: 'POST' })).status, 200);
  const answerPath = `${path}/tools/${formId}/responses`;
  await call(answerPath, { method: 'POST', cookie: memberCookie, body: { values: { f1: 'Sewing equipment' } } });
  let response = await db.missionToolResponse.findUniqueOrThrow({ where: { runId_authorId: { runId: formId, authorId: member.id } } });
  let inviteId, templateId, copiedId;
  await check('Matching uses only opted-in offers and never assigns a task automatically', async () => {
    assert.equal((await call(path + '/matches')).data.suggestions.length, 0);
    assert.equal((await call(path + '/matches', { method: 'POST', body: { taskId: task.id, responseId: response.id } })).status, 409);
    await call(answerPath, { method: 'POST', cookie: memberCookie, body: { values: { f1: 'Sewing equipment' }, offerToHelp: true } });
    const suggestions = await call(path + '/matches'); assert.equal(suggestions.status, 200); assert.equal(suggestions.data.suggestions.length, 1); assert.ok(suggestions.data.suggestions[0].terms.includes('equipment'));
    assert.equal((await call(path + '/matches', { cookie: outsiderCookie })).status, 404);
    assert.equal((await call(path + '/matches', { method: 'POST', cookie: memberCookie, body: { taskId: task.id, responseId: response.id } })).status, 403);
    assert.equal((await call(path + '/matches', { method: 'POST', body: { taskId: task.id, responseId: response.id } })).status, 201);
    inviteId = (await db.missionMatch.findFirstOrThrow({ where: { taskId: task.id } })).id;
    assert.equal((await db.missionTask.findUniqueOrThrow({ where: { id: task.id } })).status, 'open');
    assert.ok(await db.notification.findFirst({ where: { userId: member.id, title: 'An invitation to help' } }));
  });
  await check('Only the invited participant accepts a match and task ownership is recorded', async () => {
    assert.equal((await call(path + '/matches', { method: 'PATCH', body: { matchId: inviteId, action: 'accept' } })).status, 403);
    assert.equal((await call(path + '/matches', { method: 'PATCH', cookie: memberCookie, body: { matchId: inviteId, action: 'accept' } })).status, 200);
    const saved = await db.missionTask.findUniqueOrThrow({ where: { id: task.id } }); assert.equal(saved.assignedToId, member.id); assert.equal(saved.status, 'claimed');
    assert.equal((await call(path + '/matches', { method: 'PATCH', cookie: memberCookie, body: { matchId: inviteId, action: 'accept' } })).status, 409);
    assert.ok(await db.missionEvent.findFirst({ where: { taskId: task.id, actorId: member.id, action: 'task_claim' } }));
  });
  await check('Withdrawing matching consent withdraws pending invitations', async () => {
    const second = await db.missionTask.create({ data: { missionId: mission.id, runId: plan.id, position: 1, title: 'Set up equipment', detail: 'Prepare the sewing equipment.', minutes: 20 } });
    assert.equal((await call(path + '/matches', { method: 'POST', body: { taskId: second.id, responseId: response.id } })).status, 201);
    await call(answerPath, { method: 'POST', cookie: memberCookie, body: { values: { f1: 'Sewing equipment' }, offerToHelp: false } });
    const pending = await db.missionMatch.findFirstOrThrow({ where: { taskId: second.id } }); assert.equal(pending.status, 'withdrawn');
    assert.equal((await call(path + '/matches', { method: 'PATCH', cookie: memberCookie, body: { matchId: pending.id, action: 'accept' } })).status, 409);
  });
  await check('Evidence-backed outcomes appear in accountability only for permitted viewers', async () => {
    assert.equal((await call(`${path}/tasks/${task.id}`, { method: 'PATCH', cookie: memberCookie, body: { action: 'complete', evidence: { note: 'The sewing station was set up and the repair session took place.', url: 'https://example.test/session-log' } } })).status, 200);
    const outcomes = await call('/api/missions/outcomes'); assert.ok(outcomes.data.outcomes.some(outcome => outcome.id === task.id));
    const hidden = await call('/api/missions/outcomes', { cookie: outsiderCookie }); assert.ok(!hidden.data.outcomes.some(outcome => outcome.id === task.id));
    const privateProcess = await db.participatoryProcess.create({ data: { title: 'Private milestones', description: 'Visible to its creator only.', slug: 'private-accountability-fixture', isPublic: false, createdBy: member.id } });
    const milestone = await db.implementationMilestone.create({ data: { processId: privateProcess.id, title: 'Private record', createdBy: member.id } });
    const listing = await call('/api/participation/accountability'); assert.ok(!listing.data.milestones.some(item => item.id === milestone.id));
    assert.equal((await call('/api/participation/accountability', { method: 'PATCH', cookie: memberCookie, body: { id: milestone.id, status: 'completed' } })).status, 400);
    assert.equal((await call('/api/participation/accountability', { method: 'PATCH', cookie: memberCookie, body: { id: milestone.id, status: 'completed', evidence: [{ type: 'note', description: 'A concrete completion report from the responsible person.' }] } })).status, 200);
    assert.equal((await call('/api/participation/accountability', { method: 'PATCH', cookie: memberCookie, body: { id: milestone.id, evidence: [] } })).status, 400);
  });
  await check('Templates copy reviewed plan/form text with credit and no participation data', async () => {
    const result = await call('/api/mission-templates', { method: 'POST', body: { missionId: mission.id, name: 'A repair session starter', scope: 'organization', planRunId: plan.id, formRunId: formId } }); assert.equal(result.status, 201); templateId = result.data.id;
    assert.deepEqual(Object.keys(result.data.content).sort(), ['tasks', 'tool']); assert.ok(!JSON.stringify(result.data.content).includes('Noura')); assert.equal(result.data.authorName, 'Alex');
    const list = await call('/api/mission-templates', { cookie: memberCookie }); assert.ok(list.data.some(template => template.id === templateId));
    assert.equal((await call('/api/missions', { method: 'POST', cookie: outsiderCookie, body: { title: 'Forbidden copy', goal: 'Cannot read this template.', templateId } })).status, 404);
    const copy = await call('/api/missions', { method: 'POST', cookie: memberCookie, body: { title: 'Our next repair session', goal: 'Adapt this starting point for our neighborhood.', organizationId: org.id, templateId } }); assert.equal(copy.status, 201); copiedId = copy.data.id;
    const copied = await call('/api/missions/' + copiedId, { cookie: memberCookie }); assert.match(copied.data.templateCredit, /Alex/); assert.equal(copied.data.contributions.length, 0); assert.equal(copied.data.toolResponses.length, 0); assert.equal(copied.data.tasks.length, 0); assert.equal(copied.data.runs.length, 2); assert.ok(copied.data.runs.every(run => run.origin === 'template' && !run.acceptedAt));
  });
  await check('Deleting the source removes its shared template without deleting adapted missions', async () => {
    assert.equal((await call(path, { method: 'DELETE', body: { confirmation: mission.title } })).status, 200);
    assert.equal(await db.missionTemplate.count({ where: { id: templateId } }), 0);
    const copy = await db.mission.findUniqueOrThrow({ where: { id: copiedId } }); assert.equal(copy.templateId, null); assert.match(copy.templateCredit, /Alex/);
  });
};
