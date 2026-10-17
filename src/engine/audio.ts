import type { BgmName, SfxName, Voice } from './types';

// Everything is synthesized with WebAudio so the prototype needs no sound files.

let ctx: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let sfxBus: GainNode;
let noiseBuf: AudioBuffer;
let muted = false;

const MASTER_VOL = 0.8;

export function initAudio(): void {
  if (ctx) {
    void ctx.resume();
    return;
  }
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER_VOL;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.5;
  musicBus.connect(master);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.9;
  sfxBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  setInterval(scheduleMusic, 50);
}

export function setMuted(value: boolean): void {
  muted = value;
  if (ctx) master.gain.setTargetAtTime(value ? 0 : MASTER_VOL, ctx.currentTime, 0.02);
}

export function isMuted(): boolean {
  return muted;
}

// ---------------------------------------------------------------- primitives

function tone(
  freq: number, start: number, dur: number, type: OscillatorType, vol: number,
  dest: AudioNode, glideTo?: number,
): void {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(dest);
  o.start(start);
  o.stop(start + dur + 0.05);
}

function noise(
  start: number, dur: number, vol: number, dest: AudioNode,
  filter: BiquadFilterType = 'lowpass', freq = 8000, q = 0.7,
): void {
  if (!ctx) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(start, Math.random() * 0.5);
  src.stop(start + dur + 0.05);
}

function freqOf(note: string): number {
  const m = /^([A-G])(#?)(\d)$/.exec(note);
  if (!m) return 440;
  const idx = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1] as 'C'] + (m[2] ? 1 : 0);
  const midi = 12 * (Number(m[3]) + 1) + idx;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ---------------------------------------------------------------- text blips

const VOICES: Record<Voice, { f: number; type: OscillatorType; dur: number; vol: number; glide?: number }> = {
  high: { f: 780, type: 'square', dur: 0.032, vol: 0.045 },
  mid: { f: 590, type: 'square', dur: 0.034, vol: 0.045 },
  low: { f: 360, type: 'square', dur: 0.038, vol: 0.045 },
  deep: { f: 240, type: 'triangle', dur: 0.05, vol: 0.12 },
  ai: { f: 1180, type: 'sine', dur: 0.04, vol: 0.07, glide: 1480 },
  soft: { f: 520, type: 'triangle', dur: 0.05, vol: 0.1 },
  warm: { f: 430, type: 'triangle', dur: 0.05, vol: 0.11 },
  gruff: { f: 280, type: 'square', dur: 0.045, vol: 0.05 },
};

export function blip(voice: Voice): void {
  if (!ctx) return;
  const v = VOICES[voice];
  // Human voices wobble a little. The AI voice is perfectly identical every time.
  const jitter = voice === 'ai' ? 1 : 1 + (Math.random() - 0.5) * 0.08;
  tone(v.f * jitter, ctx.currentTime, v.dur, v.type, v.vol, sfxBus, v.glide);
}

// ---------------------------------------------------------------- sound effects

export function sfx(name: SfxName): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  switch (name) {
    case 'gavel':
      knock(t);
      break;
    case 'gavel3':
      knock(t);
      knock(t + 0.22);
      knock(t + 0.44);
      break;
    case 'shout':
      tone(110, t, 0.45, 'sine', 0.7, sfxBus, 40);
      noise(t, 0.28, 0.45, sfxBus, 'lowpass', 1800);
      tone(880, t, 0.3, 'square', 0.06, sfxBus);
      tone(1320, t + 0.02, 0.3, 'square', 0.04, sfxBus);
      break;
    case 'damage':
      tone(320, t, 0.4, 'square', 0.1, sfxBus, 110);
      noise(t, 0.2, 0.2, sfxBus, 'bandpass', 900, 2);
      break;
    case 'heal':
      ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone(freqOf(n), t + i * 0.06, 0.18, 'triangle', 0.12, sfxBus));
      break;
    case 'reveal':
      ['A2', 'E3', 'A3', 'C4', 'E4'].forEach((n) => tone(freqOf(n), t, 1.6, 'sawtooth', 0.05, sfxBus));
      noise(t, 0.5, 0.35, sfxBus, 'lowpass', 2400);
      tone(80, t, 0.8, 'sine', 0.6, sfxBus, 35);
      break;
    case 'glitch':
      for (let i = 0; i < 9; i++) {
        tone(200 + Math.random() * 2400, t + i * 0.045, 0.04, 'square', 0.05, sfxBus);
      }
      noise(t, 0.45, 0.18, sfxBus, 'bandpass', 3000, 4);
      break;
    case 'boot':
      ['E5', 'B5', 'E6'].forEach((n, i) => tone(freqOf(n), t + i * 0.12, 0.5, 'sine', 0.12, sfxBus));
      break;
    case 'whoosh': {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 1.5;
      f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(5000, t + 0.35);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      src.connect(f).connect(g).connect(sfxBus);
      src.start(t);
      src.stop(t + 0.45);
      break;
    }
    case 'select':
      tone(1250, t, 0.03, 'square', 0.04, sfxBus);
      break;
    case 'open':
      tone(520, t, 0.08, 'triangle', 0.12, sfxBus, 780);
      break;
    case 'close':
      tone(700, t, 0.08, 'triangle', 0.1, sfxBus, 420);
      break;
    case 'evidence':
      tone(freqOf('G5'), t, 0.12, 'square', 0.06, sfxBus);
      tone(freqOf('D6'), t + 0.1, 0.32, 'square', 0.06, sfxBus);
      tone(freqOf('D6'), t + 0.1, 0.32, 'triangle', 0.1, sfxBus);
      break;
  }
}

function knock(t: number): void {
  noise(t, 0.08, 0.6, sfxBus, 'bandpass', 1600, 1.2);
  tone(150, t, 0.18, 'sine', 0.55, sfxBus, 60);
}

// ---------------------------------------------------------------- music

// Each part is a string of 8th-note tokens: a note ("A4"), "-" to hold the
// previous note, "." for a rest, or "x" for a drum hit.
interface Part {
  inst: OscillatorType | 'kick' | 'snare' | 'hat';
  vol: number;
  seq: string;
}
interface Track {
  bpm: number;
  parts: Part[];
}

const bars = (...b: string[]) => b.join(' ');
const rep = (s: string, n: number) => Array(n).fill(s).join(' ');

const TRACKS: Record<BgmName, Track> = {
  trial: {
    bpm: 92,
    parts: [
      { inst: 'triangle', vol: 0.07, seq: bars(
        'D4 A4 F#5 A4 D5 A4 F#5 A4', 'B3 F#4 D5 F#4 B4 F#4 D5 F#4',
        'G3 D4 B4 D4 G4 D4 B4 D4', 'A3 E4 C#5 E4 A4 E4 C#5 E4') },
      { inst: 'square', vol: 0.03, seq: bars(
        'F#5 - - - E5 - D5 -', 'D5 - - - C#5 - B4 -',
        'B4 - D5 - G5 - F#5 -', 'E5 - - - - - . .') },
      { inst: 'triangle', vol: 0.16, seq: bars(
        'D2 - - - D2 - - -', 'B1 - - - B1 - - -', 'G1 - - - G1 - - -', 'A1 - - - A1 - - -') },
    ],
  },
  cross: {
    bpm: 132,
    parts: [
      { inst: 'square', vol: 0.045, seq: bars(
        'E5 - A5 - G5 E5 D5 -', 'D5 - G5 - F5 D5 B4 -',
        'C5 - F5 - E5 C5 A4 -', 'B4 C5 D5 E5 G#5 - - -',
        'A5 - - G5 E5 - C5 -', 'B4 - - D5 G5 - F5 -',
        'E5 - F5 E5 D5 - C5 -', 'B4 - G#4 - E4 - - -') },
      { inst: 'triangle', vol: 0.17, seq: rep(bars(
        'A2 A2 A3 A2 A2 A2 A3 A2', 'G2 G2 G3 G2 G2 G2 G3 G2',
        'F2 F2 F3 F2 F2 F2 F3 F2', 'E2 E2 E3 E2 E2 E2 E3 E2'), 2) },
      { inst: 'kick', vol: 0.5, seq: rep('x . . . x . . .', 8) },
      { inst: 'snare', vol: 0.11, seq: rep('. . x . . . x .', 8) },
      { inst: 'hat', vol: 0.025, seq: rep('x x x x x x x x', 8) },
    ],
  },
  pursuit: {
    bpm: 160,
    parts: [
      { inst: 'square', vol: 0.045, seq: bars(
        'E5 G5 B5 - A5 G5 F#5 G5', 'E5 G5 C6 - B5 A5 G5 A5',
        'F#5 A5 D6 - C6 B5 A5 B5', 'D#5 - F#5 - B5 - - -') },
      { inst: 'triangle', vol: 0.17, seq: bars(
        'E2 E3 E2 E3 E2 E3 E2 E3', 'C2 C3 C2 C3 C2 C3 C2 C3',
        'D2 D3 D2 D3 D2 D3 D2 D3', 'B1 B2 B1 B2 B1 B2 B1 B2') },
      { inst: 'kick', vol: 0.5, seq: rep('x . x . x . x .', 4) },
      { inst: 'snare', vol: 0.12, seq: rep('. . x . . . x .', 4) },
      { inst: 'hat', vol: 0.03, seq: rep('x x x x x x x x', 4) },
    ],
  },
  investigate: {
    bpm: 112,
    parts: [
      { inst: 'square', vol: 0.035, seq: bars(
        'C5 . A4 C5 F5 - E5 .', 'D5 . A4 D5 F5 - E5 D5',
        'D5 . A#4 D5 F5 - G5 .', 'E5 - C5 - G4 - . .') },
      { inst: 'triangle', vol: 0.15, seq: bars(
        'F2 . C3 . F2 . C3 .', 'D2 . A2 . D2 . A2 .',
        'A#1 . F2 . A#1 . F2 .', 'C2 . G2 . C2 . G2 .') },
      { inst: 'kick', vol: 0.3, seq: rep('x . . . x . . .', 4) },
      { inst: 'hat', vol: 0.02, seq: rep('. . x . . . x .', 4) },
    ],
  },
  suspense: {
    bpm: 66,
    parts: [
      { inst: 'sine', vol: 0.14, seq: 'E2 - - - - - - - E2 - - - - - - -' },
      { inst: 'kick', vol: 0.35, seq: 'x . x . . . . . x . x . . . . .' },
      { inst: 'triangle', vol: 0.03, seq: '. . . . . . . . A#5 - - - . . . .' },
    ],
  },
};

interface ParsedNote { step: number; len: number; token: string }

function parse(seq: string): { notes: ParsedNote[]; steps: number } {
  const tokens = seq.trim().split(/\s+/);
  const notes: ParsedNote[] = [];
  tokens.forEach((tok, i) => {
    if (tok === '-') {
      const last = notes[notes.length - 1];
      if (last) last.len++;
    } else if (tok !== '.') {
      notes.push({ step: i, len: 1, token: tok });
    }
  });
  return { notes, steps: tokens.length };
}

let playing: { name: BgmName; bus: GainNode; nextLoop: number; loopDur: number; parts: { part: Part; notes: ParsedNote[] }[]; stepDur: number } | null = null;

export function playBgm(name: BgmName | null): void {
  if (!ctx) return;
  if (playing && playing.name === name) return;
  if (playing) {
    const old = playing.bus;
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    setTimeout(() => old.disconnect(), 800);
    playing = null;
  }
  if (!name) return;
  const track = TRACKS[name];
  const stepDur = 60 / track.bpm / 2;
  const parsed = track.parts.map((part) => ({ part, ...parse(part.seq) }));
  const steps = Math.max(...parsed.map((p) => p.steps));
  const bus = ctx.createGain();
  bus.gain.value = 1;
  bus.connect(musicBus);
  playing = {
    name, bus, stepDur,
    nextLoop: ctx.currentTime + 0.1,
    loopDur: steps * stepDur,
    parts: parsed.map((p) => ({ part: p.part, notes: p.notes })),
  };
  scheduleMusic();
}

function scheduleMusic(): void {
  if (!ctx || !playing) return;
  const p = playing;
  while (p.nextLoop < ctx.currentTime + 0.3) {
    const t0 = p.nextLoop;
    for (const { part, notes } of p.parts) {
      for (const n of notes) {
        const t = t0 + n.step * p.stepDur;
        const dur = n.len * p.stepDur;
        if (part.inst === 'kick') tone(150, t, 0.16, 'sine', part.vol, p.bus, 45);
        else if (part.inst === 'snare') noise(t, 0.12, part.vol, p.bus, 'highpass', 1500);
        else if (part.inst === 'hat') noise(t, 0.03, part.vol, p.bus, 'highpass', 7000);
        else sustain(freqOf(n.token), t, dur, part.inst, part.vol, p.bus);
      }
    }
    p.nextLoop += p.loopDur;
  }
}

function sustain(freq: number, t: number, dur: number, type: OscillatorType, vol: number, dest: AudioNode): void {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.setTargetAtTime(vol * 0.65, t + 0.01, dur * 0.35);
  g.gain.setTargetAtTime(0, t + dur * 0.88, 0.02);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.15);
}
