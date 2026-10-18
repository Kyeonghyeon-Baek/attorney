import { AskPanel } from './ask';
import { Backlog } from './backlog';
import { HintPanel } from './hints';
import { MatchView } from './match';
import { PhotoView } from './photos';
import { allImageUrls, bgImage } from './assets';
import { initAudio, isMuted, playAmbience, playBgm, setMuted, sfx } from './audio';
import { Cinema } from './cinema';
import { el, flash, josa, replay, sleep } from './dom';
import { Effects } from './effects';
import { Gauge } from './gauge';
import { bindKeyboard, emit, waitFor } from './input';
import { InvestigateUi } from './invest';
import { MapView } from './maps';
import { chooseEpisode, SettingsPanel, type EpisodeEntry } from './menu';
import { CourtRecord } from './record';
import { clearSave, hasSave, isCleared, loadSave, markCleared, writeSave, type CrossResume, type SaveData } from './save';
import { Stage } from './stage';
import { TextBox, type LineOptions } from './textbox';
import type { BgmName, Cmd, Evidence, Location, Profile, Script, Statement, StepOpts, Testimony } from './types';
import { CHARACTERS } from '../content/characters';

const STOP = Symbol('stop');
/** Lines of history kept in the save. */
const LOG_KEEP = 120;
type Result = void | typeof STOP;

/** Where scene select and ?scene= jumps start, and what the player holds by then. */
export interface Checkpoint {
  label: string;
  /** Evidence and later profiles held at that point. */
  evidence: string[];
  /** Flags already set (memos, `ann:` addenda, facts). */
  flags?: string[];
  gauge: number;
  status?: string;
}

export interface CaseData {
  /** Save-slot key. Change it when a rewrite makes old saves meaningless. */
  id: string;
  /** Episode number, also the ?ep= shortcut. */
  ep: number;
  /** How the case is listed in 사건 기록부. `thumb` is an image URL. */
  menu: { no: string; title: string; tagline: string; thumb?: string };
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
  /** Extra lines on the ending card, e.g. what comes next. */
  endingNote?: string;
  gaugeStart: number;
  wrongPenalty: number;
  /** Music for every cross-examination in the case (otherwise whatever the scene was playing). */
  crossBgm?: BgmName;
  /** Stop the music the moment a correct objection lands; the script starts the next track. */
  cutMusicOnObjection?: boolean;
  /** Script revision (1화: 'EP1-R3'). A save from another revision is never resumed. */
  revision?: string;
  /** Earlier save ids of this case, so the list can say the episode was revised. */
  legacyIds?: string[];
  /**
   * Review chances (1화). A wrong answer spends one instead of raising the prediction; with none
   * left, a window offers to carry on or restart the cross-examination. No guilty game over.
   */
  chances?: number;
  /** Badge under the prediction at the start (with `predict`). */
  gaugeStatus?: string;
  /** 'manual': hints only on request, in a window. Otherwise testimony hints play on loop-back. */
  hintMode?: 'manual';
  /** Checkpoints by scene id, for scene select after clearing and for ?scene= jumps. */
  checkpoints?: Record<string, Checkpoint>;
  /** Fallback reactions, used when a testimony or statement has none of its own. */
  defaultPress: Script;
  defaultWrong: Script;
  presentWrong: Script;
  loopBack: Script;
  gameOver: Script;
  /** Reaction when evidence is shown to someone during investigation and nothing specific fits. */
  fieldPresentDefault: Script;
}

/** An episode on the list that cannot be played yet. */
export interface LockedEpisode {
  locked: true;
  no: string;
  title: string;
  tagline: string;
}

export type EpisodeSlot = CaseData | LockedEpisode;

export class Game {
  private data!: CaseData;
  private record!: CourtRecord;
  private stage: HTMLElement;
  private scene: Stage;
  private box: TextBox;
  private fx: Effects;
  private gauge: Gauge;
  private ask: AskPanel;
  private cinema: Cinema;
  private settingsPanel = new SettingsPanel();
  private backlog = new Backlog();
  /** Next hint per testimony id. */
  private hintAt = new Map<string, number>();
  /** Statements the player has pressed, so the header can mark them. */
  private pressed = new Set<string>();
  private cross: CrossUi;
  private inv: InvestigateUi;
  private muteBtn: HTMLButtonElement;
  private revealed = new Set<string>();
  private flags = new Set<string>();
  /** What the player last presented, so scripts can answer that choice (see `ifPresented`). */
  private presented: string | null = null;
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
  private lastSave: Omit<SaveData, 'v' | 'savedAt'> | null = null;
  private lastSaveOk = true;
  private saveFlash: HTMLElement;
  private memoFlash: HTMLElement;
  private memoBurst = 0;
  private issueUi!: HTMLElement;
  private toast: HTMLElement;
  private chances = 0;
  private chanceUi: HTMLElement;
  private hintPanel = new HintPanel();
  /** Hints for whatever question is open right now (manual hint mode). */
  private hintCtx: { key: string; title: string; lines: string[] } | null = null;
  /** The cross-examination in progress, for "현재 심문 처음부터". */
  private inCross: string | null = null;

  constructor(root: HTMLElement, private slots: EpisodeSlot[], private fast: boolean) {
    const viewport = el('div', 'viewport', root);
    this.stage = el('div', 'stage', viewport);
    this.scene = new Stage(this.stage);
    this.cinema = new Cinema(this.stage, fast);
    this.box = new TextBox(this.stage, fast);
    this.cross = new CrossUi(this.stage);
    this.inv = new InvestigateUi(this.stage);

    const hud = el('div', 'hud', this.stage);
    this.gauge = new Gauge(hud, 0, fast);
    this.chanceUi = el('div', 'chances', hud);
    this.issueUi = el('div', 'issue', hud);
    this.issueUi.hidden = true;
    this.chanceUi.hidden = true;
    const tools = el('div', 'hud-tools', hud);
    // Hidden while a card screen is up (game over, ending): the record cannot open there.
    const recordBtn = el('button', 'btn btn-small hud-record', tools, '법원기록  R');
    recordBtn.addEventListener('click', () => emit('record'));
    const logBtn = el('button', 'btn btn-small', tools, '대사 기록  L');
    logBtn.addEventListener('click', () => void this.openBacklog());
    const setBtn = el('button', 'btn btn-small', tools, '설정  O');
    setBtn.addEventListener('click', () => void this.openSettings());
    this.muteBtn = el('button', 'btn btn-small', tools);
    this.muteBtn.addEventListener('click', () => this.toggleMute());
    this.paintMute();
    this.saveFlash = el('div', 'save-flash', hud, '자동 저장됨');
    this.saveFlash.hidden = true;
    // In the HUD column, so it always sits under the prediction, the chances and the buttons.
    this.memoFlash = el('div', 'memo-flash', hud);
    this.memoFlash.hidden = true;
    this.toast = el('div', 'toast', this.stage);
    this.toast.hidden = true;

    this.ask = new AskPanel(this.stage);
    this.fx = new Effects(this.stage, fast);

    this.scene.root.addEventListener('click', () => emit('advance'));
    this.box.root.addEventListener('click', () => emit('advance'));
    bindKeyboard({
      mute: () => this.toggleMute(),
      settings: () => void this.openSettings(),
      backlog: () => void this.openBacklog(),
      hint: () => this.openHint(),
    });

    const judgeBg = bgImage('judge');
    if (judgeBg) this.stage.style.setProperty('--title-bg', `url("${judgeBg}")`);
    // Warm the cache while the title screen is up, so sprites and photos appear instantly.
    for (const url of allImageUrls()) new Image().src = url;

    const fit = () => {
      const s = Math.min(innerWidth / 1280, innerHeight / 720);
      this.stage.style.setProperty('--scale', String(s));
    };
    fit();
    addEventListener('resize', fit);
  }

  private cases(): CaseData[] {
    return this.slots.filter((x): x is CaseData => !('locked' in x));
  }

  /**
   * Title screen, then 사건 기록부, then plays the chosen case.
   * `ep` (from ?ep=) skips the list; `jump` (from ?scene=) also skips the save slot.
   */
  async start(opts: { ep: number | null; jump: string | null }): Promise<void> {
    this.box.hide();
    this.stage.classList.add('title-mode');
    let data: CaseData | null = this.cases().find((c) => c.ep === opts.ep) ?? null;
    const jump = data && opts.jump && data.scenes[opts.jump] ? opts.jump : null;
    let save: SaveData | null = null;
    // A scene picked from scene select (after clearing): starts there, with saving on.
    let picked: string | null = null;
    await this.titleCard(!!data);
    if (!jump) {
      for (;;) {
        if (!data) {
          const id = await chooseEpisode(this.stage, this.entries());
          if (!id) {
            await this.titleCard(false);
            continue;
          }
          data = this.cases().find((c) => c.id === id)!;
        }
        save = loadSave(data.id, data.revision);
        if (!save) {
          const d = data;
          // An older version's progress: say so, and leave that data alone.
          if (!isCleared(d.id) && (d.legacyIds?.some((id) => hasSave(id)) || hasSave(d.id))) {
            const c = await this.fx.card((body) => {
              el('p', 'card-kicker', body, d.menu.no);
              el('h2', 'card-title', body, d.menu.title);
              el('p', '', body, `${d.menu.no} 내용이 개정되었습니다. 이전 진행은 새 구성과 맞지 않아 이어할 수 없어요.`);
              el('p', '', body, '새 구성으로 처음부터 시작할 수 있어요. 이전 저장은 지우지 않아요.');
            }, [{ label: '새 구성으로 시작', primary: true }, { label: '사건 기록부로' }], 'title');
            if (c === 1) {
              data = null;
              continue;
            }
          }
          if (isCleared(d.id) && d.checkpoints) {
            const c = await this.fx.card((body) => {
              el('p', 'card-kicker', body, d.menu.no);
              el('h2', 'card-title', body, d.menu.title);
              el('p', '', body, '해결한 사건이에요. 처음부터 다시 하거나, 원하는 장면부터 볼 수 있어요.');
            }, [{ label: '처음부터 하기', primary: true }, { label: '장면 선택' }, { label: '사건 기록부로' }], 'title');
            if (c === 2) {
              data = null;
              continue;
            }
            if (c === 1) {
              const ids = Object.keys(d.checkpoints);
              const k = await this.fx.card((body) => {
                el('h2', 'card-title', body, '장면 선택');
                el('p', '', body, '그 장면까지 모았을 증거와 사실을 가진 채로 시작해요.');
              }, [...ids.map((id) => ({ label: d.checkpoints![id].label })), { label: '돌아가기' }], 'title scene-select');
              if (k >= ids.length) continue;
              picked = ids[k];
            }
          }
          break;
        }
        const s = save;
        const choice = await this.fx.card((body) => {
          el('p', 'card-kicker', body, data!.menu.no);
          el('h2', 'card-title', body, data!.menu.title);
          const slot = el('div', 'save-slot', body);
          el('div', 'save-slot-label', slot, s.label);
          el('div', 'save-slot-meta', slot, `${formatTime(s.savedAt)} 저장 · 플레이 ${formatDuration(s.elapsed)}`);
          // Where the story stood, for a player coming back after a break.
          const memos = s.flags.filter((f) => f.startsWith('memo:')).map((f) => f.slice(5)).slice(-2);
          if (memos.length) {
            const recap = el('div', 'save-recap', slot);
            el('div', 'save-recap-label', recap, '최근 수첩 메모');
            for (const m of memos) el('p', '', recap, m);
          }
          if (s.log?.length) el('div', 'save-slot-meta', slot, '지난 대사는 대사 기록(L)에서 다시 볼 수 있어요.');
        }, [
          { label: '이어하기', primary: true },
          { label: '처음부터 하기', confirm: '저장된 진행이 지워져요. 한 번 더 누르면 처음부터' },
          { label: '사건 기록부로' },
        ], 'title');
        if (choice === 0) break;
        save = null;
        if (choice === 1) break;
        data = null;
      }
    }
    playBgm(null);
    this.setup(data!);
    this.stage.classList.remove('title-mode');

    let scene: string;
    if (save) {
      scene = save.scene;
      this.restore(save);
    } else {
      scene = picked ?? jump ?? this.data.start;
      const cp = this.data.checkpoints?.[scene];
      // Started part-way (scene select or a jump): the ending says so instead of posing as a full clear.
      if (scene !== this.data.start) this.flags.add(`replay|${cp?.label ?? this.data.sceneLabels[scene] ?? scene}`);
      if (scene === this.data.start) this.data.startEvidence.forEach((id) => this.record.add(id));
      else if (cp) this.applyCheckpoint(cp);
      else {
        // A jump between checkpoints holds everything, and knows what the last checkpoint knew.
        const before = this.checkpointBefore(scene);
        if (before) this.applyCheckpoint(before);
        this.record.ownAll();
      }
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

  /** The nearest checkpoint at or before a scene, in the order the scenes are listed. */
  private checkpointBefore(scene: string): Checkpoint | undefined {
    const ids = Object.keys(this.data.scenes);
    for (let k = ids.indexOf(scene); k >= 0; k--) {
      const cp = this.data.checkpoints?.[ids[k]];
      if (cp) return cp;
    }
    return undefined;
  }

  /** Puts the player where a checkpoint says: what they hold, what they know, the prediction. */
  private applyCheckpoint(cp: Checkpoint): void {
    cp.evidence.forEach((id) => this.record.add(id));
    (cp.flags ?? []).forEach((f) => this.flags.add(f));
    this.applyRecordEdits();
    this.gauge.set(cp.gauge);
    if (cp.status) this.gauge.setStatus(cp.status);
    this.paintIssue();
  }

  /** Shows the question kept in the flags (after a resume or a checkpoint start). */
  private paintIssue(): void {
    const f = [...this.flags].find((x) => x.startsWith('issue|'));
    this.issueUi.textContent = f ? `지금의 쟁점 · ${f.slice(6)}` : '';
    this.issueUi.hidden = !f;
  }

  /** The logo screen. The first press also starts the audio (browsers need a click first). */
  private async titleCard(direct: boolean): Promise<void> {
    for (;;) {
      const choice = await this.fx.card((body) => {
        const logo = el('h1', 'logo', body);
        el('span', 'logo-flip', logo, '판');
        el('span', '', logo, ' 뒤집기');
        el('div', 'saekdong', body);
        el('p', 'logo-sub', body, '2031년 서울. 숫자에 맞서는 국선변호인의 법정.');
        const keys = el('dl', 'keys', body);
        for (const [k, v] of [
          ['클릭 · Enter', '다음 대사'], ['Q', '흔들기'], ['E', '증거 제시'],
          ['← →', '증언 이동'], ['R', '법원기록'], ['L', '대사 기록'],
        ]) {
          el('dt', '', keys, k);
          el('dd', '', keys, v);
        }
      }, [{ label: direct ? '법정에 들어가기' : '사건 기록부 열기', primary: true }, { label: '설정' }], 'title');
      initAudio();
      if (choice === 1) {
        await this.settingsPanel.open(this.stage);
        continue;
      }
      if (!direct) playBgm('title');
      return;
    }
  }

  private entries(): EpisodeEntry[] {
    return this.slots.map((slot) => {
      if ('locked' in slot) return { no: slot.no, title: slot.title, tagline: slot.tagline };
      const save = loadSave(slot.id, slot.revision);
      const solved = isCleared(slot.id);
      // The solved stamp of an earlier version stays; its saves are not resumed.
      const solvedBefore = !!slot.legacyIds?.some((id) => isCleared(id));
      const revised = !save && !solved && (!!slot.legacyIds?.some((id) => hasSave(id)) || hasSave(slot.id));
      return {
        ...slot.menu,
        caseNo: slot.caseNo,
        caseId: slot.id,
        solved: solved || solvedBefore,
        status: save
          ? `이어하기 · ${save.label}`
          : revised
            ? '내용이 개정되었어요 · 새 구성으로 시작'
            : solved
              ? '해결한 사건 · 다시 하기 · 장면 선택'
              : solvedBefore
                ? '해결한 사건(개정 전) · 새 구성으로 다시 하기'
                : '새 사건',
      };
    });
  }

  private setup(data: CaseData): void {
    this.data = data;
    this.record = new CourtRecord(this.stage, data.evidence, data.profiles, data.caseNo, data.caseName);
    this.record.onMap = (mapId) => new MapView().open(this.stage, mapId, 'view');
    this.record.onPhotos = (setId) => new PhotoView().open(this.stage, setId, this.flags.has(`photomark:${setId}`));
    this.record.photoMarked = (setId) => this.flags.has(`photomark:${setId}`);
    this.record.onSeen = (id, n) => {
      for (const f of [...this.flags]) if (f.startsWith(`seen:${id}|`)) this.flags.delete(f);
      this.flags.add(`seen:${id}|${n}`);
    };
    this.record.memos = () => [...this.flags].filter((f) => f.startsWith('memo:')).map((f) => f.slice(5));
    this.gauge.set(data.gaugeStart);
    this.gauge.setStatus(data.gaugeStatus ?? null);
    this.chances = data.chances ?? 0;
    this.chanceUi.hidden = !data.chances;
    this.paintChances();
  }

  private paintChances(): void {
    if (!this.data?.chances) return;
    this.chanceUi.replaceChildren();
    el('span', 'chances-label', this.chanceUi, '재검토 기회');
    for (let k = 0; k < this.data.chances; k++) el('i', k < this.chances ? 'on' : '', this.chanceUi);
  }

  private async openSettings(): Promise<void> {
    if (this.settingsPanel.isOpen || this.backlog.isOpen) return;
    const actions: { label: string; run: () => void }[] = [];
    if (this.data && !this.stage.classList.contains('title-mode')) {
      if (this.inCross && this.data.chances) actions.push({ label: '현재 심문 처음부터', run: () => emit('restart') });
      actions.push({ label: '사건 기록부로', run: () => void this.toCaseList() });
    }
    await this.settingsPanel.open(this.stage, actions);
  }

  /** Back to the episode list, but only once the latest checkpoint is safely stored (written again now). */
  private async toCaseList(): Promise<void> {
    for (;;) {
      if (this.lastSave) this.lastSaveOk = writeSave(this.lastSave);
      if (!this.saving || !this.lastSave || this.lastSaveOk) {
        location.href = location.pathname;
        return;
      }
      const c = await this.fx.card((body) => {
        el('h2', 'card-title', body, '저장하지 못했어요');
        el('p', '', body, '이 브라우저가 저장을 거부했어요. 지금 나가면 마지막 진행이 남지 않아요.');
      }, [{ label: '다시 저장', primary: true }, { label: '돌아가지 않기' }], 'gameover');
      if (c === 1) return;
    }
  }

  private async openBacklog(): Promise<void> {
    if (this.settingsPanel.isOpen || this.backlog.isOpen || !this.data) return;
    await this.backlog.open(this.stage);
  }

  private restore(save: SaveData): void {
    save.flags.forEach((f) => this.flags.add(f));
    save.evidence.forEach((id) => this.record.add(id));
    this.applyRecordEdits();
    this.data.profiles.filter((p) => !p.later).forEach((p) => this.record.add(p.id));
    this.revealed = new Set(save.revealed);
    this.gauge.set(save.gauge);
    this.gauge.setStatus(save.status ?? this.data.gaugeStatus ?? null);
    if (this.data.chances) this.chances = save.chances ?? this.data.chances;
    this.paintChances();
    for (const f of save.flags) {
      const m = /^seen:([^|]+)\|(\d+)$/.exec(f);
      if (m) this.record.restoreSeen(m[1], Number(m[2]));
    }
    this.paintIssue();
    this.wrongs = save.wrongs;
    this.startedAt = performance.now() - save.elapsed;
    this.resumeLoc = save.loc ?? null;
    this.resumeCross = save.cross ?? null;
    this.lastSaveLabel = save.label;
    this.backlog.restore(save.log ?? []);
  }

  /** Revisions and addenda live in flags (`rev:<id>|<text>`, `ann:<id>|<text>`) so they survive a save. */
  private applyRecordEdits(): void {
    for (const f of this.flags) {
      const m = /^(rev|ann):([^|]+)\|(.*)$/s.exec(f);
      if (!m) continue;
      if (m[1] === 'rev') this.record.revise(m[2], m[3]);
      else this.record.annotate(m[2], m[3]);
    }
  }

  private autosave(label: string, at: { loc?: string; cross?: CrossResume } = {}): void {
    if (!this.saving) return;
    this.lastSave = {
      caseId: this.data.id,
      revision: this.data.revision,
      label,
      scene: this.sceneName,
      ...at,
      flags: [...this.flags],
      evidence: this.record.ownedIds,
      revealed: [...this.revealed],
      gauge: this.gauge.value,
      status: this.gauge.statusText || undefined,
      wrongs: this.wrongs,
      chances: this.data.chances ? this.chances : undefined,
      elapsed: performance.now() - this.startedAt,
      log: this.backlog.recent(LOG_KEEP),
    };
    this.lastSaveOk = writeSave(this.lastSave);
    if (this.lastSaveOk && label !== this.lastSaveLabel) flash(this.saveFlash, 'on', 1800);
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
        if (!ch.offscreen) {
          this.scene.show(cmd.who, cmd.emo);
          // Stings for the big reactions, a desk slam when 강단비 points.
          if (cmd.emo === 'shock' || cmd.emo === 'panic' || cmd.emo === 'cornered') sfx('shock');
          else if (cmd.emo === 'rage' || (cmd.who === 'dan' && cmd.emo === 'point')) sfx('slam');
        }
        await this.line({
          name: cmd.name ?? ch.name, who: cmd.who, text: cmd.text,
          style: cmd.who === 'operator' ? 'human' : 'normal', voice: ch.voice,
        });
        await this.waitAdvance();
        return;
      }
      case 'rec': {
        const ch = cmd.who ? CHARACTERS[cmd.who] : null;
        this.cinema.tapeAt(cmd.at);
        this.cinema.talking(!!ch);
        this.backlog.add(ch ? `${cmd.name ?? ch.name} (녹음 ${cmd.at})` : `녹음 ${cmd.at}`, cmd.text, 'tape');
        await this.box.say({
          name: ch ? cmd.name ?? ch.name : null, who: cmd.who, text: cmd.text, style: 'tape', voice: ch?.voice ?? null,
        });
        this.cinema.talking(false);
        await this.waitAdvance();
        return;
      }
      case 'cg':
        // A new picture is shown whole until the next line.
        if (cmd.id) this.box.hide();
        this.cinema.showCg(cmd.id);
        return;
      case 'hud':
        this.stage.classList.toggle('no-hud', !cmd.on);
        return;
      case 'issue':
        // Kept as a flag so a resumed save shows the same question.
        for (const f of [...this.flags]) if (f.startsWith('issue|')) this.flags.delete(f);
        if (cmd.text) this.flags.add(`issue|${cmd.text}`);
        this.issueUi.textContent = cmd.text ? `지금의 쟁점 · ${cmd.text}` : '';
        this.issueUi.hidden = !cmd.text;
        if (cmd.text) replay(this.issueUi, 'on');
        return;
      case 'dimHud':
        this.stage.classList.toggle('hud-dim', cmd.on);
        return;
      case 'fade':
        if (cmd.black) this.box.hide();
        await this.cinema.fade(cmd.black);
        return;
      case 'board':
        this.cinema.setBoard(cmd.title, cmd.rows);
        return;
      case 'plan':
        this.cinema.setPlan(cmd.map, cmd.marks);
        return;
      case 'memo':
        if (!this.flags.has(`memo:${cmd.text}`)) {
          this.flags.add(`memo:${cmd.text}`);
          sfx('paper');
          this.flashMemo();
        }
        return;
      case 'tint':
        this.scene.setTint(cmd.mode);
        return;
      case 'cctv':
        this.cinema.setCctv(cmd.cam, cmd.time, cmd.status);
        return;
      case 'detect':
        this.cinema.setBoxes(cmd.boxes);
        return;
      case 'tape':
        this.box.hide();
        this.cinema.setTape(cmd.title, cmd.art);
        if (cmd.title) await sleep(this.fast ? 0 : 900);
        return;
      case 'intro': {
        const ch = CHARACTERS[cmd.who];
        this.box.hide();
        this.scene.show(cmd.who);
        await this.fx.nameplate(ch.name, cmd.title, ch.color);
        return;
      }
      case 'episode':
        this.box.hide();
        await this.fx.episode(cmd.no, cmd.title);
        return;
      case 'think':
        await this.line({ name: CHARACTERS.dan.name, who: 'dan', text: cmd.text, style: 'think', voice: 'mid' });
        await this.waitAdvance();
        return;
      case 'note':
        await this.line({ name: null, text: cmd.text, style: 'notice', voice: null });
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
        else if (cmd.kind === 'redflash') this.fx.redFlash();
        else if (cmd.kind === 'pulse') this.gauge.pulse();
        else if (cmd.kind === 'zoom') this.scene.zoom();
        else this.fx.shake(cmd.kind === 'bigshake');
        return;
      case 'verdict':
        this.box.hide();
        await this.fx.verdict(cmd.word, cmd.acquit);
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
      case 'predict':
        if (cmd.status) this.gauge.setStatus(cmd.status);
        this.gauge.explain(cmd.reason);
        if (cmd.value !== this.gauge.value) await this.gauge.add(cmd.value - this.gauge.value);
        return;
      case 'showRecord':
        this.box.hide();
        await this.record.open('view', '', true, undefined, cmd.id);
        return;
      case 'match':
        this.box.hide();
        this.stepHints(cmd.opts, cmd.task.title, cmd.task.title);
        try {
          await new MatchView().open(this.stage, cmd.task, () => {
            if (cmd.task.cutMusic) this.music(null);
          });
        } finally {
          this.hintCtx = null;
        }
        return;
      case 'photoTask':
        this.box.hide();
        this.stepHints(cmd.opts, cmd.task.region.prompt, '사진 비교');
        try {
          await new PhotoView().task(this.stage, cmd.set, cmd.task);
        } finally {
          this.hintCtx = null;
        }
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
      case 'pinpoint':
        return this.runPinpoint(cmd);
      case 'reveal':
        cmd.statements.forEach((id) => this.revealed.add(id));
        return;
      case 'daon':
        this.scene.setDaonMode(cmd.mode);
        return;
      case 'addEvidence':
        return this.addEvidence(cmd.id);
      case 'addEvidenceSet':
        return this.addEvidenceSet(cmd.label, cmd.ids);
      case 'revise':
        for (const f of [...this.flags]) if (f.startsWith(`rev:${cmd.id}|`)) this.flags.delete(f);
        this.flags.add(`rev:${cmd.id}|${cmd.summary}`);
        this.record.revise(cmd.id, cmd.summary);
        return;
      case 'annotate':
        return this.annotate(cmd.id, cmd.text);
      case 'addProfile':
        return this.addProfile(cmd.id);
      case 'field':
        this.box.hide();
        this.scene.setField(cmd.bg, cmd.everyone);
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
    if (id.startsWith('presented:')) return this.presented === id.slice('presented:'.length);
    return this.flags.has(id) || this.record.has(id);
  }

  private async annotate(id: string, text: string): Promise<void> {
    const key = `ann:${id}|${text}`;
    const ev = this.record.get(id);
    if (!ev || this.flags.has(key)) return;
    this.flags.add(key);
    this.record.annotate(id, text);
    this.scene.showEvidence(this.record.item(id));
    sfx('evidence');
    await this.line({ name: null, text: `「${ev.name}」에 새로 확인된 내용을 덧붙였다.`, style: 'notice', voice: null });
    await this.waitAdvance();
    this.scene.showEvidence(null);
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

  private async addEvidenceSet(label: string, ids: string[]): Promise<void> {
    const fresh = ids.filter((id) => this.record.get(id) && !this.record.has(id));
    if (!fresh.length) return;
    fresh.forEach((id) => this.record.add(id));
    sfx('evidence');
    // Flip through the new items on the evidence card while the notice is up.
    let k = 0;
    this.scene.showEvidence(this.record.item(fresh[0]));
    const timer = setInterval(() => {
      k = (k + 1) % fresh.length;
      this.scene.showEvidence(this.record.item(fresh[k]));
    }, 900);
    const names = fresh.map((id) => `「${this.record.get(id)!.name}」`).join(' ');
    await this.line({ name: null, text: `${label} ${fresh.length}건을 법원기록에 넣었다.\n${names}`, style: 'notice', voice: null });
    await this.waitAdvance();
    clearInterval(timer);
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
    this.backlog.add(o.name, o.text, o.style);
    const onMonitor = o.who === 'daon' || o.who === 'operator';
    this.scene.setTalking(true);
    await this.box.say({ ...o, onBlip: onMonitor ? () => this.scene.pulseDaon() : undefined });
    this.scene.setTalking(false);
  }

  private async waitAdvance(): Promise<void> {
    this.box.showArrow(true);
    for (;;) {
      const a = await waitFor(['advance', 'record']);
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
    const talkTrack = this.bgm;
    const crossTrack = tm.crossBgm ?? this.data.crossBgm ?? this.bgm ?? 'cross';
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
      // A beat of black so the end of the testimony registers, then back to the room's music.
      this.box.hide();
      this.music(null);
      await this.cinema.fade(true);
      await this.fx.caption('증언 끝');
      this.music(talkTrack);
      await this.cinema.fade(false);
      if (tm.beforeCross && (await this.run(tm.beforeCross)) === STOP) return STOP;
      this.box.hide();
    }
    this.music(crossTrack);
    await this.fx.banner(resume ? '반대신문 재개' : '반대신문 개시', tm.title);

    const gaugeAtStart = resume?.gaugeStart ?? this.gauge.value;
    const revealedAtStart = new Set(resume?.revealedStart ?? this.revealed);
    let i = resume?.index ?? 0;
    let instant = false;
    this.inCross = tm.id;
    const manual = this.data.hintMode === 'manual' && !!tm.hintText?.length;
    const restart = () => {
      this.revealed = new Set(revealedAtStart);
      if (!this.data.chances) this.gauge.set(gaugeAtStart);
      i = 0;
    };
    try {
      for (;;) {
        const list = this.visible(tm);
        if (i >= list.length) i = 0;
        const st = list[i];
        this.autosave(`반대신문: ${tm.title}`, {
          cross: { id: tm.id, index: i, gaugeStart: gaugeAtStart, revealedStart: [...revealedAtStart] },
        });
        this.hintCtx = manual ? { key: `cross:${tm.id}`, title: `반대신문 · ${tm.title}`, lines: tm.hintText! } : null;
        this.cross.show('반대신문', tm.title, i, list.length, true, list.map((s) => this.pressed.has(s.id)));
        await this.sayStatement(st, instant);
        instant = false;
        const a = await waitFor(['advance', 'right', 'left', 'press', 'present', 'record', 'hint', 'restart']);
        this.cross.hide();

        if (a === 'restart') {
          restart();
          this.chances = this.data.chances ?? 0;
          this.paintChances();
          await this.fx.banner('반대신문 다시', tm.title);
          continue;
        }
        if (a === 'hint') {
          if (manual) {
            await this.openHintWindow();
            instant = true;
            continue;
          }
          if ((await this.hint(tm, true)) === STOP) return STOP;
          instant = true;
          continue;
        }
        if (a === 'advance' || a === 'right') {
          if (i < list.length - 1) i++;
          else {
            if ((await this.loopBack(tm)) === STOP) return STOP;
            i = 0;
          }
          continue;
        }
        if (a === 'left') {
          i = Math.max(0, i - 1);
          continue;
        }
        if (a === 'press') {
          this.pressed.add(st.id);
          await this.exec({ t: 'shout', who: 'dan', kind: 'holdit' });
          const before = new Set(this.revealed);
          if ((await this.run(st.press ?? this.data.defaultPress)) === STOP) return STOP;
          const after = this.visible(tm);
          const rep = after.findIndex((s) => s.replaces === st.id && !before.has(s.id));
          if (rep >= 0) i = rep;
          else {
            i = after.indexOf(st) + 1;
            if (i >= after.length) {
              if ((await this.loopBack(tm)) === STOP) return STOP;
              i = 0;
            }
          }
          continue;
        }

        // present / record: open the case file and pick evidence
        this.record.onHint = manual ? () => void this.openHintWindow() : null;
        const id = await this.record.open('present', '', true, {
          label: `반박할 증언 · ${tm.title} ${i + 1}/${list.length}`, text: st.text,
        });
        this.record.onHint = null;
        if (!id) {
          instant = true;
          continue;
        }
        const hit = !!st.accept?.includes(id);
        this.presented = id;
        if (hit && this.data.cutMusicOnObjection) this.music(null);
        await this.exec({ t: 'shout', who: 'dan', kind: 'objection' });
        this.scene.showEvidence(this.record.item(id));
        if (hit) {
          this.hintCtx = null;
          this.inCross = null;
          return this.run(tm.contradiction);
        }
        const near = st.nearMiss?.[id];
        if (near) {
          const r = await this.run(near);
          this.scene.showEvidence(null);
          if (r === STOP) return STOP;
          continue;
        }
        const r = await this.run(tm.wrong ?? this.data.defaultWrong);
        this.scene.showEvidence(null);
        if (r === STOP) return STOP;
        if (await this.penalty(tm.penalty, tm.free)) {
          if (this.data.chances) {
            if ((await this.outOfChances(true)) === 'restart') restart();
          } else {
            await this.gameOver();
            restart();
          }
        }
      }
    } finally {
      if (this.inCross === tm.id) this.inCross = null;
      this.hintCtx = null;
    }
  }

  /** Past the last statement: the case's loop-back line, then the testimony's next hint. */
  private async loopBack(tm: Testimony): Promise<Result> {
    if (this.data.hintMode === 'manual') {
      // No hint plays by itself; the first time round, a quiet note says where hints are.
      const key = `looped:${tm.id}`;
      if (!this.flags.has(key)) {
        this.flags.add(key);
        this.showToast('필요하면 H로 힌트를 볼 수 있어요.');
      }
      return;
    }
    if ((await this.run(this.data.loopBack)) === STOP) return STOP;
    return this.hint(tm, false);
  }

  private showToast(text: string): void {
    this.toast.textContent = text;
    flash(this.toast, 'on', 3200);
  }

  /** "Noted" for a few seconds. Lines written in a row are counted in one notice, not stacked. */
  private flashMemo(): void {
    this.memoBurst++;
    const total = [...this.flags].filter((f) => f.startsWith('memo:')).length;
    const where = total <= 3 ? '  (법원기록 → 메모)' : '';
    this.memoFlash.textContent = this.memoBurst > 1 ? `✎ 수첩에 ${this.memoBurst}줄 적었다${where}` : `✎ 수첩에 적었다${where}`;
    flash(this.memoFlash, 'on', 2600, () => (this.memoBurst = 0));
  }

  /** Plays the testimony's next hint; they go from vague to concrete and the last one repeats. */
  private async hint(tm: Testimony, asked: boolean): Promise<Result> {
    const hints = tm.hints ?? [];
    if (!hints.length) {
      if (!asked) return;
      return this.run([{ t: 'think', text: '(…증언을 하나씩 흔들어 보고, 법원기록과 맞춰 보자.)' }]);
    }
    const k = this.hintAt.get(tm.id) ?? 0;
    this.hintAt.set(tm.id, Math.min(k + 1, hints.length - 1));
    return this.run(hints[k]);
  }

  /** H anywhere: opens the hint window when the current question has hints (manual mode). */
  private openHint(): boolean {
    if (this.hintPanel.isOpen) {
      this.hintPanel.next();
      return true;
    }
    if (!this.hintCtx || this.data?.hintMode !== 'manual') return false;
    if (this.settingsPanel.isOpen || this.backlog.isOpen) return true;
    void this.openHintWindow();
    return true;
  }

  private async openHintWindow(): Promise<void> {
    const ctx = this.hintCtx;
    if (!ctx || this.hintPanel.isOpen) return;
    await this.hintPanel.open(this.stage, ctx.title, ctx.lines, this.hintStage(ctx.key), (n) => {
      for (const f of [...this.flags]) if (f.startsWith(`hint:${ctx.key}|`)) this.flags.delete(f);
      this.flags.add(`hint:${ctx.key}|${n}`);
    });
  }

  private hintStage(key: string): number {
    for (const f of this.flags) {
      if (f.startsWith(`hint:${key}|`)) return Number(f.slice(`hint:${key}|`.length)) || 0;
    }
    return 0;
  }

  /** Total hint stages read, for the ending card. */
  private hintsUsed(): number {
    let n = 0;
    for (const f of this.flags) {
      const m = /^hint:.*\|(\d+)$/.exec(f);
      if (m) n += Number(m[1]);
    }
    return n;
  }

  private stepHints(opts: StepOpts | undefined, fallbackKey: string, title: string): void {
    this.hintCtx = this.data.hintMode === 'manual' && opts?.hints?.length
      ? { key: opts.hintKey ?? fallbackKey, title, lines: opts.hints }
      : null;
  }

  /** "Point at it" on a map. A wrong spot costs like wrong evidence. */
  private async runPinpoint(cmd: Extract<Cmd, { t: 'pinpoint' }>): Promise<Result> {
    const start = this.gauge.value;
    this.stepHints(cmd.opts, cmd.prompt, '평면도에서 찍기');
    try {
      for (;;) {
        this.box.hide();
        const id = await new MapView().open(this.stage, cmd.map, 'pick', cmd.prompt, () => this.record.open('view'));
        if (id === cmd.answer) {
          sfx('realize');
          this.hintCtx = null;
          return this.run(cmd.then);
        }
        const r = await this.run(cmd.wrong ?? this.data.presentWrong);
        if (r === STOP) return STOP;
        if (await this.penalty(undefined, cmd.opts?.free)) {
          if (this.data.chances) await this.outOfChances(false);
          else {
            await this.gameOver();
            this.gauge.set(start);
          }
        }
      }
    } finally {
      this.hintCtx = null;
    }
  }

  private async runPresent(cmd: Extract<Cmd, { t: 'present' }>): Promise<Result> {
    const start = this.gauge.value;
    this.stepHints(cmd.opts, cmd.prompt, cmd.prompt);
    try {
      for (;;) {
        this.box.hide();
        this.record.onHint = this.hintCtx ? () => void this.openHintWindow() : null;
        const id = await this.record.open('present', cmd.prompt, false);
        this.record.onHint = null;
        const hit = ([] as string[]).concat(cmd.answer).includes(id!);
        this.presented = id;
        if (hit && this.data.cutMusicOnObjection) this.music(null);
        await this.exec({ t: 'shout', who: 'dan', kind: 'takethat' });
        this.scene.showEvidence(this.record.item(id));
        if (hit) {
          this.hintCtx = null;
          return this.run(cmd.then);
        }
        const near = cmd.nearMiss?.[id!];
        if (near) {
          const r = await this.run(near);
          this.scene.showEvidence(null);
          if (r === STOP) return STOP;
          continue;
        }
        const r = await this.run(cmd.wrong ?? this.data.presentWrong);
        this.scene.showEvidence(null);
        if (r === STOP) return STOP;
        if (await this.penalty(undefined, cmd.opts?.free)) {
          if (this.data.chances) await this.outOfChances(false);
          else {
            await this.gameOver();
            this.gauge.set(start);
          }
        }
      }
    } finally {
      this.hintCtx = null;
    }
  }

  private async runAsk(cmd: Extract<Cmd, { t: 'ask' }>): Promise<Result> {
    const used = new Set<number>();
    const hasCorrect = cmd.options.some((o) => o.correct);
    this.stepHints(cmd.opts, cmd.note, cmd.title ?? '선택');
    try {
      for (;;) {
        this.scene.show(cmd.who);
        this.box.hide();
        this.ask.onHint = this.hintCtx ? () => void this.openHintWindow() : null;
        // Without a right answer it is only a "where next" menu: one click is enough.
        const idx = await this.ask.open(cmd.note, cmd.options.map((o) => o.label), used, cmd.title, !hasCorrect);
        this.ask.onHint = null;
        used.add(idx);
        const opt = cmd.options[idx];
        if ((await this.run(opt.then)) === STOP) return STOP;
        if (opt.correct || !hasCorrect) return;
      }
    } finally {
      this.hintCtx = null;
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

  /**
   * A wrong answer. With review chances it spends one (unless `free`) and leaves the prediction
   * alone; otherwise it raises the prediction. Resolves true when the player has run out.
   */
  private async penalty(amount = this.data.wrongPenalty, free = false): Promise<boolean> {
    this.wrongs++;
    if (this.data.chances) {
      if (free) return false;
      this.chances = Math.max(0, this.chances - 1);
      this.paintChances();
      replay(this.chanceUi, 'lose');
      sfx('damage');
      return this.chances === 0;
    }
    return this.gauge.add(amount);
  }

  /** Out of review chances: never a guilty verdict, just a pause to look at the record again. */
  private async outOfChances(inCross: boolean): Promise<'continue' | 'restart'> {
    const resume = this.bgm;
    playBgm(null);
    const buttons = inCross
      ? [{ label: '기록 보고 이어하기', primary: true }, { label: '이 심문 처음부터' }]
      : [{ label: '기록 보고 이어하기', primary: true }];
    const c = await this.fx.card((body) => {
      el('h2', 'card-title', body, '재검토 기회를 다 썼어요');
      el('p', '', body, '기록을 정리하고 다시 시도할 수 있어요. 판관 예측과 지금까지 확인한 사실은 그대로예요.');
    }, buttons, 'gameover');
    this.chances = this.data.chances ?? 0;
    this.paintChances();
    this.bgm = resume;
    playBgm(resume);
    if (c === 0) await this.record.open('view');
    return c === 1 ? 'restart' : 'continue';
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
    this.cinema.clear();
    if (this.saving) {
      clearSave(this.data.id);
      markCleared(this.data.id);
    }
    const secs = Math.round((performance.now() - this.startedAt) / 1000);
    const replayFrom = [...this.flags].find((f) => f.startsWith('replay|'))?.slice(7);
    await this.fx.card((body) => {
      el('p', 'card-kicker', body, this.data.episode);
      el('h2', 'card-title', body, replayFrom ? '장면 재생 완료' : this.data.endingTitle);
      if (replayFrom) el('p', 'ending-note', body, `「${replayFrom}」부터 다시 본 기록이에요. 처음부터 해결한 기록은 그대로예요.`);
      const stats = el('dl', 'stats', body);
      const rows = [
        ['플레이 시간', `${Math.floor(secs / 60)}분 ${secs % 60}초`],
        ['잘못 제시한 증거', `${this.wrongs}번`],
      ];
      if (this.data.hintMode === 'manual') rows.push(['열어 본 힌트', `${this.hintsUsed()}단계`]);
      rows.push(['최종 유죄 예측률', `${this.gauge.value.toFixed(1)}%`]);
      for (const [k, v] of rows) {
        el('dt', '', stats, k);
        el('dd', '', stats, v);
      }
      if (this.data.endingNote) el('p', 'ending-note', body, this.data.endingNote);
    }, '사건 기록부로', 'ending');
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
  private count: HTMLElement;
  private mark: HTMLElement;
  private controls: HTMLElement;

  constructor(stage: HTMLElement) {
    this.head = el('div', 'cross-head', stage);
    this.kind = el('div', 'cross-kind', this.head);
    this.title = el('div', 'cross-title', this.head);
    const row = el('div', 'cross-row', this.head);
    this.pips = el('div', 'pips', row);
    this.count = el('span', 'cross-count', row);
    this.mark = el('span', 'cross-mark', row, '흔들어 봄');
    this.controls = el('div', 'cross-controls', stage);
    const prev = el('button', 'arrow arrow-prev', this.controls, '◀');
    const next = el('button', 'arrow arrow-next', this.controls, '▶');
    const press = el('button', 'btn btn-press', this.controls, '흔들기  Q');
    const present = el('button', 'btn btn-present', this.controls, '증거 제시  E');
    const hint = el('button', 'btn btn-hint', this.controls, '힌트  H');
    hint.addEventListener('click', () => emit('hint'));
    prev.setAttribute('aria-label', '이전 증언');
    next.setAttribute('aria-label', '다음 증언');
    prev.addEventListener('click', () => emit('left'));
    next.addEventListener('click', () => emit('right'));
    press.addEventListener('click', () => emit('press'));
    present.addEventListener('click', () => emit('present'));
    this.hide();
  }

  show(kind: string, title: string, i: number, n: number, interactive: boolean, pressed: boolean[] = []): void {
    this.head.hidden = false;
    this.head.dataset.kind = kind;
    this.kind.textContent = kind;
    this.title.textContent = title;
    this.pips.replaceChildren();
    for (let k = 0; k < n; k++) {
      const pip = el('i', k === i ? 'on' : '', this.pips);
      pip.classList.toggle('pressed', !!pressed[k]);
    }
    this.count.textContent = `${i + 1} / ${n}`;
    this.mark.hidden = !pressed[i];
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
