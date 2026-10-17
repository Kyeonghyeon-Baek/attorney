import { AskPanel } from './ask';
import { allImageUrls, bgImage } from './assets';
import { initAudio, isMuted, playAmbience, playBgm, setMuted, sfx } from './audio';
import { el, josa, replay, sleep } from './dom';
import { Effects } from './effects';
import { Gauge } from './gauge';
import { bindKeyboard, emit, waitFor } from './input';
import { InvestigateUi } from './invest';
import { CourtRecord } from './record';
import { clearSave, loadSave, writeSave, type CrossResume, type SaveData } from './save';
import { Stage } from './stage';
import { TextBox, type LineOptions } from './textbox';
import type { BgmName, Cmd, Evidence, Location, Profile, Script, Statement, Testimony } from './types';
import { CHARACTERS } from '../content/characters';

const STOP = Symbol('stop');
type Result = void | typeof STOP;

export interface CaseData {
  /** Save-slot key. Change it when a rewrite makes old saves meaningless. */
  id: string;
  caseNo: string;
  caseName: string;
  episode: string;
  /** Scene the game opens on. Starting anywhere else hands over every piece of evidence. */
  start: string;
  evidence: Evidence[];
  /** Evidence held when the game opens on `start`. */
  startEvidence: string[];
  profiles: Profile[];
  testimonies: Record<string, Testimony>;
  locations: Record<string, Location>;
  scenes: Record<string, Script>;
  /** How each scene is named on the 이어하기 button. */
  sceneLabels: Record<string, string>;
  /** Headline on the card shown when the playable part ends. */
  endingTitle: string;
  gaugeStart: number;
  wrongPenalty: number;
  /** Fallback reactions, used when a testimony or statement has none of its own. */
  defaultPress: Script;
  defaultWrong: Script;
  presentWrong: Script;
  loopBack: Script;
  gameOver: Script;
  /** Reaction when evidence is shown to someone during investigation and nothing specific fits. */
  fieldPresentDefault: Script;
}

export class Game {
  private stage: HTMLElement;
  private scene: Stage;
  private box: TextBox;
  private fx: Effects;
  private gauge: Gauge;
  private record: CourtRecord;
  private ask: AskPanel;
  private cross: CrossUi;
  private inv: InvestigateUi;
  private muteBtn: HTMLButtonElement;
  private revealed = new Set<string>();
  private flags = new Set<string>();
  private next: string | null = null;
  private bgm: BgmName | null = null;
  private wrongs = 0;
  private startedAt = 0;
  private sceneName = '';
  /** Off when a ?scene= jump starts the game, so test runs never overwrite a real save. */
  private saving = false;
  private resumeLoc: string | null = null;
  private resumeCross: CrossResume | null = null;
  private lastSaveLabel = '';
  private saveFlash: HTMLElement;

  constructor(root: HTMLElement, private data: CaseData, private fast: boolean) {
    const viewport = el('div', 'viewport', root);
    this.stage = el('div', 'stage', viewport);
    this.scene = new Stage(this.stage);
    this.box = new TextBox(this.stage, fast);
    this.cross = new CrossUi(this.stage);
    this.inv = new InvestigateUi(this.stage);

    const hud = el('div', 'hud', this.stage);
    this.gauge = new Gauge(hud, data.gaugeStart, fast);
    const tools = el('div', 'hud-tools', hud);
    const recordBtn = el('button', 'btn btn-small', tools, '법원기록  R');
    recordBtn.addEventListener('click', () => emit('record'));
    this.muteBtn = el('button', 'btn btn-small', tools);
    this.muteBtn.addEventListener('click', () => this.toggleMute());
    this.paintMute();
    this.saveFlash = el('div', 'save-flash', hud, '자동 저장됨');

    this.ask = new AskPanel(this.stage);
    this.record = new CourtRecord(this.stage, data.evidence, data.profiles, data.caseNo, data.caseName);
    this.fx = new Effects(this.stage, fast);

    this.scene.root.addEventListener('click', () => emit('advance'));
    this.box.root.addEventListener('click', () => emit('advance'));
    bindKeyboard(() => this.toggleMute());

    // Warm the cache while the title screen is up, so sprites and photos appear instantly.
    for (const url of allImageUrls()) new Image().src = url;

    const fit = () => {
      const s = Math.min(innerWidth / 1280, innerHeight / 720);
      this.stage.style.setProperty('--scale', String(s));
    };
    fit();
    addEventListener('resize', fit);
  }

  /** Shows the title screen, then plays. `jump` is a ?scene= shortcut that skips the save slot. */
  async start(jump: string | null): Promise<void> {
    this.box.hide();
    this.stage.classList.add('title-mode');
    const save = jump ? null : loadSave(this.data.id);
    const buttons = save
      ? [
        { label: '이어하기', primary: true },
        { label: '처음부터 하기', confirm: '저장된 진행이 지워져요. 한 번 더 누르면 처음부터' },
      ]
      : [{ label: '법정에 들어가기', primary: true }];
    const choice = await this.fx.card((body) => {
      const logo = el('h1', 'logo', body);
      el('span', 'logo-flip', logo, '판');
      el('span', '', logo, ' 뒤집기');
      el('div', 'saekdong', body);
      el('p', 'logo-sub', body, this.data.episode);
      const keys = el('dl', 'keys', body);
      for (const [k, v] of [
        ['클릭 · Enter', '다음 대사'], ['Q', '흔들기'], ['E', '증거 제시'],
        ['← →', '증언 이동'], ['R', '법원기록'], ['M', '소리 켜기·끄기'],
      ]) {
        el('dt', '', keys, k);
        el('dd', '', keys, v);
      }
      if (save) {
        const slot = el('div', 'save-slot', body);
        el('div', 'save-slot-label', slot, save.label);
        el('div', 'save-slot-meta', slot, `${formatTime(save.savedAt)} 저장 · 플레이 ${formatDuration(save.elapsed)}`);
      }
    }, buttons, 'title');
    this.stage.classList.remove('title-mode');
    initAudio();

    let scene: string;
    if (save && choice === 0) {
      scene = save.scene;
      this.restore(save);
    } else {
      scene = jump ?? this.data.start;
      if (scene === this.data.start) this.data.startEvidence.forEach((id) => this.record.add(id));
      else this.record.ownAll();
      this.data.profiles.filter((p) => !p.later).forEach((p) => this.record.add(p.id));
      this.startedAt = performance.now();
    }
    this.saving = !jump;

    let cur: string | null = scene;
    while (cur) {
      this.next = null;
      this.sceneName = cur;
      // A resumed investigation or cross-examination saves its own, finer checkpoint.
      if (!this.resumeLoc && !this.resumeCross) this.autosave(this.data.sceneLabels[cur] ?? cur);
      await this.run(this.data.scenes[cur]);
      cur = this.next;
    }
  }

  private restore(save: SaveData): void {
    save.flags.forEach((f) => this.flags.add(f));
    save.evidence.forEach((id) => this.record.add(id));
    this.data.profiles.filter((p) => !p.later).forEach((p) => this.record.add(p.id));
    this.revealed = new Set(save.revealed);
    this.gauge.set(save.gauge);
    this.wrongs = save.wrongs;
    this.startedAt = performance.now() - save.elapsed;
    this.resumeLoc = save.loc ?? null;
    this.resumeCross = save.cross ?? null;
    this.lastSaveLabel = save.label;
  }

  private autosave(label: string, at: { loc?: string; cross?: CrossResume } = {}): void {
    if (!this.saving) return;
    writeSave({
      caseId: this.data.id,
      label,
      scene: this.sceneName,
      ...at,
      flags: [...this.flags],
      evidence: this.record.ownedIds,
      revealed: [...this.revealed],
      gauge: this.gauge.value,
      wrongs: this.wrongs,
      elapsed: performance.now() - this.startedAt,
    });
    if (label !== this.lastSaveLabel) replay(this.saveFlash, 'on');
    this.lastSaveLabel = label;
  }

  // ------------------------------------------------------------ script runner

  private async run(script: Script): Promise<Result> {
    for (const cmd of script) {
      if ((await this.exec(cmd)) === STOP) return STOP;
    }
  }

  private async exec(cmd: Cmd): Promise<Result> {
    switch (cmd.t) {
      case 'say': {
        const ch = CHARACTERS[cmd.who];
        this.scene.show(cmd.who, cmd.emo);
        // Stings for the big reactions, a desk slam when 강단비 points.
        if (cmd.emo === 'shock' || cmd.emo === 'panic') sfx('shock');
        else if (cmd.who === 'dan' && cmd.emo === 'point') sfx('slam');
        await this.line({
          name: cmd.name ?? ch.name, who: cmd.who, text: cmd.text,
          style: cmd.who === 'operator' ? 'human' : 'normal', voice: ch.voice,
        });
        await this.waitAdvance();
        return;
      }
      case 'think':
        await this.line({ name: CHARACTERS.dan.name, who: 'dan', text: cmd.text, style: 'think', voice: 'mid' });
        await this.waitAdvance();
        return;
      case 'show':
        this.scene.show(cmd.who, cmd.emo);
        return;
      case 'shout':
        this.box.hide();
        this.scene.show(cmd.who, cmd.who === 'dan' && cmd.kind !== 'holdit' ? 'point' : undefined);
        await this.fx.shout(cmd.kind);
        return;
      case 'fx':
        if (cmd.kind === 'flash') this.fx.flash();
        else this.fx.shake(cmd.kind === 'bigshake');
        return;
      case 'sfx':
        sfx(cmd.name);
        return;
      case 'bgm':
        this.music(cmd.name);
        return;
      case 'ambience':
        playAmbience(cmd.name);
        return;
      case 'wait':
        await sleep(this.fast ? 0 : cmd.ms);
        return;
      case 'place':
        this.box.hide();
        await this.fx.place(cmd.lines);
        return;
      case 'gauge':
        await this.gauge.add(cmd.delta);
        return;
      case 'gaugeSet':
        await this.gauge.add(cmd.value - this.gauge.value);
        return;
      case 'evidence':
        this.scene.showEvidence(this.record.item(cmd.id));
        return;
      case 'cross':
        return this.runCross(this.data.testimonies[cmd.id]);
      case 'present':
        return this.runPresent(cmd);
      case 'ask':
        return this.runAsk(cmd);
      case 'reveal':
        cmd.statements.forEach((id) => this.revealed.add(id));
        return;
      case 'daon':
        this.scene.setDaonMode(cmd.mode);
        return;
      case 'addEvidence':
        return this.addEvidence(cmd.id);
      case 'addProfile':
        return this.addProfile(cmd.id);
      case 'field':
        this.box.hide();
        this.scene.setField(cmd.bg);
        this.scene.clear();
        if (cmd.bg) this.scene.showPlace();
        this.stage.classList.toggle('offstage', !!cmd.bg);
        return;
      case 'flag':
        this.flags.add(cmd.name);
        return;
      case 'if':
        return this.run(this.has(cmd.has) ? cmd.then : cmd.else ?? []);
      case 'investigate':
        return this.runInvestigate(cmd);
      case 'goto':
        this.next = cmd.scene;
        return STOP;
      case 'end':
        await this.ending();
        this.next = null;
        return STOP;
    }
  }

  private music(name: BgmName | null): void {
    this.bgm = name;
    playBgm(name);
  }

  private has(id: string): boolean {
    return this.flags.has(id) || this.record.has(id);
  }

  private async addEvidence(id: string): Promise<void> {
    const ev = this.record.get(id);
    if (!ev || this.record.has(id)) return;
    this.record.add(id);
    this.scene.showEvidence(this.record.item(id));
    sfx('evidence');
    await this.line({ name: null, text: `「${ev.name}」${josa(ev.name, '을', '를')} 법원기록에 넣었다.`, style: 'notice', voice: null });
    await this.waitAdvance();
    this.scene.showEvidence(null);
  }

  private async addProfile(id: string): Promise<void> {
    const p = this.record.getProfile(id);
    if (!p || this.record.has(id)) return;
    this.record.add(id);
    this.scene.showEvidence(this.record.item(id));
    sfx('evidence');
    await this.line({ name: null, text: `「${p.name}」의 프로필을 법원기록에 넣었다.`, style: 'notice', voice: null });
    await this.waitAdvance();
    this.scene.showEvidence(null);
  }

  private async line(o: LineOptions): Promise<void> {
    const onMonitor = o.who === 'daon' || o.who === 'operator';
    this.scene.setTalking(true);
    await this.box.say({ ...o, onBlip: onMonitor ? () => this.scene.pulseDaon() : undefined });
    this.scene.setTalking(false);
  }

  private async waitAdvance(): Promise<void> {
    this.box.showArrow(true);
    for (;;) {
      const a = await waitFor(['advance', 'right', 'record']);
      if (a !== 'record') break;
      await this.record.open('view');
    }
    this.box.showArrow(false);
  }

  // ------------------------------------------------------------ cross-examination

  private visible(tm: Testimony): Statement[] {
    const out: Statement[] = [];
    for (const s of tm.statements) {
      if (s.hidden) {
        if (!s.replaces && this.revealed.has(s.id)) out.push(s);
        continue;
      }
      const rep = tm.statements.find((r) => r.replaces === s.id && this.revealed.has(r.id));
      out.push(rep ?? s);
    }
    return out;
  }

  private async sayStatement(st: Statement, instant = false): Promise<void> {
    const ch = CHARACTERS[st.who];
    this.scene.show(st.who, st.emo);
    await this.line({ name: ch.name, who: st.who, text: st.text, style: 'testimony', voice: ch.voice, instant });
  }

  private async runCross(tm: Testimony): Promise<Result> {
    // Resuming from a save skips the first hearing of the testimony.
    const resume = this.resumeCross?.id === tm.id ? this.resumeCross : null;
    this.resumeCross = null;
    const crossTrack = this.bgm ?? 'cross';
    this.box.hide();
    if (!resume) {
      this.music(tm.hearing ?? 'testimony');
      await this.fx.banner('증언 개시', tm.title);
      const first = this.visible(tm);
      for (let k = 0; k < first.length; k++) {
        this.cross.show('증언', tm.title, k, first.length, false);
        await this.sayStatement(first[k]);
        await this.waitAdvance();
      }
      this.cross.hide();
      if (tm.beforeCross && (await this.run(tm.beforeCross)) === STOP) return STOP;
      this.box.hide();
    }
    this.music(crossTrack);
    await this.fx.banner(resume ? '반대신문 재개' : '반대신문 개시', tm.title);

    const gaugeAtStart = resume?.gaugeStart ?? this.gauge.value;
    const revealedAtStart = new Set(resume?.revealedStart ?? this.revealed);
    let i = resume?.index ?? 0;
    let instant = false;
    for (;;) {
      const list = this.visible(tm);
      if (i >= list.length) i = 0;
      const st = list[i];
      this.autosave(`반대신문: ${tm.title}`, {
        cross: { id: tm.id, index: i, gaugeStart: gaugeAtStart, revealedStart: [...revealedAtStart] },
      });
      this.cross.show('반대신문', tm.title, i, list.length, true);
      await this.sayStatement(st, instant);
      instant = false;
      const a = await waitFor(['advance', 'right', 'left', 'press', 'present', 'record']);
      this.cross.hide();

      if (a === 'advance' || a === 'right') {
        if (i < list.length - 1) i++;
        else {
          if ((await this.run(this.data.loopBack)) === STOP) return STOP;
          i = 0;
        }
        continue;
      }
      if (a === 'left') {
        i = Math.max(0, i - 1);
        continue;
      }
      if (a === 'press') {
        await this.exec({ t: 'shout', who: 'dan', kind: 'holdit' });
        const before = new Set(this.revealed);
        if ((await this.run(st.press ?? this.data.defaultPress)) === STOP) return STOP;
        const after = this.visible(tm);
        const rep = after.findIndex((s) => s.replaces === st.id && !before.has(s.id));
        if (rep >= 0) i = rep;
        else {
          i = after.indexOf(st) + 1;
          if (i >= after.length) {
            if ((await this.run(this.data.loopBack)) === STOP) return STOP;
            i = 0;
          }
        }
        continue;
      }

      // present / record: open the case file and pick evidence
      const id = await this.record.open('present');
      if (!id) {
        instant = true;
        continue;
      }
      await this.exec({ t: 'shout', who: 'dan', kind: 'objection' });
      this.scene.showEvidence(this.record.item(id));
      if (st.accept?.includes(id)) return this.run(tm.contradiction);
      const hint = st.nearMiss?.[id];
      if (hint) {
        const r = await this.run(hint);
        this.scene.showEvidence(null);
        if (r === STOP) return STOP;
        continue;
      }
      const r = await this.run(tm.wrong ?? this.data.defaultWrong);
      this.scene.showEvidence(null);
      if (r === STOP) return STOP;
      if (await this.penalty()) {
        await this.gameOver();
        this.gauge.set(gaugeAtStart);
        this.revealed = new Set(revealedAtStart);
        i = 0;
      }
    }
  }

  private async runPresent(cmd: Extract<Cmd, { t: 'present' }>): Promise<Result> {
    const start = this.gauge.value;
    for (;;) {
      this.box.hide();
      const id = await this.record.open('present', cmd.prompt, false);
      await this.exec({ t: 'shout', who: 'dan', kind: 'takethat' });
      this.scene.showEvidence(this.record.item(id));
      if (id === cmd.answer) return this.run(cmd.then);
      const r = await this.run(cmd.wrong ?? this.data.presentWrong);
      this.scene.showEvidence(null);
      if (r === STOP) return STOP;
      if (await this.penalty()) {
        await this.gameOver();
        this.gauge.set(start);
      }
    }
  }

  private async runAsk(cmd: Extract<Cmd, { t: 'ask' }>): Promise<Result> {
    const used = new Set<number>();
    const hasCorrect = cmd.options.some((o) => o.correct);
    for (;;) {
      this.scene.show(cmd.who);
      this.box.hide();
      const idx = await this.ask.open(cmd.note, cmd.options.map((o) => o.label), used);
      used.add(idx);
      const opt = cmd.options[idx];
      if ((await this.run(opt.then)) === STOP) return STOP;
      if (opt.correct || !hasCorrect) return;
    }
  }

  // ------------------------------------------------------------ investigation

  private async runInvestigate(cmd: Extract<Cmd, { t: 'investigate' }>): Promise<Result> {
    let here = this.resumeLoc ?? cmd.start;
    this.resumeLoc = null;
    this.stage.classList.add('investigating');
    const goalsMet = () => cmd.until.every((id) => this.has(id));
    try {
      for (;;) {
        const loc = this.data.locations[here];
        this.scene.setField(loc.bg);
        this.inv.setLocation(loc.name);
        if (loc.bgm) this.music(loc.bgm);
        playAmbience(loc.ambience ?? null);
        if (!this.flags.has(`visited:${here}`)) {
          this.flags.add(`visited:${here}`);
          this.scene.showPlace(loc.person);
          if (loc.enter && (await this.run(loc.enter)) === STOP) return STOP;
        }
        if (goalsMet()) {
          this.box.hide();
          this.scene.showPlace(loc.person);
          return await this.run(cmd.then);
        }

        this.box.hide();
        this.scene.showPlace(loc.person);
        this.autosave(`조사: ${loc.name}`, { loc: here });
        const action = await this.inv.menu(!!loc.person);
        let r: Result = undefined;
        if (action === 'record') {
          await this.record.open('view');
        } else if (action === 'examine') {
          // Stay in examine mode until the player backs out (or the day's goals are met).
          for (;;) {
            const spot = await this.inv.examine(loc.hotspots, (s) => this.flags.has(`seen:${here}:${s.id}`));
            if (!spot) break;
            const key = `seen:${here}:${spot.id}`;
            const again = this.flags.has(key) && spot.again;
            this.flags.add(key);
            r = await this.run(again ? spot.again! : spot.script);
            if (r === STOP || goalsMet()) break;
            this.box.hide();
            this.scene.showPlace(loc.person);
            this.autosave(`조사: ${loc.name}`, { loc: here });
          }
        } else if (action === 'move') {
          const dest = await this.inv.list('어디로 갈까?', loc.connects.map((id) => ({
            id, label: this.data.locations[id].name, thumb: bgImage(this.data.locations[id].bg),
          })));
          if (dest) {
            sfx('step');
            const arrive = this.data.locations[dest].arrive;
            if (arrive) setTimeout(() => sfx(arrive), 700);
            here = dest;
          }
        } else if (action === 'talk' && loc.talks) {
          // Same for talking: the topic list comes back after each conversation.
          for (;;) {
            const topics = loc.talks.filter((t) => !t.requires || this.has(t.requires));
            const pick = await this.inv.list(`${CHARACTERS[loc.person!].name}에게 무엇을 물어볼까?`, topics.map((t) => ({
              id: t.id, label: t.label, done: this.flags.has(`talked:${here}:${t.id}`),
            })));
            const topic = topics.find((t) => t.id === pick);
            if (!topic) break;
            this.flags.add(`talked:${here}:${topic.id}`);
            r = await this.run(topic.script);
            if (r === STOP || goalsMet()) break;
            this.box.hide();
            this.scene.showPlace(loc.person);
            this.autosave(`조사: ${loc.name}`, { loc: here });
          }
        } else if (action === 'present' && loc.person) {
          const id = await this.record.open('present', `${CHARACTERS[loc.person].name}에게 무엇을 보여줄까?`);
          if (id) {
            await this.exec({ t: 'shout', who: 'dan', kind: 'takethat' });
            this.scene.showPlace(loc.person);
            this.scene.showEvidence(this.record.item(id));
            r = await this.run(loc.presents?.[id] ?? loc.presentDefault ?? this.data.fieldPresentDefault);
            this.scene.showEvidence(null);
          }
        }
        if (r === STOP) return STOP;
      }
    } finally {
      playAmbience(null);
      this.inv.hide();
      this.box.hide();
      this.scene.setField(null);
      this.scene.clear();
      this.stage.classList.remove('investigating');
    }
  }

  private penalty(): Promise<boolean> {
    this.wrongs++;
    return this.gauge.add(this.data.wrongPenalty);
  }

  private async gameOver(): Promise<void> {
    const resume = this.bgm;
    playBgm(null);
    await this.run(this.data.gameOver);
    this.box.hide();
    await this.fx.verdict('유죄');
    await this.fx.card((body) => {
      el('h2', 'card-title', body, 'AI 판결 예측이 100%에 도달했어요');
      el('p', '', body, '증거를 잘못 제시할 때마다 유죄 확률이 올라가요. 이번 반대신문을 처음부터 다시 할 수 있어요.');
    }, '반대신문 다시 하기', 'gameover');
    this.bgm = resume;
    playBgm(resume);
  }

  private async ending(): Promise<void> {
    this.box.hide();
    playAmbience(null);
    if (this.saving) clearSave(this.data.id);
    const secs = Math.round((performance.now() - this.startedAt) / 1000);
    await this.fx.card((body) => {
      el('p', 'card-kicker', body, this.data.episode);
      el('h2', 'card-title', body, this.data.endingTitle);
      const stats = el('dl', 'stats', body);
      for (const [k, v] of [
        ['플레이 시간', `${Math.floor(secs / 60)}분 ${secs % 60}초`],
        ['잘못 제시한 증거', `${this.wrongs}번`],
        ['최종 유죄 예측률', `${this.gauge.value.toFixed(1)}%`],
      ]) {
        el('dt', '', stats, k);
        el('dd', '', stats, v);
      }
    }, '처음부터 다시 하기', 'ending');
    location.href = location.pathname;
  }

  private toggleMute(): void {
    setMuted(!isMuted());
    this.paintMute();
  }

  private paintMute(): void {
    this.muteBtn.textContent = isMuted() ? '소리 꺼짐  M' : '소리 켜짐  M';
    this.muteBtn.classList.toggle('muted', isMuted());
  }
}

/** Testimony header, statement pips, and the press / present controls. */
class CrossUi {
  private head: HTMLElement;
  private kind: HTMLElement;
  private title: HTMLElement;
  private pips: HTMLElement;
  private controls: HTMLElement;

  constructor(stage: HTMLElement) {
    this.head = el('div', 'cross-head', stage);
    this.kind = el('div', 'cross-kind', this.head);
    this.title = el('div', 'cross-title', this.head);
    this.pips = el('div', 'pips', this.head);
    this.controls = el('div', 'cross-controls', stage);
    const prev = el('button', 'arrow arrow-prev', this.controls, '◀');
    const next = el('button', 'arrow arrow-next', this.controls, '▶');
    const press = el('button', 'btn btn-press', this.controls, '흔들기  Q');
    const present = el('button', 'btn btn-present', this.controls, '증거 제시  E');
    prev.setAttribute('aria-label', '이전 증언');
    next.setAttribute('aria-label', '다음 증언');
    prev.addEventListener('click', () => emit('left'));
    next.addEventListener('click', () => emit('right'));
    press.addEventListener('click', () => emit('press'));
    present.addEventListener('click', () => emit('present'));
    this.hide();
  }

  show(kind: string, title: string, i: number, n: number, interactive: boolean): void {
    this.head.hidden = false;
    this.head.dataset.kind = kind;
    this.kind.textContent = kind;
    this.title.textContent = title;
    this.pips.replaceChildren();
    for (let k = 0; k < n; k++) el('i', k === i ? 'on' : '', this.pips);
    this.controls.hidden = !interactive;
  }

  hide(): void {
    this.head.hidden = true;
    this.controls.hidden = true;
  }
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000);
  return m < 1 ? '1분 미만' : `${m}분`;
}
