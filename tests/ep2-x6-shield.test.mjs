import { after, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createServer } from 'vite';
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
after(() => vite.close());
const { Game } = await vite.ssrLoadModule('/src/engine/game.ts');
const { CASE_EP2 } = await vite.ssrLoadModule('/src/content/ep2/case.ts');
const tm = CASE_EP2.testimonies.x6;

// X6 (EP2-S1 §S1): the app-as-voice statement opens only after both rail explanations break.
function harness() {
  return {
    data: CASE_EP2, flags: new Set(), revealed: new Set(), next: null, presented: '', lines: [],
    scene: { showEvidence() {} },
    has(id) { return id.startsWith('presented:') ? [this.presented, this.presented.split('#')[0]].includes(id.slice(10)) : this.flags.has(id); },
    run: Game.prototype.run, visible: Game.prototype.visible,
    async exec(cmd) {
      if (['if', 'flag', 'reveal', 'goto'].includes(cmd.t)) return Game.prototype.exec.call(this, cmd);
      if (cmd.t === 'say') this.lines.push(cmd.text);
    },
    ids() { return this.visible(tm).map(s => s.id); },
    async submit(statement, evidence) {
      const st = this.visible(tm).find(s => s.id === statement);
      assert.ok(st, `visible statement ${statement}`);
      assert.ok(st.accept?.includes(evidence), `${statement} accepts ${evidence}`);
      this.presented = evidence;
      await this.run(tm.contradiction);
    },
  };
}

test('X6 starts with four statements; the app-as-voice one is hidden', () => {
  const g = harness();
  assert.deepEqual(g.ids(), ['x6-1', 'x6-2', 'x6-3', 'x6-4']);
});

for (const order of [['railReport', 'inspection'], ['inspection', 'railReport']]) {
  test(`X6 ${order.join(' → ')}: the shield opens after the second break, then the notice ends the cross`, async () => {
    const g = harness();
    const at = { railReport: 'x6-1', inspection: 'x6-2' };
    await g.submit(at[order[0]], order[0]);
    assert.ok(!g.ids().includes('x6-5'), 'still hidden after one break');
    await g.submit(at[order[1]], order[1]);
    assert.ok(g.ids().includes('x6-5'), 'opens after both');
    assert.ok(g.lines.some(l => l.includes('안내한 건 앱이에요')), 'shield line plays');
    assert.equal(g.next, null);
    await g.submit('x6-5', 'phoneDump#notice');
    assert.equal(g.next, 'ahnCall');
  });
}

test('X6 old save holding both rail flags opens the shield on loop-back', async () => {
  const g = harness();
  g.flags = new Set(['t2:x6a', 't2:x6b']);
  g.revealed = new Set(['x6-1a', 'x6-2a']);
  assert.ok(!g.ids().includes('x6-5'));
  await g.run(tm.loop[0]);
  assert.ok(g.ids().includes('x6-5'));
});

test('X6 old save that already broke the notice skips the shield and moves on', async () => {
  const g = harness();
  g.flags = new Set(['t2:x6c', 't2:x6a']);
  g.revealed = new Set(['x6-1a']);
  await g.submit('x6-2', 'inspection');
  assert.ok(!g.lines.some(l => l.includes('안내한 건 앱이에요')));
  assert.equal(g.next, 'ahnCall');
});

test('X6 notice on the remote-support statement is a near miss, not a wrong answer', () => {
  const st = tm.statements.find(s => s.id === 'x6-4');
  assert.ok(st.nearMiss?.['phoneDump#notice']);
});
