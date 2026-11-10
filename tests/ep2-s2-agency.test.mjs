import { after, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createServer } from 'vite';
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
after(() => vite.close());
const { CASE_EP2 } = await vite.ssrLoadModule('/src/content/ep2/case.ts');
const scenes = CASE_EP2.scenes;
const owned = (id) => CASE_EP2.evidence.some((e) => e.id === id.split('#')[0]);

// EP2-S1 §S2: the decisive steps are the player's.
test('clip: the player calls up the clip before the evidence is handed over', () => {
  const s = scenes.clip;
  const p = s.findIndex((c) => c.t === 'present');
  const give = s.findIndex((c) => c.t === 'addEvidence' && c.id === 'serverReply');
  const tape = s.findIndex((c) => c.t === 'tape' && c.title);
  assert.ok(p >= 0 && give > p && tape > give, 'present → addEvidence → tape, all in the clip scene');
  assert.deepEqual([].concat(s[p].answer), ['phoneDump#fine']);
  assert.ok(!s[p].opts?.free, 'a real deduction spends a chance');
  for (const k of ['phoneScreen', 'call119', 'hallCctv', 'phoneDump#messenger', 'phoneDump#notice']) {
    assert.ok(s[p].nearMiss?.[k], `near miss for ${k}`);
    assert.ok(owned(k));
  }
});

test('afternoon1: the defense asks for the app server records by presenting the phone screen', () => {
  const s = scenes.afternoon1;
  const p = s.find((c) => c.t === 'present');
  assert.ok(p);
  assert.deepEqual([].concat(p.answer), ['phoneScreen']);
  assert.ok(p.opts?.free);
  assert.ok(!s.some((c) => c.t === 'say' && c.text.includes('세 가지 요청 모두에 동의')));
});

test('sixLinks: the prosecutor objects to link five and only the safety answer settles it', () => {
  const ask = scenes.sixLinks.find((c) => c.t === 'ask');
  assert.equal(ask.title, '다섯째 고리');
  const right = ask.options.filter((o) => o.correct);
  assert.equal(right.length, 1);
  assert.match(right[0].label, /고정을 푼 난간/);
  assert.ok(ask.opts?.free);
});

test('X7 practice evidence no longer concedes the 1% point itself', () => {
  const text = JSON.stringify(CASE_EP2.testimonies.x7.contradiction);
  assert.ok(!text.includes('운 좋게 1퍼센트'));
});
