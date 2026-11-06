import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createServer } from 'vite';

globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
const { Game } = await vite.ssrLoadModule('/src/engine/game.ts');
const { CASE_EP1 } = await vite.ssrLoadModule('/src/content/ep1/case.ts');
const run = Game.prototype.run;

function harness(resumeLoc, resumeCross) {
  const seen = [];
  return {
    seen, resumeLoc, resumeCross,
    data: { locations: { entrance: { connects: ['room'] }, room: { connects: [] } } },
    async exec(cmd) {
      seen.push(cmd.t === 'say' ? cmd.text : cmd.t === 'bgm' ? `bgm:${cmd.name}` : cmd.t);
      if (cmd.t === 'investigate') this.resumeLoc = null;
      if (cmd.t === 'cross') this.resumeCross = null;
    },
  };
}

test('resuming investigation skips prelude and restores presentation', async () => {
  const game = harness('room', null);
  await run.call(game, [
    { t: 'hud', on: false }, { t: 'say', text: 'old dialogue' }, { t: 'addEvidence', id: 'old' },
    { t: 'bgm', name: 'waitroom' }, { t: 'hud', on: true },
    { t: 'investigate', start: 'entrance', until: [], then: [] }, { t: 'say', text: 'after investigation' },
  ]);
  assert.deepEqual(game.seen, ['hud', 'bgm:waitroom', 'hud', 'investigate', 'after investigation']);
});

test('resuming cross skips dialogue and prediction while retaining scene music', async () => {
  const game = harness(null, { id: 'witness', index: 1, gaugeStart: 50, revealedStart: [] });
  await run.call(game, [
    { t: 'bgm', name: 'trial' }, { t: 'predict', value: 90, reason: 'old' }, { t: 'say', text: 'old dialogue' },
    { t: 'cross', id: 'witness' }, { t: 'say', text: 'after cross' },
  ]);
  assert.deepEqual(game.seen, ['bgm:trial', 'cross', 'after cross']);
});

await vite.close();

test('ordinary scene execution retains its prelude', async () => {
  const game = harness(null, null);
  await run.call(game, [{ t: 'say', text: 'opening' }, { t: 'cross', id: 'witness' }]);
  assert.deepEqual(game.seen, ['opening', 'cross']);
});

test('obsolete resume marker falls back to scene start', async () => {
  const game = harness('missing', null);
  await run.call(game, [{ t: 'say', text: 'opening' }, { t: 'investigate', start: 'entrance', until: [], then: [] }]);
  assert.deepEqual(game.seen, ['opening', 'investigate']);
  assert.equal(game.resumeLoc, null);
});

test('real EP1 testimony resume does not replay its introduction', async () => {
  const game = harness(null, { id: 'heard', index: 1, gaugeStart: 50, revealedStart: [] });
  game.data = CASE_EP1;
  await run.call(game, CASE_EP1.scenes.cross2);
  assert.deepEqual(game.seen, ['bgm:oh', 'cross']);
});
