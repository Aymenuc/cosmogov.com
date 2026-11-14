const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), path = require('node:path');
const exportsObject = {};
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/missions/forms.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInNewContext(compiled, { exports: exportsObject, require, URL, Set, Map });
const { csvCell, sensitiveQuestions, formReviewError, answerNotice } = exportsObject;
const tool = label => ({ title: 'Offers', description: 'Tell us what you can offer.', fields: [{ id: 'f1', label, kind: 'text', options: [], required: true }] });
test('Spreadsheet formulas and embedded quotes are safely exported', () => {
  for (const value of ['=SUM(A1)', '+cmd', '-cmd', '@cmd', '\t=cmd', '  =cmd']) assert.ok(csvCell(value).startsWith('"\''));
  assert.equal(csvCell('a "quoted" value'), '"a ""quoted"" value"');
});
test('Sensitive questions require a private audience and a stated review basis', () => {
  const form = tool('Your email address'); assert.ok(sensitiveQuestions(form).length);
  assert.ok(formReviewError(form, { responseVisibility: 'members', sensitiveReason: 'There is an explicitly described need.' }));
  assert.ok(formReviewError(form, { responseVisibility: 'organizers', sensitiveReason: '' }));
  assert.equal(formReviewError(form, { responseVisibility: 'organizers', sensitiveReason: 'There is an explicitly described need.' }), null);
});
test('Phone repair offers are not automatically treated as phone-number collection', () => assert.equal(sensitiveQuestions(tool('Can you repair a phone?')).length, 0));
test('Notices distinguish private and shared answers and actual expiry terms', () => {
  assert.match(answerNotice('organizers', 30).text, /organizers and you/i); assert.match(answerNotice('organizers', 30).text, /30 days/);
  assert.match(answerNotice('members', null).text, /People with access/); assert.match(answerNotice('members', null).text, /until/);
});
