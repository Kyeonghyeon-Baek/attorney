import { after, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createServer } from 'vite';

globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
after(() => vite.close());
const { Game } = await vite.ssrLoadModule('/src/engine/game.ts');
const { CASE_EP2 } = await vite.ssrLoadModule('/src/content/ep2/case.ts');
const { investigate } = await vite.ssrLoadModule('/src/content/script.ts');
const { emit } = await vite.ssrLoadModule('/src/engine/input.ts');

// Keep the real command runner and investigation loop; replace only UI/audio/save boundaries.
function harness(data, flags = []) {
  const lines = [], saves = [], menus = [];
  const game = {
    data, flags: new Set(flags), lines, saves, menus, resumeLoc: null, resumeCross: null,
    stage: { classList: { add() {}, remove() {} } },
    scene: { setField() {}, showPlace() {}, clear() {}, showEvidence() {} },
    box: { hide() {} }, music() {},
    has(id) { return this.flags.has(id); },
    autosave(label, at) { saves.push({ label, ...at, flags: [...this.flags] }); },
    inv: { setLocation() {}, hide() {}, async menu(canTalk, finishLabel) {
      menus.push({ canTalk, finishLabel });
      assert.ok(menus.length < 12, 'investigation must eventually finish');
      return 'finish';
    } },
    run: Game.prototype.run,
    runInvestigate: Game.prototype.runInvestigate,
    async exec(cmd) {
      if (cmd.t === 'say') { lines.push(cmd.text); return; }
      return Game.prototype.exec.call(this, cmd);
    },
  };
  return game;
}

const fixture = { locations: {
  room: { name: '조사실', bg: 'room', person: 'eom', connects: [], hotspots: [], talks: [
    { id: 'required', label: '필수', script: [{ t: 'flag', name: 'clue' }] },
    { id: 'optional', label: '선택', script: [{ t: 'say', text: '남은 이야기' }] },
  ] },
} };
const ending = [{ t: 'say', text: '다음 장면' }];

test('last clue unlocks finish and leaves optional conversations available', async () => {
  const game = harness(fixture);
  const actions = ['talk', 'talk', 'finish'];
  game.inv.menu = async (canTalk, finishLabel) => {
    game.menus.push({ canTalk, finishLabel });
    assert.ok(actions.length, 'no unexpected extra menu');
    return actions.shift();
  };
  const topics = ['required', 'optional', null];
  game.inv.list = async () => topics.shift();
  await game.runInvestigate(investigate('room', ['clue'], ending, '조사를 마친다'));
  assert.deepEqual(game.lines, ['남은 이야기', '다음 장면']);
  assert.deepEqual(game.menus.map(m => m.finishLabel), [undefined, '조사를 마친다', '조사를 마친다']);
  assert.ok(game.saves.some(s => s.flags.includes('clue') && s.loc === 'room'));
});

test('completed investigation resumes at its menu until the player finishes', async () => {
  const game = harness(fixture, ['clue', 'visited:room']);
  game.resumeLoc = 'room';
  await game.runInvestigate(investigate('room', ['clue'], ending, '조사를 마친다'));
  assert.equal(game.menus.length, 1);
  assert.equal(game.menus[0].finishLabel, '조사를 마친다');
  assert.equal(game.saves[0].loc, 'room');
  assert.deepEqual(game.lines, ['다음 장면']);
});

test('episodes without a finish label retain automatic completion', async () => {
  const game = harness(fixture, ['clue']);
  await game.runInvestigate(investigate('room', ['clue'], ending));
  assert.equal(game.menus.length, 0);
  assert.deepEqual(game.lines, ['다음 장면']);
});

test('resuming day two after the phone call enters only the prosecutor phase, even back in the village', async () => {
  for (const loc of ['d2prosecutor', 'd2laundry']) {
    const game = harness(CASE_EP2, ['d2:call15', 'd2:prosecutorDone']);
    game.resumeLoc = loc;
    const stages = [];
    game.exec = async function(cmd) {
      if (cmd.t === 'investigate') {
        stages.push({ start: cmd.start, at: this.resumeLoc });
        this.resumeLoc = null;
      } else if (cmd.t === 'if') {
        return Game.prototype.exec.call(this, cmd);
      } else if (cmd.t === 'say') this.lines.push(cmd.text);
    };
    await game.run(CASE_EP2.scenes.day2);
    assert.deepEqual(stages, [{ start: 'd2prosecutor', at: loc }]);
    assert.deepEqual(game.lines, []);
  }
});

test('conditions after the resumed interaction use newly changed flags', async () => {
  const game = harness(fixture, ['afternoon', 'clue']);
  game.resumeLoc = 'room';
  await game.run([{ t: 'if', has: 'afternoon', then: [
    investigate('room', ['clue'], [{ t: 'flag', name: 'finished' }], '조사를 마친다'),
    { t: 'if', has: 'finished', then: [{ t: 'say', text: '완료 후 대화' }], else: [{ t: 'say', text: '아직 조사 중' }] },
  ] }]);
  assert.deepEqual(game.lines, ['완료 후 대화']);
});

for (const [testimony, statement, evidence] of [
  ['x1', 'x1-3', 'postmortem'], ['x1', 'x1-5', 'postmortem'],
  ['x2', 'x2-3', 'firstStatement'], ['x2', 'x2-4', 'firstStatement'],
  ['x2b', 'x2b-2', 'firstStatement'], ['x2b', 'x2b-3', 'firstStatement'],
]) {
  test(`${statement}: related ${evidence} explains the missing link without spending a chance`, async () => {
    const tm = CASE_EP2.testimonies[testimony];
    const game = harness(CASE_EP2);
    const stopped = new Error('presentation handled');
    let shown = 0, penalties = 0;
    Object.assign(game, {
      resumeCross: { id: tm.id, index: tm.statements.findIndex(s => s.id === statement), gaugeStart: 80, revealedStart: [] },
      gauge: { value: 80 }, revealed: new Set(), pressed: new Set(), chances: 3,
      fx: { async banner() {} }, cross: { show() {}, hide() {} },
      record: { async open() { return evidence; }, item() { return {}; } },
      visible: Game.prototype.visible,
      async pickTab(raw) { return raw; }, tabMiss() { return undefined; },
      async penalty() { penalties++; return false; },
      async sayStatement() {
        if (shown++) throw stopped;
        setTimeout(() => emit('present'), 0);
      },
      async exec(cmd) {
        if (cmd.t === 'say' || cmd.t === 'think') { this.lines.push(cmd.text); return; }
        if (cmd.t === 'shout') return;
        if (cmd.t === 'memo') { this.flags.add(`memo:${cmd.text}`); return; }
        return Game.prototype.exec.call(this, cmd);
      },
    });
    await assert.rejects(Game.prototype.runCross.call(game, tm), e => e === stopped);
    assert.equal(penalties, 0);
    assert.ok(game.lines.length >= 2, 'give a concrete explanation');
    assert.ok(!game.lines.includes(CASE_EP2.defaultWrong[0].text), 'must not use generic rejection');
    assert.ok([...game.flags].some(f => f.startsWith('memo:')), 'retain the useful inference');
  });
}

test('court asks about code #7 for the first time when the optional investigation conversation was skipped', async () => {
  for (const talked of [false, true]) {
    const game = harness(CASE_EP2, talked ? ['talked:d1realty:log'] : []);
    game.revealed = new Set();
    game.exec = async function(cmd) {
      if (cmd.t === 'say' || cmd.t === 'think') { this.lines.push(cmd.text); return; }
      if (cmd.t === 'memo') { this.flags.add(`memo:${cmd.text}`); return; }
      if (cmd.t === 'cross') return;
      return Game.prototype.exec.call(this, cmd);
    };
    await game.run(CASE_EP2.testimonies.x4.contradiction);
    assert.equal(game.lines.some(line => line.includes('어제 중개사무소')), talked);
    assert.equal(game.lines.some(line => line.includes('어디에 내주신')), !talked);
    assert.ok(game.lines.some(line => line.includes('물탱크 청소')));
    assert.ok(game.flags.has('t1:code7'));
    assert.ok(game.revealed.has('x4-5b'));
  }
});
