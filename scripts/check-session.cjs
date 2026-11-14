// Exercise the actual signing implementation without Next.js or a database.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/lib/session-token.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function load(env = {}) {
  const exports = {};
  vm.runInNewContext(source, { exports, require, Buffer, process: { env } });
  return exports;
}
const { signSession, verifySession, SESSION_LIFETIME_MS } = load();
const secret = 'a-strong-test-secret-with-more-than-32-characters';
const now = 1800000000000;
test('signed sessions identify their user and expire at the boundary', () => {
  const token = signSession('member-1', secret, now);
  assert.equal(verifySession(token, secret, now), 'member-1');
  assert.equal(verifySession(token, secret, now + SESSION_LIFETIME_MS - 1), 'member-1');
  assert.equal(verifySession(token, secret, now + SESSION_LIFETIME_MS), null);
});
test('rejects wrong keys, changed payloads and future-issued sessions', () => {
  const token = signSession('member-1', secret, now);
  assert.equal(verifySession(token, 'another-secret', now), null);
  const parts = token.split('.');
  parts[1] = Buffer.from(JSON.stringify({ sub: 'admin' })).toString('base64url');
  assert.equal(verifySession(parts.join('.'), secret, now), null);
  assert.equal(verifySession(signSession('member-1', secret, now + 60001), secret, now), null);
});
test('rejects unsigned, oversized and malformed sessions', () => {
  for (const token of ['', 'v1.a.b', 'v1.a.b.extra', Buffer.from('user:123:nonce').toString('base64'), 'a'.repeat(2001)]) assert.equal(verifySession(token, secret, now), null);
});
test('production requires a configured secret and development fallback is stable', () => {
  assert.throws(() => load({ NODE_ENV: 'production' }).sessionSecret(), /SESSION_SECRET/);
  assert.throws(() => load({ SESSION_SECRET: 'short' }).sessionSecret(), /SESSION_SECRET/);
  assert.equal(load({ NODE_ENV: 'production', SESSION_SECRET: secret }).sessionSecret(), secret);
  const local = load({ NODE_ENV: 'development' });
  assert.equal(local.sessionSecret(), local.sessionSecret());
});
