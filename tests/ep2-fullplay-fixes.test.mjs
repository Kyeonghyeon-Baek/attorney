import { after, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

// Regressions found in the 2화 full playthrough (2026-11-07). These check data and branching;
// they are not a playthrough.
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
after(() => vite.close());
const { Game } = await vite.ssrLoadModule('/src/engine/game.ts');
const { CASE_EP2 } = await vite.ssrLoadModule('/src/content/ep2/case.ts');
const { PLATES } = await vite.ssrLoadModule('/src/engine/plates.ts');
const { investigate } = await vite.ssrLoadModule('/src/content/script.ts');

const S = CASE_EP2.scenes;
const T = CASE_EP2.testimonies;
const src = (f) => readFileSync(`src/content/ep2/${f}.ts`, 'utf8');
const texts = (v, out = []) => {
  if (Array.isArray(v)) v.forEach((x) => texts(x, out));
  else if (v && typeof v === 'object') {
    if (typeof v.text === 'string') out.push(v.text);
    Object.values(v).forEach((x) => texts(x, out));
  }
  return out;
};
const statement = (tm, id) => T[tm].statements.find((s) => s.id === id);

test('no forced court-record window in the 2화 trial scripts', () => {
  for (const f of ['trial2', 'finale']) assert.ok(!/showRecord\(/.test(src(f)), `${f}.ts still calls showRecord`);
});

test('the messenger reply is read aloud when it arrives', () => {
  const said = texts(S.trial2).join('\n');
  for (const part of ['안태수', '최봉구', '41분 50초', '46분 41초', '발신자 측']) assert.ok(said.includes(part), part);
});

test('X7: related evidence on 3, 3a and 4 is acknowledged, not a plain wrong answer', () => {
  const x73 = statement('x7', 'x7-3');
  assert.ok(x73.nearMiss?.railReport, 'x7-3 railReport');
  assert.ok(x73.nearMiss?.phoneDump, 'x7-3 phoneDump');
  const x73a = statement('x7', 'x7-3a');
  assert.ok(x73a.accept?.includes('railReport') || x73a.nearMiss?.railReport, 'x7-3a railReport');
  assert.ok(x73a.nearMiss?.phoneDump, 'x7-3a phoneDump');
  const x74 = statement('x7', 'x7-4');
  assert.ok(x74.nearMiss?.phoneDump, 'x7-4 phoneDump');
  assert.ok(x74.nearMiss?.inspection, 'x7-4 inspection');
});

test('X8: presenting first never answers an excuse the witness has not made yet', () => {
  const said = texts(T.x8.contradiction).join('\n');
  for (const word of ['혼사', '심부름']) assert.ok(!said.includes(word), word);
});

test('trial2 describes the pictures as drawn', () => {
  const s = src('trial2');
  assert.ok(!s.includes('초록색 표지판'));
  assert.ok(!s.includes('붉은 시선'));
});

test('jumping to the call cross starts from the round-4 checkpoint', () => {
  const ids = Object.keys(S);
  assert.ok(ids.indexOf('ahnCall') > ids.indexOf('ahnStand2'), 'ahnCall listed after ahnStand2');
  const cp = Game.prototype.checkpointBefore.call({ data: CASE_EP2 }, 'ahnCall');
  assert.equal(cp, CASE_EP2.checkpoints.ahnStand2);
  assert.ok(cp.flags.includes('t2:messengerIn'));
});

test('clip frame questions show the frames themselves', () => {
  const asks = [];
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      if (v.t === 'ask' && /^프레임 고르기/.test(v.title ?? '')) asks.push(v);
      Object.values(v).forEach(walk);
    }
  };
  walk(S.clip);
  assert.equal(asks.length, 2);
  const seen = new Set();
  for (const a of asks) {
    for (const o of a.options) {
      assert.ok(o.plate && PLATES[o.plate], `${a.title} ${o.label} has a frame`);
      assert.equal(o.plate, `clip${parseInt(o.label, 10)}`, `${o.label} shows its own frame`);
      seen.add(o.plate);
    }
    assert.deepEqual(a.gallery, ['clip31', 'clip33', 'clip35', 'clip37', 'clip38'], 'all five frames to compare');
  }
  assert.deepEqual([...seen].sort(), ['clip31', 'clip33', 'clip35', 'clip37', 'clip38']);
  const guide = texts(S.clip).filter((t) => t.includes('프레임'));
  assert.ok(!texts(S.clip).some((t) => /법원기록.*프레임|프레임.*법원기록/.test(t)), 'no "open the record" instruction');
  assert.ok(guide.length);
});

test('a place with nowhere to go yet says so instead of an empty move list', async () => {
  const lines = [];
  let lists = 0;
  const actions = ['move', 'finish'];
  const data = { locations: {
    here: { name: '여기', bg: 'room', connects: ['there'], hotspots: [] },
    there: { name: '저기', bg: 'room', connects: [], hotspots: [], requires: 'locked' },
  } };
  const game = {
    data, flags: new Set(['done']), resumeLoc: null,
    stage: { classList: { add() {}, remove() {} } },
    scene: { setField() {}, showPlace() {}, clear() {}, showEvidence() {} },
    box: { hide() {} }, music() {}, autosave() {},
    has(id) { return this.flags.has(id); },
    hasFresh() { return false; },
    inv: { setLocation() {}, hide() {}, async menu() { return actions.shift(); }, async list() { lists++; return null; } },
    run: Game.prototype.run, runInvestigate: Game.prototype.runInvestigate,
    async exec(cmd) {
      if (cmd.t === 'say' || cmd.t === 'think') { lines.push(cmd.text); return; }
      return Game.prototype.exec.call(this, cmd);
    },
  };
  await game.runInvestigate(investigate('here', ['done'], [], '조사를 마친다'));
  assert.equal(lists, 0, 'no empty destination list');
  assert.ok(lines.some((l) => l.includes('이곳에서') && l.includes('남았')), lines.join(' / '));
});
