import { after, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createServer } from 'vite';
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
after(() => vite.close());
const { CASE_EP2 } = await vite.ssrLoadModule('/src/content/ep2/case.ts');
const R = await vite.ssrLoadModule('/src/content/ep2/recaps.ts');
const text = (v) => JSON.stringify(v);

// EP2-S1 §S3: after the clip the stake is the seven households (7/12), never her verdict.
test('the 7/12 auction planted on day 1 is paid off after the clip, at the record and in the epilogue', () => {
  const s = CASE_EP2.scenes;
  assert.match(text(s.clip), /7월 12일/);
  assert.match(text(s.sixLinks), /노은결 \(방청석\)/);
  assert.match(text(s.minus040), /조서 사본/);
  assert.match(text(s.epilogue), /경매 유예 신청/);
});

test('scenes skipped by the round-5 and round-6 checkpoints still carry the stake', () => {
  assert.match(R.RECAP_ARRIVED.pending, /조서/);
  assert.match(R.RECAP_MOTIVE.pending, /7\/12/);
  assert.match(text(CASE_EP2.scenes.motive), /즉결공판 마지막 날/);
});

test('the verdict still rests on the evidence alone: the clip keeps the judge saying motive is not needed', () => {
  assert.match(text(CASE_EP2.scenes.clip), /설령 증인의 속내를 다 밝히지 못해도/);
});

test('X8 no longer re-explains the 5/24 practice from scratch', () => {
  const x8 = text(CASE_EP2.testimonies.x8.contradiction);
  assert.ok(!x8.includes('보름도 더 전인'));
  assert.ok(x8.includes('t2:m2'));
});
