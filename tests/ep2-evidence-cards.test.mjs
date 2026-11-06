import { after, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createServer } from 'vite';

globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
after(() => vite.close());
const { Game } = await vite.ssrLoadModule('/src/engine/game.ts');
const { CASE_EP2 } = await vite.ssrLoadModule('/src/content/ep2/case.ts');
const { CASE_EP1 } = await vite.ssrLoadModule('/src/content/ep1/case.ts');
const { CASE_DAON } = await vite.ssrLoadModule('/src/content/case-daon.ts');
const { layoutPages, coverOf, firstUnread, seenCount, pageOpen } = await vite.ssrLoadModule('/src/engine/evidence-view.ts');
const { PLATES } = await vite.ssrLoadModule('/src/engine/plates.ts');
const { FIGURES } = await vite.ssrLoadModule('/src/engine/figures.ts');
const { MAPS } = await vite.ssrLoadModule('/src/engine/maps.ts');

const EV = CASE_EP2.evidence;
const byId = (id) => EV.find((e) => e.id === id);
const nothing = () => false;
const everything = () => true;
const ep2Source = readdirSync('src/content/ep2').filter((f) => f.endsWith('.ts'))
  .map((f) => readFileSync(`src/content/ep2/${f}`, 'utf8')).join('\n');
// Summaries must read in two or three lines on the card at its normal size (≈30 Korean
// characters a line in both the desktop and the touch layout), never cut or shrunk.
const MAX_SUMMARY = 60;

test('all 20 EP2 records are compact cards with pages', () => {
  assert.equal(EV.length, 20);
  for (const ev of EV) {
    assert.ok(ev.pages?.length, `${ev.id} has pages`);
    assert.ok(ev.summary.length <= MAX_SUMMARY, `${ev.id} summary fits: ${ev.summary.length}`);
    assert.ok(ev.detail, `${ev.id} keeps its original detail`);
  }
});

test('revised EP2 summaries also fit the card', () => {
  for (const m of ep2Source.matchAll(/revise\('(\w+)', '([^']*)'\)/g)) {
    if (!byId(m[1])) continue;
    assert.ok(m[2].length <= MAX_SUMMARY, `revise(${m[1]}) fits: ${m[2].length}`);
  }
});

test('page ids are unique, parts exist, and every part has a page', () => {
  for (const ev of EV) {
    const ids = ev.pages.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length, `${ev.id} unique page ids`);
    for (const p of ev.pages) {
      if (p.tab) assert.ok(ev.tabs?.some((t) => t.id === p.tab), `${ev.id}/${p.id} names a real part`);
      if (p.plate) assert.ok(PLATES[p.plate], `${ev.id}/${p.id} plate ${p.plate}`);
      if (p.figure) assert.ok(FIGURES[p.figure], `${ev.id}/${p.id} figure ${p.figure}`);
      if (p.map) assert.ok(MAPS[p.map], `${ev.id}/${p.id} map ${p.map}`);
      for (const f of p.frames ?? []) if (f.plate) assert.ok(PLATES[f.plate], `${ev.id}/${p.id} frame plate`);
    }
    for (const t of ev.tabs ?? []) assert.ok(ev.pages.some((p) => p.tab === t.id), `${ev.id}#${t.id} has a page`);
    if (ev.cover?.plate) assert.ok(PLATES[ev.cover.plate]);
  }
});

test('every picture on a page exists: no placeholder passed off as a photo', () => {
  const file = (dir, id) => existsSync(`src/assets/ep2/${dir}/${id}.png`) || existsSync(`src/assets/${dir}/${id}.png`);
  for (const ev of EV) {
    for (const p of ev.pages) {
      if (p.image) assert.ok(file('photos', p.image), `${ev.id}/${p.id} photo ${p.image}.png`);
      if (p.cg) assert.ok(file('cg', p.cg), `${ev.id}/${p.id} cg ${p.cg}.png`);
      if (p.kind === 'photo') assert.ok(p.image || p.plate || p.cg || p.figure, `${ev.id}/${p.id} photo page has a picture`);
    }
  }
});

test('locked parts have no page until their flag, and an all-locked record still opens', () => {
  const parts = layoutPages(byId('looseParts'), nothing, []);
  assert.equal(parts.length, 1);
  assert.equal(parts[0].page.id, '_original');
  assert.ok(parts[0].page.caption || parts[0].page.lines?.length);
  const some = layoutPages(byId('looseParts'), (id) => id === 'd2:laundryBag', []);
  assert.deepEqual(some.map((l) => l.page.id), ['laundry']);
  const phone = layoutPages(byId('phoneDump'), nothing, []);
  assert.ok(!phone.some((l) => l.page.tab === 'messenger'), 'messenger reply hidden before it arrives');
  assert.ok(layoutPages(byId('phoneDump'), (id) => id === 't2:messengerIn', []).some((l) => l.page.tab === 'messenger'));
  assert.ok(!layoutPages(byId('groupVideo'), nothing, []).some((l) => l.page.id === 'original'), '4K page waits for the original');
  for (const ev of EV) assert.ok(layoutPages(ev, nothing, []).length >= 1, `${ev.id} never empty`);
});

test('the card picture never comes from a locked page', () => {
  for (const ev of EV) {
    const v = coverOf(ev, nothing);
    if (!v || ev.cover) continue;
    const page = ev.pages.find((p) => p === v);
    assert.ok(page && pageOpen(ev, page, nothing), `${ev.id} cover is from an open page`);
  }
  const fake = { id: 'x', tabs: [{ id: 'late', label: 'late', requires: 'f' }], detail: [], pages: [{ id: 'late', kind: 'photo', title: 'late', tab: 'late', image: 'spoiler' }] };
  assert.equal(coverOf(fake, nothing), undefined);
  assert.equal(coverOf(fake, everything)?.image, 'spoiler');
});

test('every finding the script adds lands on its own page, never lost', () => {
  for (const m of ep2Source.matchAll(/annotate\('(\w+)', '([^']*)'\)/g)) {
    const ev = byId(m[1]);
    assert.ok(ev, `annotate target ${m[1]}`);
    const laid = layoutPages(ev, everything, [m[2]]);
    const home = laid.find((l) => l.adds.includes(0));
    assert.ok(home, `${m[1]} finding placed`);
    assert.notEqual(home.page.id, '_added', `${m[1]} finding "${m[2].slice(0, 20)}" has a page`);
  }
  // An unknown finding is still shown, on a closing page.
  const laid = layoutPages(byId('roofScene'), everything, ['[다른 것] 새 사실']);
  assert.equal(laid.at(-1).page.id, '_added');
});

test('read state: only contiguous findings count, out-of-order reads wait', () => {
  assert.equal(seenCount(0, new Set([1]), 2), 0);
  assert.equal(seenCount(0, new Set([1, 0]), 2), 2);
  assert.equal(seenCount(1, new Set([1]), 3), 2);
  const laid = layoutPages(byId('looseParts'), everything, ['[세탁소] a', '[컨테이너] b']);
  assert.equal(firstUnread(laid, 0), 0);
  assert.equal(firstUnread(laid, 1), 1);
  assert.equal(firstUnread(laid, 2), -1);
});

test('script focus targets (showRecord) name existing pages', () => {
  for (const m of ep2Source.matchAll(/showRecord\('([\w#]+)'\)/g)) {
    const [id, part] = m[1].split('#');
    const ev = byId(id);
    assert.ok(ev, m[1]);
    if (part) assert.ok(ev.pages.some((p) => p.tab === part || p.id === part), `${m[1]} page`);
  }
});

test('presenting a part from the detail is used without asking again', async () => {
  const ctx = {
    record: { get: (id) => byId(id) }, has: () => false,
    ask: { open() { throw new Error('must not ask'); } }, box: { hide() {} },
  };
  const pick = Game.prototype.pickTab;
  assert.equal(await pick.call(ctx, 'phoneDump', ['phoneDump#notice'], 'notice'), 'phoneDump#notice');
  assert.equal(await pick.call(ctx, 'phoneDump', ['phoneDump#fine'], 'texts0610'), 'phoneDump#texts0610');
  // The part doesn't matter for this question: the whole record answers.
  assert.equal(await pick.call(ctx, 'phoneDump', ['phoneDump'], 'notice'), 'phoneDump');
  // A locked part can't be named.
  await assert.rejects(pick.call(ctx, 'phoneDump', ['phoneDump#messenger'], 'messenger'), /must not ask/);
});

test('EP1 and EP4 keep the classic record (no compact pages)', () => {
  for (const ev of [...CASE_EP1.evidence, ...CASE_DAON.evidence]) {
    assert.equal(ev.pages, undefined, ev.id);
    assert.equal(ev.cover, undefined, ev.id);
  }
});

test('scene photos shown behind dialogue resolve to a plate or a CG file', () => {
  for (const m of ep2Source.matchAll(/\bcg\('([\w-]+)'\)/g)) {
    const id = m[1];
    assert.ok(PLATES[id] || existsSync(`src/assets/ep2/cg/${id}.png`) || existsSync(`src/assets/cg/${id}.png`), `cg('${id}')`);
    if (PLATES[id]?.image) assert.ok(existsSync(`src/assets/ep2/photos/${PLATES[id].image}.png`) || existsSync(`src/assets/photos/${PLATES[id].image}.png`), `${id} photo file`);
  }
});

// A small reader for the commands that matter here: flags, revisions, lines and branches.
function play(script, state) {
  for (const c of script) {
    if (c.t === 'flag') state.flags.add(c.name);
    else if (c.t === 'revise') state.rev[c.id] = c.summary;
    else if (c.t === 'say' || c.t === 'think' || c.t === 'note') state.lines.push(c.text);
    else if (c.t === 'if') play(state.flags.has(c.has) ? c.then : (c.else ?? []), state);
  }
  return state;
}
/** The innermost command list holding a command that matches. */
function findScript(root, match) {
  let found = null;
  const walk = (v) => {
    if (found || !v || typeof v !== 'object') return;
    if (Array.isArray(v) && v.some((c) => c && typeof c === 'object' && match(c))) { found = v; return; }
    Object.values(v).forEach(walk);
  };
  walk(root);
  return found;
}
const BOTH_PARTS = '컨테이너 봉투의 클램프·너트 셋·테이프와, 세탁소 점퍼 안감(6/13)의 녹슨 너트 하나·노란 타이.';
const lastRev = (flags, id) => flags.filter((f) => f.startsWith(`rev:${id}|`)).at(-1)?.slice(`rev:${id}|`.length);

test('loose parts: either find order ends on the combined summary', () => {
  const laundry = findScript(CASE_EP2.locations, (c) => c.t === 'annotate' && c.text.startsWith('[세탁소]'));
  const bin = findScript(CASE_EP2.locations, (c) => c.t === 'annotate' && c.text.startsWith('[컨테이너]'));
  assert.ok(laundry && bin);
  for (const [first, second, firstWord] of [[laundry, bin, '세탁소'], [bin, laundry, '컨테이너']]) {
    const s = play(first, { flags: new Set(), rev: {}, lines: [] });
    assert.ok(s.rev.looseParts.includes(firstWord), `after ${firstWord} alone: ${s.rev.looseParts}`);
    play(second, s);
    assert.equal(s.rev.looseParts, BOTH_PARTS);
  }
});

test('checkpoints end on the same summaries normal play does', () => {
  const cp = CASE_EP2.checkpoints;
  for (const id of ['trial2', 'ahnStand2', 'ahnStand3', 'motive', 'epilogue']) {
    assert.equal(lastRev(cp[id].flags, 'looseParts'), BOTH_PARTS, `${id} looseParts`);
  }
  const briefing = findScript(CASE_EP2.scenes.ahnStand3, (c) => c.t === 'revise' && c.id === 'serverReply')
    .find((c) => c.t === 'revise' && c.id === 'serverReply').summary;
  assert.equal(lastRev(cp.motive.flags, 'serverReply'), briefing);
  assert.equal(lastRev(cp.epilogue.flags, 'serverReply'), briefing);
  assert.equal(lastRev(cp.ahnStand3.flags, 'serverReply'), undefined, 'the briefing itself revises it');
});

test('roof floor says each skipped fact once, and the tie is never lost', () => {
  const floor = findScript(CASE_EP2.locations.d1roof, (c) => c.t === 'flag' && c.name === 'd1:roofTab');
  const fresh = play(floor, { flags: new Set(), rev: {}, lines: [] }).lines.join('\n');
  for (const word of ['앵커 볼트', '케이블타이', '방수포', '빨래대']) assert.ok(fresh.includes(word), word);
  const seen = new Set(['seen:d1roof:bolts', 'seen:d1roof:tie', 'seen:d1roof:tarp']);
  const after = play(floor, { flags: seen, rev: {}, lines: [] }).lines.join('\n');
  assert.ok(!after.includes('케이블타이 토막도'), 'no repeat after the tie spot');
  assert.ok(!after.includes('「방수 양생 중」'), 'no repeat after the tarp spot');
  const tieOnly = play(floor, { flags: new Set(['seen:d1roof:bolts', 'seen:d1roof:tarp']), rev: {}, lines: [] }).lines.join('\n');
  assert.ok(tieOnly.includes('케이블타이'), 'tie still told when only that spot was skipped');
});
