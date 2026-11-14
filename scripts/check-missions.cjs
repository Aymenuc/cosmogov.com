/* Integration checks: a disposable PostgreSQL database, real API routes and signed
 * sessions, plus an isolated HTTP AI provider. No external AI requests are made.
 * Install embedded-postgres outside the app and set COSMOGOV_EMBEDDED_PG to its
 * module path, or make it resolvable. Playwright + Chromium are needed for UI checks.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.COSMOGOV_TEST_ARTIFACTS || path.join(root, 'artifacts/missions');
fs.mkdirSync(output, { recursive: true });
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'cosmogov-missions-'));
const checks = [], failures = [], pageErrors = [];
let db, postgres, modelServer, app, browser, providerMode = 'valid', providerDelay = 0;
async function check(name, fn) { try { await fn(); checks.push(name); console.log('PASS', name); } catch (error) { failures.push({ name, error: error.stack }); console.log('FAIL', name, error.message); } }
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function freePort() { const server = http.createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port; }
async function screenshot(page, name) { await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); }); await page.screenshot({ path: path.join(output, name), fullPage: true, animations: 'disabled' }); }
async function noOverflow(page) { const sizes = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); assert.ok(sizes[0] <= sizes[1] + 1, `Overflow: ${sizes}`); }
(async () => {
  const { default: EmbeddedPostgres } = await import(require.resolve(process.env.COSMOGOV_EMBEDDED_PG || 'embedded-postgres'));
  const pgPort = await freePort(), appPort = await freePort();
  const dbPassword = crypto.randomBytes(16).toString('hex');
  postgres = new EmbeddedPostgres({ databaseDir: path.join(work, 'pg'), port: pgPort, user: 'mission_test', password: dbPassword, persistent: false, onLog: () => {}, onError: () => {} });
  await postgres.initialise(); await postgres.start(); await postgres.createDatabase('cosmogov_mission_test');
  const databaseUrl = `postgresql://mission_test:${dbPassword}@127.0.0.1:${pgPort}/cosmogov_mission_test`;
  const modelRequests = [];
  modelServer = http.createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw); const input = JSON.parse(body.messages.at(-1).content);
    modelRequests.push(input); const mode = providerMode; await delay(providerDelay);
    if (mode === 'fail') { res.writeHead(503); return res.end('Provider unavailable'); }
    const result = {
      headline: `${input.stage} output for ${input.title}`, summary: 'A draft based on the contributed context. Review the references before using it.',
      findings: input.sources.length ? [{ text: input.sources[0].text, sourceIds: [mode === 'bad-citation' ? 'fabricated-source' : input.sources[0].id] }] : [],
      questions: ['Who can verify the practical requirements?'],
      tasks: input.stage === 'plan' ? [{ title: 'Confirm the room', detail: 'Ask for written availability and add it to the mission sources.', minutes: 20 }, { title: 'Gather offers of help', detail: 'Find out what participants can contribute.', minutes: 30 }] : [],
      tool: input.stage === 'tool' ? { title: 'Repair café offers', description: 'A practical form for community offers.', fields: [{ id: 'f1', label: 'How can you help?', kind: 'choice', options: ['Mending', 'Welcoming', 'Equipment'], required: true }, { id: 'f2', label: 'What could you bring?', kind: 'text', options: [], required: false }] } : null,
    };
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(result) } }] }));
  });
  await new Promise(resolve => modelServer.listen(0, '127.0.0.1', resolve));
  const env = { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl, SESSION_SECRET: crypto.randomBytes(32).toString('hex'), Z_AI_USE_OPENAI_COMPAT: '1', Z_AI_SKIP_CHAT_TEMPLATE_KWARGS: '1', Z_AI_BASE_URL: `http://127.0.0.1:${modelServer.address().port}/v1`, Z_AI_API_KEY: 'isolated-test-provider', MISSION_WEB_SEARCH: '0', NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1' };
  const migration = spawnSync(path.join(root, 'node_modules/.bin/prisma'), ['migrate', 'deploy'], { cwd: root, env, encoding: 'utf8' });
  fs.writeFileSync(path.join(output, 'migrations.log'), migration.stdout + migration.stderr);
  assert.equal(migration.status, 0, 'Disposable database migration failed'); checks.push('All migrations apply to an empty PostgreSQL database'); console.log('PASS All migrations apply to an empty PostgreSQL database');
  db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const password = 'OnlyForThisTest123!'; const passwordHash = await bcrypt.hash(password, 4);
  const owner = await db.user.create({ data: { email: 'owner@example.test', name: 'Alex', passwordHash } });
  const member = await db.user.create({ data: { email: 'member@example.test', name: 'Noura', passwordHash } });
  const outsider = await db.user.create({ data: { email: 'outsider@example.test', name: 'Outside', passwordHash } });
  const org = await db.organization.create({ data: { name: 'Riverside neighbors', slug: 'mission-test-riverside', createdBy: owner.id, memberships: { create: [{ userId: owner.id, role: 'admin' }, { userId: member.id, role: 'member' }] } } });
  const logFd = fs.openSync(path.join(work, 'app.log'), 'w');
  app = spawn(path.join(root, 'node_modules/.bin/next'), ['dev', '--webpack', '-p', String(appPort)], { cwd: root, env, stdio: ['ignore', logFd, logFd] });
  const base = `http://127.0.0.1:${appPort}`;
  let ready = false;
  for (let i = 0; i < 120; i++) { if (app.exitCode !== null) throw Error('Test app exited: ' + fs.readFileSync(path.join(work, 'app.log'), 'utf8').slice(-1500)); try { const r = await fetch(base + '/api/auth/me'); if (r.status === 401) { ready = true; break; } } catch {} await delay(1000); }
  assert.ok(ready, 'Test app did not start');
  async function login(email) { const r = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); assert.equal(r.status, 200); return r.headers.get('set-cookie').split(';')[0]; }
  const ownerCookie = await login(owner.email), memberCookie = await login(member.email), outsiderCookie = await login(outsider.email);
  assert.match(ownerCookie, /cosmogov_session=v1\./);
  const api = async (url, { method = 'GET', body, cookie = ownerCookie } = {}) => { const r = await fetch(base + '/api/missions' + url, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); return { status: r.status, data: await r.json() }; };
  let missionId, privateId, sourceId, planId, toolId;
  await check('Unsigned and tampered sessions cannot access mission APIs', async () => {
    assert.equal((await api('', { cookie: '' })).status, 401);
    assert.equal((await api('', { cookie: 'cosmogov_session=' + Buffer.from(owner.id + ':1:forged').toString('base64') })).status, 401);
    const altered = ownerCookie.replace(/.$/, ownerCookie.at(-1) === 'a' ? 'b' : 'a');
    assert.equal((await api('', { cookie: altered })).status, 401);
  });
  await check('Create private and shared missions; reject nonmember organization access', async () => {
    const result = await api('', { method: 'POST', body: { title: 'Let’s make repair the easy choice.', goal: 'Bring neighbors together for a welcoming repair café.', location: 'Riverside', organizationId: org.id } }); assert.equal(result.status, 201); missionId = result.data.id;
    const privateMission = await api('', { method: 'POST', body: { title: 'Private idea', goal: 'Explore a personal starting point.' } }); assert.equal(privateMission.status, 201); privateId = privateMission.data.id;
    assert.equal((await api('', { method: 'POST', cookie: outsiderCookie, body: { title: 'Forbidden', goal: 'Should not be created.', organizationId: org.id } })).status, 403);
    assert.equal((await api('', { method: 'POST', body: { title: '', goal: 'Invalid' } })).status, 400);
  });
  await check('Mission lists and detail enforce community and private visibility', async () => {
    assert.equal((await api('/' + missionId, { cookie: memberCookie })).status, 200);
    assert.equal((await api('/' + missionId, { cookie: outsiderCookie })).status, 404);
    assert.equal((await api('/' + privateId, { cookie: memberCookie })).status, 404);
    assert.deepEqual((await api('', { cookie: memberCookie })).data.map(m => m.id), [missionId]);
    assert.deepEqual((await api('', { cookie: outsiderCookie })).data, []);
  });
  await check('Members add bounded input; unsafe source links are rejected', async () => {
    const source = await api(`/${missionId}/contributions`, { method: 'POST', body: { kind: 'source', title: 'Library visit notes', content: 'The room has six tables. Availability is still unconfirmed.', url: 'https://example.org/venue-notes' } }); assert.equal(source.status, 201); sourceId = source.data.id;
    assert.equal((await api(`/${missionId}/contributions`, { method: 'POST', cookie: memberCookie, body: { kind: 'perspective', title: 'A beginner table', content: 'I can help mend clothes. I would like a welcoming beginner table.' } })).status, 201);
    assert.equal((await api(`/${missionId}/contributions`, { method: 'POST', body: { kind: 'source', title: 'Unsafe', content: 'Unsafe URL', url: 'javascript:alert(1)' } })).status, 400);
    assert.equal((await api(`/${missionId}/contributions`, { method: 'POST', body: { kind: 'perspective', title: 'Too long', content: 'x'.repeat(2001) } })).status, 400);
    assert.equal((await api(`/${missionId}/contributions/${sourceId}`, { method: 'DELETE', cookie: memberCookie })).status, 403);
  });
  await check('AI work is manager-only; real route invokes provider and saves source references', async () => {
    assert.equal((await api(`/${missionId}/runs`, { method: 'POST', cookie: memberCookie, body: { stage: 'research' } })).status, 403);
    const result = await api(`/${missionId}/runs`, { method: 'POST', body: { stage: 'research' } }); assert.equal(result.status, 200);
    const room = (await api('/' + missionId)).data; assert.equal(room.runs[0].status, 'completed'); assert.equal(room.runs[0].sources[0].id, sourceId); assert.equal(room.runs[0].output.findings[0].sourceIds[0], sourceId);
    assert.ok(modelRequests.some(request => request.stage === 'research'));
  });
  await check('Unconfigured web search is explicit and never invents web references', async () => {
    assert.equal((await api(`/${missionId}/runs`, { method: 'POST', body: { stage: 'research', webSearch: true } })).status, 200);
    const run = (await api('/' + missionId)).data.runs[0]; assert.equal(run.searchStatus, 'unavailable'); assert.ok(run.sources.every(source => source.kind !== 'web'));
  });
  await check('Provider failures and fabricated citations fail without fake results', async () => {
    providerMode = 'fail'; assert.equal((await api(`/${missionId}/runs`, { method: 'POST', body: { stage: 'research' } })).status, 503);
    let room = (await api('/' + missionId)).data; assert.equal(room.runs[0].status, 'failed'); assert.equal(room.runs[0].output, null); assert.equal(room.runLeaseUntil, null);
    providerMode = 'bad-citation'; assert.equal((await api(`/${missionId}/runs`, { method: 'POST', body: { stage: 'research' } })).status, 503); providerMode = 'valid';
    room = (await api('/' + missionId)).data; assert.equal(room.runs[0].output, null);
  });
  await check('Run lease prevents overlapping AI work', async () => {
    providerDelay = 1000; const first = api(`/${missionId}/runs`, { method: 'POST', body: { stage: 'perspectives' } }); await delay(300);
    const second = await api(`/${missionId}/runs`, { method: 'POST', body: { stage: 'plan' } }); assert.equal(second.status, 409); assert.equal((await first).status, 200); providerDelay = 0;
  });
  await check('Changed context blocks adoption of an outdated plan', async () => {
    const result = await api(`/${missionId}/runs`, { method: 'POST', body: { stage: 'plan' } }); assert.equal(result.status, 200);
    assert.equal((await api(`/${missionId}/contributions`, { method: 'POST', body: { kind: 'constraint', title: 'Spending needs a separate decision', content: 'Use a proposed ceiling of €600. No spending is approved yet.' } })).status, 201);
    assert.equal((await api(`/${missionId}/runs/${result.data.id}/accept`, { method: 'POST' })).status, 409);
  });
  await check('Plan adoption creates tasks exactly once', async () => {
    const result = await api(`/${missionId}/runs`, { method: 'POST', body: { stage: 'plan' } }); assert.equal(result.status, 200); planId = result.data.id;
    assert.equal((await api(`/${missionId}/runs/${planId}/accept`, { method: 'POST', cookie: memberCookie })).status, 403);
    assert.equal((await api(`/${missionId}/runs/${planId}/accept`, { method: 'POST' })).status, 200);
    assert.equal((await api(`/${missionId}/runs/${planId}/accept`, { method: 'POST' })).status, 409);
    assert.equal((await api('/' + missionId)).data.tasks.length, 2);
  });
  await check('Task claims are atomic and transitions enforce responsibility', async () => {
    const task = (await api('/' + missionId)).data.tasks[0];
    const results = await Promise.all([api(`/${missionId}/tasks/${task.id}`, { method: 'PATCH', body: { action: 'claim' } }), api(`/${missionId}/tasks/${task.id}`, { method: 'PATCH', cookie: memberCookie, body: { action: 'claim' } })]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    const claimed = (await api('/' + missionId)).data.tasks[0]; const claimant = claimed.assignedToId === member.id ? memberCookie : ownerCookie;
    assert.equal((await api(`/${missionId}/tasks/${task.id}`, { method: 'PATCH', cookie: claimant, body: { action: 'complete' } })).status, 200);
    assert.equal((await api(`/${missionId}/tasks/${task.id}`, { method: 'PATCH', body: { action: 'claim' } })).status, 409);
  });
  await check('Generated tools require publication and validate actual member responses', async () => {
    const result = await api(`/${missionId}/runs`, { method: 'POST', body: { stage: 'tool' } }); assert.equal(result.status, 200); toolId = result.data.id;
    const responsePath = `/${missionId}/tools/${toolId}/responses`;
    assert.equal((await api(responsePath, { method: 'POST', cookie: memberCookie, body: { values: { f1: 'Mending' } } })).status, 404);
    assert.equal((await api(`/${missionId}/runs/${toolId}/accept`, { method: 'POST' })).status, 200);
    assert.equal((await api(responsePath, { method: 'POST', cookie: memberCookie, body: { values: { f1: 'Invented choice' } } })).status, 400);
    assert.equal((await api(responsePath, { method: 'POST', cookie: memberCookie, body: { values: { f1: 'Mending', surprise: 'unknown field' } } })).status, 400);
    assert.equal((await api(responsePath, { method: 'POST', cookie: memberCookie, body: { values: { f1: 'Mending', f2: 'A sewing kit' } } })).status, 200);
    assert.equal((await api(responsePath, { method: 'POST', cookie: outsiderCookie, body: { values: { f1: 'Mending' } } })).status, 404);
    assert.equal((await api('/' + missionId)).data.toolResponses.length, 1);
    assert.equal((await api(responsePath, { method: 'DELETE', cookie: memberCookie })).status, 200);
    assert.equal((await api('/' + missionId)).data.toolResponses.length, 0);
  });
  const authoredTool = { title: 'Equipment offers', description: 'Tell us which practical equipment you could share.', fields: [{ id: 'f1', label: 'What can you offer?', kind: 'choice', options: ['Sewing machine', 'Hand tools'], required: true }, { id: 'f2', label: 'Anything else we should know?', kind: 'text', options: [], required: false }] };
  let manualId;
  await check('Managers can author forms without invoking AI; other members cannot', async () => {
    const revision = (await api('/' + missionId)).data.revision;
    const body = { tool: authoredTool, inputRevision: revision };
    const requestsBefore = modelRequests.length;
    assert.equal((await api(`/${missionId}/tools/drafts`, { method: 'POST', body, cookie: '' })).status, 401);
    assert.equal((await api(`/${missionId}/tools/drafts`, { method: 'POST', body, cookie: memberCookie })).status, 403);
    assert.equal((await api(`/${missionId}/tools/drafts`, { method: 'POST', body, cookie: outsiderCookie })).status, 404);
    const result = await api(`/${missionId}/tools/drafts`, { method: 'POST', body }); assert.equal(result.status, 201); manualId = result.data.id;
    const record = await db.missionRun.findUniqueOrThrow({ where: { id: manualId } });
    assert.equal(record.origin, 'manual'); assert.equal(record.acceptedAt, null); assert.equal(record.derivedFromId, null);
    assert.equal(modelRequests.length, requestsBefore);
    assert.equal((await api(`/${missionId}/tools/${manualId}/responses`, { method: 'POST', body: { values: { f1: 'Hand tools' } } })).status, 404);
  });
  await check('Form drafts reject unsupported fields, invalid choices, stale context and foreign source versions', async () => {
    const revision = (await api('/' + missionId)).data.revision;
    for (const tool of [
      { ...authoredTool, fields: [{ ...authoredTool.fields[0], kind: 'html' }] },
      { ...authoredTool, fields: [{ ...authoredTool.fields[0], options: ['Same', 'Same'] }] },
      { ...authoredTool, fields: Array.from({ length: 7 }, (_, i) => ({ ...authoredTool.fields[1], id: 'f' + (i + 1) })) },
      { ...authoredTool, fields: [authoredTool.fields[0], authoredTool.fields[0]] },
    ]) assert.equal((await api(`/${missionId}/tools/drafts`, { method: 'POST', body: { tool, inputRevision: revision } })).status, 400);
    assert.equal((await api(`/${missionId}/tools/drafts`, { method: 'POST', body: { tool: authoredTool, inputRevision: revision + 1 } })).status, 409);
    assert.equal((await api(`/${privateId}/tools/drafts`, { method: 'POST', body: { tool: authoredTool, inputRevision: 0, sourceRunId: toolId } })).status, 404);
    const result = await api(`/${privateId}/tools/drafts`, { method: 'POST', body: { tool: authoredTool, inputRevision: 0 } }); assert.equal(result.status, 201);
    await api(`/${privateId}/contributions`, { method: 'POST', body: { kind: 'perspective', title: 'A new constraint', content: 'The venue requires confirmation.' } });
    assert.equal((await api(`/${privateId}/tools/drafts`, { method: 'POST', body: { tool: authoredTool, inputRevision: 1, sourceRunId: result.data.id } })).status, 409);
  });
  await check('Editing an AI form preserves its published version, references and existing responses', async () => {
    const original = await db.missionRun.findUniqueOrThrow({ where: { id: toolId } });
    await api(`/${missionId}/tools/${toolId}/responses`, { method: 'POST', cookie: memberCookie, body: { values: { f1: 'Mending' } } });
    const edited = { ...original.output.tool, title: 'Revised repair offers', fields: [{ ...original.output.tool.fields[1] }, { ...original.output.tool.fields[0], label: 'Choose an offer', options: ['Fixing', 'Welcoming', 'Equipment'] }] };
    const requestsBefore = modelRequests.length;
    const result = await api(`/${missionId}/tools/drafts`, { method: 'POST', body: { tool: edited, sourceRunId: toolId, inputRevision: original.inputRevision } }); assert.equal(result.status, 201);
    const draft = await db.missionRun.findUniqueOrThrow({ where: { id: result.data.id } });
    assert.equal(draft.origin, 'edited'); assert.equal(draft.derivedFromId, toolId); assert.equal(draft.acceptedAt, null);
    assert.deepEqual(draft.sources, original.sources); assert.deepEqual(draft.output.findings, original.output.findings);
    assert.equal(modelRequests.length, requestsBefore);
    assert.equal((await api(`/${missionId}/runs/${draft.id}/accept`, { method: 'POST' })).status, 200);
    const originalAfter = await db.missionRun.findUniqueOrThrow({ where: { id: toolId } }); assert.deepEqual(originalAfter.output, original.output);
    const response = await db.missionToolResponse.findUniqueOrThrow({ where: { runId_authorId: { runId: toolId, authorId: member.id } } }); assert.equal(response.values.f1, 'Mending');
    assert.equal((await api(`/${missionId}/tools/${draft.id}/responses`, { method: 'POST', cookie: memberCookie, body: { values: { f1: 'Mending' } } })).status, 400);
    assert.equal((await api(`/${missionId}/tools/${draft.id}/responses`, { method: 'POST', cookie: memberCookie, body: { values: { f1: 'Fixing' } } })).status, 200);
  });
  await check('Removed community members lose read and write access', async () => {
    await db.membership.delete({ where: { userId_organizationId: { userId: member.id, organizationId: org.id } } });
    assert.equal((await api('/' + missionId, { cookie: memberCookie })).status, 404);
    assert.equal((await api(`/${missionId}/contributions`, { method: 'POST', cookie: memberCookie, body: { kind: 'perspective', title: 'Former member', content: 'Cannot add this.' } })).status, 404);
    await db.membership.create({ data: { userId: member.id, organizationId: org.id } });
  });
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  const cookieValue = ownerCookie.slice(ownerCookie.indexOf('=') + 1); await context.addCookies([{ name: 'cosmogov_session', value: cookieValue, url: base }]);
  const page = await context.newPage(); page.on('pageerror', e => pageErrors.push(e.message));
  await check('Mission studio renders real persisted data and creates a mission', async () => {
    await page.goto(base + '/dashboard/missions', { waitUntil: 'networkidle', timeout: 120000 });
    await page.getByRole('heading', { name: 'What could we make possible?' }).waitFor(); await page.getByRole('heading', { name: 'Let’s make repair the easy choice.' }).waitFor(); await noOverflow(page); await screenshot(page, 'mission-studio-desktop.png');
    await page.getByRole('button', { name: 'Start a mission', exact: true }).click();
    await page.getByLabel('Give your mission a name').fill('A neighborhood skill swap');
    await page.getByLabel('What do you want to make possible?').fill('Help neighbors exchange practical skills.');
    await page.getByRole('button', { name: 'Open our workspace' }).click();
    await page.waitForURL('**/dashboard/missions/*'); await page.getByRole('heading', { name: 'A neighborhood skill swap', exact: true }).waitFor();
  });
  await check('Workbench references, input, tasks, and generated forms work through real APIs', async () => {
    await page.goto(base + '/dashboard/missions/' + missionId, { waitUntil: 'networkidle', timeout: 120000 });
    await page.getByRole('button', { name: /Studio.*Build a shared tool/ }).click();
    await page.getByRole('heading', { name: 'A tiny tool', exact: false }).count();
    await page.getByRole('button', { name: /Shared tools/ }).click();
    const originalForm = page.locator('.mission-published-tool').filter({ has: page.getByRole('heading', { name: 'Repair café offers', exact: true }) });
    await originalForm.getByLabel('How can you help?').selectOption('Welcoming');
    await originalForm.getByLabel('What could you bring?').fill('A welcome sign and a friendly face.');
    await originalForm.getByRole('button', { name: 'Add my response' }).click();
    await originalForm.getByRole('button', { name: 'Update my response' }).waitFor();
    await page.reload({ waitUntil: 'networkidle' }); await page.getByRole('button', { name: /Shared tools/ }).click();
    assert.equal(await page.getByLabel('How can you help?').inputValue(), 'Welcoming');
    await screenshot(page, 'mission-shared-tool-desktop.png');
    await page.getByRole('button', { name: /Action board/ }).click(); await screenshot(page, 'mission-action-board-desktop.png');
    await page.getByRole('button', { name: /Community input/ }).click(); await page.getByRole('button', { name: 'Add your input' }).click();
    await page.getByLabel('A short title').fill('An accessible welcome'); await page.getByLabel('Tell us a little more').fill('Please keep the welcome area clear for wheelchair users.'); await page.getByRole('button', { name: 'Add to the mission', exact: true }).click();
    await page.getByRole('heading', { name: 'An accessible welcome' }).waitFor();
  });
  await check('People build, preview, save, publish and answer a form through the real UI', async () => {
    await page.getByRole('button', { name: /Shared tools/ }).click();
    await page.getByRole('button', { name: 'Build a form yourself', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Form title', { exact: true }).fill('Our Saturday welcome');
    await dialog.getByLabel('A short invitation', { exact: true }).fill('Help make the first session welcoming.');
    await dialog.getByLabel('Question 1 wording').fill('Which welcome role suits you?');
    await dialog.getByLabel('Answer type for question 1').selectOption('choice');
    await dialog.getByLabel('Options for question 1').fill('Welcome desk\nRoom setup\nTea and coffee');
    await dialog.getByRole('button', { name: 'Add a question', exact: true }).click();
    await dialog.getByLabel('Question 2 wording').fill('What would help you take part?');
    await dialog.getByRole('button', { name: 'Move question 2 up' }).click();
    assert.equal(await dialog.getByLabel('Question 1 wording').inputValue(), 'What would help you take part?');
    await dialog.getByRole('button', { name: 'Move question 1 down' }).click();
    assert.equal(await dialog.getByLabel('Question 1 wording').inputValue(), 'Which welcome role suits you?');
    await dialog.getByRole('heading', { name: 'Our Saturday welcome', exact: true }).waitFor();
    await page.locator('.mission-editor-body').evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: path.join(output, 'form-editor-desktop.png'), fullPage: false, animations: 'disabled' });
    for (const width of [390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await dialog.evaluate(el => el.scrollWidth - el.clientWidth); assert.ok(overflow <= 1, `Editor overflow at ${width}px: ${overflow}`);
      if (width === 390) { await page.locator('.mission-editor-body').evaluate(el => { el.scrollTop = 0; }); await page.screenshot({ path: path.join(output, 'form-editor-mobile.png'), fullPage: false, animations: 'disabled' }); }
    }
    await dialog.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByText('Community-written form', { exact: true }).waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Studio.*Build a shared tool/ }).click();
    await page.getByRole('button', { name: 'Publish this tool', exact: true }).click();
    await page.getByRole('button', { name: 'Publish for this mission', exact: true }).click();
    const form = page.locator('.mission-published-tool').filter({ has: page.getByRole('heading', { name: 'Our Saturday welcome', exact: true }) });
    await form.getByLabel('Which welcome role suits you?').selectOption('Room setup');
    await form.getByRole('button', { name: 'Add my response', exact: true }).click();
    await form.getByRole('button', { name: 'Update my response', exact: true }).waitFor();
    await form.getByRole('button', { name: 'Create revised form', exact: true }).click();
    await dialog.getByLabel('Form title', { exact: true }).fill('Our revised Saturday welcome');
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await dialog.getByRole('button', { name: 'Keep editing', exact: true }).click();
    assert.equal(await dialog.getByLabel('Form title', { exact: true }).inputValue(), 'Our revised Saturday welcome');
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await dialog.getByRole('button', { name: 'Discard changes', exact: true }).click();
  });
  const publicPage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' }); publicPage.on('pageerror', e => pageErrors.push(e.message));
  await check('Public example is labeled and supports plan adoption and a working shared form', async () => {
    await publicPage.goto(base + '/missions/demo', { waitUntil: 'networkidle', timeout: 120000 });
    await publicPage.getByText('Interactive example.', { exact: true }).waitFor();
    await publicPage.getByRole('heading', { name: 'This is how an idea grows.' }).waitFor();
    assert.equal(await publicPage.locator('.mission-sources[open]').count(), 1);
    await publicPage.getByText('Draft · needs review', { exact: true }).waitFor();
    await screenshot(publicPage, 'mission-workbench-desktop.png');
    await publicPage.getByRole('link', { name: 'Read reference 1', exact: true }).first().click(); assert.equal(await publicPage.locator('.mission-sources[open]').count(), 1);
    await publicPage.getByRole('button', { name: /Maker.*A plan you can use/ }).click(); await publicPage.getByRole('button', { name: 'Adopt this plan' }).click(); await publicPage.getByRole('button', { name: 'Add tasks to the board' }).click();
    await publicPage.getByRole('button', { name: 'I can do this' }).first().click(); await publicPage.getByRole('button', { name: 'Mark done' }).click();
    await publicPage.getByText('1 small win, together', { exact: true }).waitFor();
    await screenshot(publicPage, 'mission-progress-desktop.png');
    await publicPage.getByRole('button', { name: /AI workbench/ }).click();
    await publicPage.getByText('Adopted by You', { exact: false }).waitFor();
    assert.equal(await publicPage.getByText('Draft · needs review', { exact: true }).count(), 0);
    await screenshot(publicPage, 'mission-adopted-plan-desktop.png');
    await publicPage.getByRole('button', { name: /AI workbench/ }).click(); await publicPage.getByRole('button', { name: /Studio.*Build a shared tool/ }).click(); await publicPage.getByRole('button', { name: 'Publish this tool' }).click(); await publicPage.getByRole('button', { name: 'Publish for this mission' }).click();
    await publicPage.getByText('Shared with your mission.', { exact: true }).waitFor();
    await publicPage.getByLabel('How would you like to help?').selectOption('Clothes & textiles'); await publicPage.getByRole('button', { name: 'Add my response' }).click(); await publicPage.getByRole('button', { name: 'Update my response' }).waitFor();
  });
  await check('Responsive mission screens at 375, 768, 1024 and 1440 pixels', async () => {
    for (const width of [375, 768, 1024, 1440]) {
      await publicPage.setViewportSize({ width, height: 900 }); await publicPage.goto(base + '/missions/demo', { waitUntil: 'networkidle' }); await noOverflow(publicPage);
      const reading = await publicPage.locator('.mission-findings p').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
      assert.ok(reading >= 14, `Reading text too small at ${width}px: ${reading}`);
      for (const label of [/Community input/, /Action board/, /Shared tools/]) { await publicPage.getByRole('button', { name: label }).click(); await noOverflow(publicPage); }
      if (width === 375) { await publicPage.getByRole('button', { name: /AI workbench/ }).click(); await screenshot(publicPage, 'mission-workbench-mobile.png'); }
      await page.setViewportSize({ width, height: 900 }); await page.goto(base + '/dashboard/missions', { waitUntil: 'networkidle' }); await noOverflow(page);
      await publicPage.goto(base, { waitUntil: 'networkidle' }); await noOverflow(publicPage);
      if (width === 1440) await screenshot(publicPage, 'homepage-desktop.png');
      if (width === 375) await screenshot(publicPage, 'homepage-mobile.png');
    }
  });
  await check('No uncaught browser errors', async () => assert.deepEqual(pageErrors, []));
  await check('Run quota rejects excess paid-provider requests', async () => {
    const count = await db.missionRun.count({ where: { requestedBy: owner.id, origin: 'ai' } });
    if (count < 12) await db.missionRun.createMany({ data: Array.from({ length: 12 - count }, () => ({ missionId, requestedBy: owner.id, stage: 'research', status: 'failed', inputRevision: 0 })) });
    const requestsBefore = modelRequests.length; assert.equal((await api(`/${missionId}/runs`, { method: 'POST', body: { stage: 'research' } })).status, 429); assert.equal(modelRequests.length, requestsBefore);
  });
  await check('Published tools remain accessible beyond the recent AI history', async () => {
    await db.missionRun.createMany({ data: Array.from({ length: 21 }, () => ({ missionId, requestedBy: owner.id, stage: 'research', status: 'failed', inputRevision: 0 })) });
    const mission = await api('/' + missionId);
    assert.equal(mission.status, 200);
    assert.equal(mission.data.runs.find(run => run.id === toolId).reviewerName, 'Alex');
    assert.ok(mission.data.runs.some(run => run.id === toolId && run.acceptedAt));
  });
  await check('Manual draft quota is separate from paid AI runs', async () => {
    const requestsBefore = modelRequests.length;
    const count = await db.missionRun.count({ where: { requestedBy: owner.id, origin: { in: ['manual', 'edited'] } } });
    await db.missionRun.createMany({ data: Array.from({ length: Math.max(0, 60 - count) }, () => ({ missionId, requestedBy: owner.id, stage: 'tool', origin: 'manual', status: 'failed', inputRevision: 0 })) });
    const revision = (await api('/' + missionId)).data.revision;
    assert.equal((await api(`/${missionId}/tools/drafts`, { method: 'POST', body: { tool: authoredTool, inputRevision: revision } })).status, 429);
    assert.equal(modelRequests.length, requestsBefore);
  });
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checks, failures, pageErrors }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, failed: failures.length, artifacts: output }));
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (app) { app.kill('SIGTERM'); await delay(1000); }
  if (db) await db.$disconnect();
  if (modelServer) await new Promise(resolve => modelServer.close(resolve));
  if (postgres) await postgres.stop();
});
