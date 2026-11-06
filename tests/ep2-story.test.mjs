import { after, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createServer } from 'vite';
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
after(() => vite.close());
const { Game } = await vite.ssrLoadModule('/src/engine/game.ts');
const { CASE_EP2 } = await vite.ssrLoadModule('/src/content/ep2/case.ts');
const tm = CASE_EP2.testimonies.x7;
function harness() {
  return {
    data: CASE_EP2, flags: new Set(), revealed: new Set(), next: null, presented: '', lines: [],
    scene: { showEvidence() {} },
    has(id) { return id.startsWith('presented:') ? [this.presented, this.presented.split('#')[0]].includes(id.slice(10)) : this.flags.has(id); },
    run: Game.prototype.run, visible: Game.prototype.visible,
    async exec(cmd) {
      if (['if', 'flag', 'reveal', 'goto'].includes(cmd.t)) return Game.prototype.exec.call(this, cmd);
      if (cmd.t === 'say') this.lines.push(cmd.text);
      if (cmd.t === 'examine') this.flags.add('t2:signPicked');
    },
    async submit(statement, evidence) {
      const st = this.visible(tm).find(s => s.id === statement);
      assert.ok(st, `visible statement ${statement}`);
      assert.ok(st.accept?.includes(evidence), `${statement} accepts ${evidence}`);
      this.presented = evidence;
      await this.run(tm.contradiction);
    },
  };
}
for (const first of ['photo', 'ladder']) test(`X7 ${first} first: no retracted admission and all links reachable`, async () => {
  const g = harness();
  if (first === 'photo') {
    await g.submit('x7-1', 'appraisal#namsan');
    assert.ok(!g.visible(tm).some(s => s.id === 'x7-1a'), 'basket confession requires the work log');
    await g.submit('x7-5', 'ladderLog');
  } else {
    await g.submit('x7-1', 'ladderLog');
    await g.submit('x7-1b', 'appraisal#namsan');
  }
  assert.ok(g.visible(tm).some(s => s.id === 'x7-1a'));
  assert.ok(!g.visible(tm).some(s => s.id === 'x7-5'), 'no ladder denial after admission');
  // A saved cross-examination restores flags/revealed; continue using only that state.
  const resumed = harness();
  resumed.flags = new Set(g.flags); resumed.revealed = new Set(g.revealed);
  await resumed.submit('x7-2', 'serverReply#practice');
  await resumed.submit('x7-3', 'groupVideo');
  await resumed.submit('x7-4', 'railReport');
  assert.equal(resumed.next, 'sixLinks');
});
test('X7 early practice evidence is retained when the photo location is established', async () => {
  const g = harness();
  await g.submit('x7-2', 'serverReply#practice');
  await g.submit('x7-1', 'ladderLog');
  await g.submit('x7-1b', 'appraisal#namsan');
  assert.ok(g.flags.has('t2:x7b'), 'valid earlier evidence needs no resubmission');
  await g.submit('x7-3', 'groupVideo');
  await g.submit('x7-4', 'railReport');
  assert.equal(g.next, 'sixLinks');
});

test('X7 legacy save after photo confession can still establish the work log', async () => {
  const g = harness();
  g.flags = new Set(['t2:x7a']);
  g.revealed = new Set(['x7-1a', 'x7-5']);
  await g.submit('x7-1a', 'ladderLog');
  await g.submit('x7-2', 'serverReply#practice');
  await g.submit('x7-3', 'groupVideo');
  await g.submit('x7-4', 'railReport');
  assert.equal(g.next, 'sixLinks');
});

function permutations(items) {
  if (!items.length) return [[]];
  return items.flatMap((x, i) => permutations(items.filter((_, j) => i !== j)).map(rest => [x, ...rest]));
}
test('X7 all 120 valid evidence orders reach the next scene without resubmission', async () => {
  for (const order of permutations(['appraisal#namsan', 'ladderLog', 'serverReply#practice', 'groupVideo', 'railReport'])) {
    const g = harness();
    for (const evidence of order) {
      const st = g.visible(tm).find(s => s.accept?.includes(evidence));
      assert.ok(st, `${order.join(' → ')}: ${evidence} must remain available`);
      await g.submit(st.id, evidence);
    }
    assert.equal(g.next, 'sixLinks', order.join(' → '));
  }
});
