import { TRACKS, type Inst, type Part } from './music';
import { onSettings, settings } from './settings';
import type { AmbienceName, BgmName, SfxName, Voice } from './types';

// Everything is synthesized with WebAudio, so the game ships no sound files.
// Signal flow: instruments → music / sfx / ambience buses → master → limiter → speakers,
// with a shared convolution reverb that any voice can send into.

let ctx: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let sfxBus: GainNode;
let ambBus: GainNode;
let reverb: ConvolverNode;
let noiseBuf: AudioBuffer;
let muted = false;

const MASTER_VOL = 0.85;
// Bus levels at full volume; the settings sliders scale them.
const MUSIC_VOL = 0.38;
const SFX_VOL = 0.9;
const AMB_VOL = 0.5;

export function initAudio(): void {
  if (ctx) {
    void ctx.resume();
    return;
  }
  ctx = new AudioContext();
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 6;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  limiter.connect(ctx.destination);
  master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER_VOL;
  master.connect(limiter);

  musicBus = bus(0);
  sfxBus = bus(0);
  ambBus = bus(0);
  applyVolumes();
  onSettings(applyVolumes);

  reverb = ctx.createConvolver();
  reverb.buffer = impulse(2.6, 2.2);
  const wet = ctx.createGain();
  wet.gain.value = 0.45;
  reverb.connect(wet).connect(master);

  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  setInterval(tick, 50);
}

/**
 * Volume sliders are 0..10 with 8 as the mixed level, leaving a little boost above it.
 * A squared curve sounds more even than a straight one.
 */
function applyVolumes(): void {
  if (!ctx) return;
  const { music, sfx: fx } = settings();
  const curve = (n: number) => (n / 8) ** 2;
  const t = ctx.currentTime;
  musicBus.gain.setTargetAtTime(MUSIC_VOL * curve(music), t, 0.03);
  sfxBus.gain.setTargetAtTime(SFX_VOL * curve(fx), t, 0.03);
  ambBus.gain.setTargetAtTime(AMB_VOL * curve(fx), t, 0.03);
}

function bus(vol: number): GainNode {
  const g = ctx!.createGain();
  g.gain.value = vol;
  g.connect(master);
  return g;
}

/** Stereo noise with an exponential tail: a decent small-hall reverb. */
function impulse(seconds: number, decay: number): AudioBuffer {
  const rate = ctx!.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx!.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

export function setMuted(value: boolean): void {
  muted = value;
  if (ctx) master.gain.setTargetAtTime(value ? 0 : MASTER_VOL, ctx.currentTime, 0.02);
}

export function isMuted(): boolean {
  return muted;
}

// ---------------------------------------------------------------- building blocks

/** Routes a voice to its bus, with an optional send into the reverb. */
function out(node: AudioNode, dest: AudioNode, rev = 0): void {
  node.connect(dest);
  if (rev > 0) {
    const send = ctx!.createGain();
    send.gain.value = rev;
    node.connect(send).connect(reverb);
  }
}

function osc(type: OscillatorType, freq: number, t: number, stop: number, detuneCents = 0): OscillatorNode {
  const o = ctx!.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.detune.value = detuneCents;
  o.start(t);
  o.stop(stop);
  return o;
}

function noiseSrc(t: number, stop: number): AudioBufferSourceNode {
  const src = ctx!.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  src.start(t, Math.random());
  src.stop(stop);
  return src;
}

function filter(type: BiquadFilterType, freq: number, q = 0.7): BiquadFilterNode {
  const f = ctx!.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/** Percussive envelope: quick attack, exponential fall. */
function perc(t: number, peak: number, decay: number): GainNode {
  const g = ctx!.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  return g;
}

/** Sustained envelope: attack, hold for `dur`, release. */
function sus(t: number, peak: number, attack: number, dur: number, release: number): GainNode {
  const g = ctx!.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + Math.max(attack, dur));
  g.gain.linearRampToValueAtTime(0, t + Math.max(attack, dur) + release);
  return g;
}

function freqOf(note: string): number {
  const m = /^([A-G])([#b]?)(\d)$/.exec(note);
  if (!m) return 440;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1] as 'C'];
  const idx = base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = 12 * (Number(m[3]) + 1) + idx;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ---------------------------------------------------------------- instruments

type Play = (f: number, t: number, dur: number, vol: number, dest: AudioNode, rev: number) => void;

const INSTRUMENTS: Record<Exclude<Inst, 'kick' | 'snare' | 'hat' | 'shaker' | 'rim' | 'crash'>, Play> = {
  // Additive piano: a few harmonics through a lowpass that closes as the note decays.
  piano(f, t, dur, vol, dest, rev) {
    const len = Math.max(dur, 0.5) + 1.4;
    const lp = filter('lowpass', Math.min(9000, f * 9));
    lp.frequency.setValueAtTime(Math.min(9000, f * 9), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 2), t + 1.2);
    const g = ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(vol * 0.3, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    [1, 0.42, 0.18, 0.07].forEach((amp, i) => {
      const h = ctx!.createGain();
      h.gain.value = amp;
      osc(i === 0 ? 'triangle' : 'sine', f * (i + 1), t, t + len + 0.05, i * 1.5).connect(h).connect(lp);
    });
    lp.connect(g);
    out(g, dest, rev);
  },
  // FM bell: inharmonic modulator, bright attack, long ring.
  bell(f, t, _dur, vol, dest, rev) {
    const len = 2.8;
    const mod = osc('sine', f * 2.76, t, t + len);
    const modGain = ctx!.createGain();
    modGain.gain.setValueAtTime(f * 2.2, t);
    modGain.gain.exponentialRampToValueAtTime(f * 0.05, t + 1.6);
    const car = osc('sine', f, t, t + len);
    mod.connect(modGain).connect(car.frequency);
    const g = perc(t, vol, len);
    car.connect(g);
    const shimmer = osc('sine', f * 2, t, t + len);
    const sg = perc(t, vol * 0.25, len * 0.6);
    shimmer.connect(sg);
    out(g, dest, rev);
    out(sg, dest, rev);
  },
  // Detuned saw pad, soft attack.
  pad(f, t, dur, vol, dest, rev) {
    const g = sus(t, vol, 0.6, dur, 1.2);
    const lp = filter('lowpass', 1100, 0.4);
    for (const cents of [-9, 0, 9]) osc('sawtooth', f, t, t + dur + 1.4, cents).connect(lp);
    lp.connect(g);
    out(g, dest, rev);
  },
  // Bowed strings: two saws, delayed vibrato.
  strings(f, t, dur, vol, dest, rev) {
    const g = sus(t, vol, 0.12, dur, 0.5);
    const lp = filter('lowpass', 2400, 0.6);
    const lfo = osc('sine', 5.2, t, t + dur + 0.6);
    const depth = ctx!.createGain();
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(7, t + 0.35);
    lfo.connect(depth);
    for (const cents of [-6, 6]) {
      const o = osc('sawtooth', f, t, t + dur + 0.6, cents);
      depth.connect(o.detune);
      o.connect(lp);
    }
    lp.connect(g);
    out(g, dest, rev);
  },
  // Plucked synth: filter snaps shut.
  pluck(f, t, dur, vol, dest, rev) {
    const len = Math.min(Math.max(dur, 0.25), 0.9);
    const lp = filter('lowpass', 4200, 2);
    lp.frequency.setValueAtTime(4200, t);
    lp.frequency.exponentialRampToValueAtTime(500, t + 0.3);
    const g = perc(t, vol, len);
    osc('square', f, t, t + len + 0.05).connect(lp);
    const tri = ctx!.createGain();
    tri.gain.value = 0.6;
    osc('triangle', f * 2, t, t + len + 0.05).connect(tri).connect(lp);
    lp.connect(g);
    out(g, dest, rev);
  },
  // Square lead with delayed vibrato.
  lead(f, t, dur, vol, dest, rev) {
    const g = sus(t, vol, 0.01, dur * 0.92, 0.08);
    const lp = filter('lowpass', 3600, 0.7);
    const o = osc('square', f, t, t + dur + 0.15);
    const lfo = osc('sine', 5.5, t, t + dur + 0.15);
    const depth = ctx!.createGain();
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(dur > 0.4 ? 12 : 0, t + 0.25);
    lfo.connect(depth).connect(o.detune);
    o.connect(lp).connect(g);
    out(g, dest, rev);
  },
  // Saw + sub sine through a lowpass.
  bass(f, t, dur, vol, dest, rev) {
    const g = sus(t, vol, 0.006, dur * 0.9, 0.06);
    const lp = filter('lowpass', 700, 1);
    osc('sawtooth', f, t, t + dur + 0.1).connect(lp);
    const sub = ctx!.createGain();
    sub.gain.value = 0.8;
    osc('sine', f, t, t + dur + 0.1).connect(sub).connect(lp);
    lp.connect(g);
    out(g, dest, rev);
  },
};

function drum(inst: Inst, t: number, vol: number, dest: AudioNode, rev: number): void {
  switch (inst) {
    case 'kick': {
      const o = osc('sine', 150, t, t + 0.35);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      const g = perc(t, vol, 0.32);
      o.connect(g);
      out(g, dest, rev);
      break;
    }
    case 'snare': {
      const n = noiseSrc(t, t + 0.25);
      const g = perc(t, vol, 0.2);
      n.connect(filter('bandpass', 1900, 0.8)).connect(g);
      const body = perc(t, vol * 0.6, 0.09);
      osc('triangle', 190, t, t + 0.12).connect(body);
      out(g, dest, rev);
      out(body, dest, rev);
      break;
    }
    case 'hat': {
      const g = perc(t, vol, 0.045);
      noiseSrc(t, t + 0.08).connect(filter('highpass', 8000)).connect(g);
      out(g, dest, rev);
      break;
    }
    case 'shaker': {
      const g = ctx!.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      noiseSrc(t, t + 0.12).connect(filter('bandpass', 6500, 1.2)).connect(g);
      out(g, dest, rev);
      break;
    }
    case 'rim': {
      const g = perc(t, vol, 0.05);
      osc('triangle', 1750, t, t + 0.06).connect(g);
      out(g, dest, rev);
      break;
    }
    case 'crash': {
      const g = perc(t, vol, 1.6);
      noiseSrc(t, t + 1.7).connect(filter('highpass', 4500)).connect(g);
      out(g, dest, rev);
      break;
    }
    default:
      break;
  }
}

const DRUMS = new Set<Inst>(['kick', 'snare', 'hat', 'shaker', 'rim', 'crash']);

function playNote(part: Part, token: string, t: number, dur: number, dest: AudioNode): void {
  const rev = part.rev ?? 0;
  if (DRUMS.has(part.inst)) {
    const accent = token === 'X' ? 1.4 : token === 'o' ? 0.45 : 1;
    drum(part.inst, t, part.vol * accent, dest, rev);
    return;
  }
  const play = INSTRUMENTS[part.inst as keyof typeof INSTRUMENTS];
  for (const note of token.split('+')) play(freqOf(note), t, dur, part.vol, dest, rev);
}

// ---------------------------------------------------------------- text blips

const VOICES: Record<Voice, { f: number; type: OscillatorType; dur: number; vol: number; glide?: number }> = {
  high: { f: 780, type: 'square', dur: 0.032, vol: 0.16 },
  mid: { f: 590, type: 'square', dur: 0.034, vol: 0.16 },
  low: { f: 360, type: 'square', dur: 0.038, vol: 0.17 },
  deep: { f: 240, type: 'triangle', dur: 0.05, vol: 0.4 },
  ai: { f: 1180, type: 'sine', dur: 0.04, vol: 0.25, glide: 1480 },
  soft: { f: 520, type: 'triangle', dur: 0.05, vol: 0.36 },
  warm: { f: 430, type: 'triangle', dur: 0.05, vol: 0.38 },
  gruff: { f: 280, type: 'square', dur: 0.045, vol: 0.17 },
  young: { f: 470, type: 'triangle', dur: 0.045, vol: 0.36 },
  // A little upward slide on every syllable: the salesman's voice.
  slick: { f: 400, type: 'square', dur: 0.032, vol: 0.15, glide: 450 },
  granny: { f: 650, type: 'triangle', dur: 0.06, vol: 0.32 },
  // Gadgets slide down, where 다온's voice slides up.
  device: { f: 1500, type: 'sine', dur: 0.03, vol: 0.2, glide: 1150 },
};

export function blip(voice: Voice): void {
  if (!ctx) return;
  const v = VOICES[voice];
  // Human voices wobble a little. The AI voice is perfectly identical every time.
  const machine = voice === 'ai' || voice === 'device';
  const jitter = machine ? 1 : 1 + (Math.random() - 0.5) * (voice === 'granny' ? 0.14 : 0.08);
  const t = ctx.currentTime;
  const o = osc(v.type, v.f * jitter, t, t + v.dur + 0.02);
  if (v.glide) o.frequency.exponentialRampToValueAtTime(v.glide, t + v.dur);
  const g = perc(t, v.vol, v.dur);
  o.connect(g);
  out(g, sfxBus, machine ? 0.25 : 0);
}

// ---------------------------------------------------------------- sound effects

function tone(f: number, t: number, dur: number, type: OscillatorType, vol: number, rev = 0, glideTo?: number): void {
  const o = osc(type, f, t, t + dur + 0.05);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  const g = perc(t, vol, dur);
  o.connect(g);
  out(g, sfxBus, rev);
}

function hiss(t: number, dur: number, vol: number, type: BiquadFilterType, freq: number, q = 0.8, rev = 0): void {
  const g = perc(t, vol, dur);
  noiseSrc(t, t + dur + 0.05).connect(filter(type, freq, q)).connect(g);
  out(g, sfxBus, rev);
}

export function sfx(name: SfxName): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  switch (name) {
    case 'gavel':
      knock(t);
      break;
    case 'gavel3':
      knock(t);
      knock(t + 0.24);
      knock(t + 0.48);
      break;
    case 'shout':
      tone(110, t, 0.5, 'sine', 0.75, 0.3, 40);
      hiss(t, 0.3, 0.5, 'lowpass', 1800, 0.7, 0.3);
      tone(880, t, 0.35, 'square', 0.06, 0.4);
      tone(1320, t + 0.02, 0.35, 'square', 0.04, 0.4);
      break;
    case 'damage':
      tone(320, t, 0.4, 'square', 0.1, 0.2, 110);
      hiss(t, 0.2, 0.2, 'bandpass', 900, 2);
      break;
    case 'heal':
      ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone(freqOf(n), t + i * 0.06, 0.3, 'triangle', 0.12, 0.4));
      break;
    case 'reveal':
      ['A2', 'E3', 'A3', 'C4', 'E4'].forEach((n) => tone(freqOf(n), t, 1.8, 'sawtooth', 0.05, 0.5));
      hiss(t, 0.6, 0.35, 'lowpass', 2400, 0.7, 0.5);
      tone(80, t, 0.9, 'sine', 0.6, 0.3, 35);
      break;
    case 'glitch':
      for (let i = 0; i < 9; i++) tone(200 + Math.random() * 2400, t + i * 0.045, 0.04, 'square', 0.05);
      hiss(t, 0.45, 0.18, 'bandpass', 3000, 4);
      break;
    case 'boot':
      ['E5', 'B5', 'E6'].forEach((n, i) => INSTRUMENTS.bell(freqOf(n), t + i * 0.13, 1, 0.08, sfxBus, 0.6));
      break;
    case 'whoosh': {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      const f = filter('bandpass', 400, 1.5);
      f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(5000, t + 0.35);
      noiseSrc(t, t + 0.45).connect(f).connect(g);
      out(g, sfxBus, 0.2);
      break;
    }
    case 'select':
      tone(1250, t, 0.03, 'square', 0.035);
      break;
    case 'open':
    case 'paper': {
      // Paper rustle: two quick filtered noise swishes.
      hiss(t, 0.09, 0.22, 'highpass', 3500, 0.7);
      hiss(t + 0.07, 0.12, 0.16, 'bandpass', 5000, 0.9);
      break;
    }
    case 'close':
      hiss(t, 0.1, 0.18, 'bandpass', 2500, 0.8);
      tone(500, t, 0.06, 'triangle', 0.06);
      break;
    case 'evidence':
      INSTRUMENTS.bell(freqOf('G5'), t, 0.3, 0.09, sfxBus, 0.4);
      INSTRUMENTS.bell(freqOf('D6'), t + 0.11, 0.3, 0.09, sfxBus, 0.4);
      break;
    case 'slam':
      // Hands on the desk: a wooden thud.
      tone(95, t, 0.25, 'sine', 0.7, 0.25, 50);
      hiss(t, 0.12, 0.45, 'lowpass', 900, 1, 0.25);
      hiss(t, 0.05, 0.25, 'bandpass', 2200, 1.5);
      break;
    case 'realize':
      // The "a-ha" chime when something clicks.
      ['E6', 'B6'].forEach((n, i) => INSTRUMENTS.bell(freqOf(n), t + i * 0.09, 0.5, 0.1, sfxBus, 0.5));
      tone(freqOf('E7'), t + 0.18, 0.4, 'sine', 0.04, 0.5);
      break;
    case 'shock': {
      // A low brassy stab for a character's shocked reaction.
      ['A1', 'E2', 'A2', 'C3'].forEach((n) => {
        const f = freqOf(n);
        const g = sus(t, 0.07, 0.01, 0.25, 0.5);
        const lp = filter('lowpass', 900, 1);
        osc('sawtooth', f, t, t + 0.9).connect(lp).connect(g);
        out(g, sfxBus, 0.4);
      });
      hiss(t, 0.2, 0.25, 'lowpass', 1200, 0.7, 0.3);
      break;
    }
    case 'murmur': {
      // The gallery stirs: several overlapping voice-band noise swells.
      for (let i = 0; i < 7; i++) {
        const st = t + Math.random() * 0.9;
        const len = 0.5 + Math.random() * 0.7;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.2, st + len * 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, st + len);
        const f = filter('bandpass', 350 + Math.random() * 500, 3);
        noiseSrc(st, st + len + 0.05).connect(f).connect(g);
        out(g, sfxBus, 0.5);
      }
      break;
    }
    case 'step':
      for (let i = 0; i < 4; i++) {
        const st = t + i * 0.22;
        tone(70 + (i % 2) * 12, st, 0.09, 'sine', 0.35);
        hiss(st, 0.05, 0.12, 'lowpass', 600);
      }
      break;
    case 'door':
      hiss(t, 0.5, 0.18, 'bandpass', 700, 1.2, 0.3);
      tone(120, t + 0.42, 0.25, 'sine', 0.45, 0.3, 70);
      hiss(t + 0.42, 0.08, 0.3, 'bandpass', 1800, 1.4, 0.3);
      break;
    case 'typing':
      for (let i = 0; i < 10; i++) {
        const st = t + i * (0.07 + Math.random() * 0.06);
        hiss(st, 0.025, 0.2, 'bandpass', 2600 + Math.random() * 1500, 2);
      }
      break;
    case 'breakdown': {
      // The culprit falls apart: a dissonant cluster sliding down into a noise swell.
      ['C3', 'C#3', 'F#3', 'G3', 'C4'].forEach((n) => {
        const f = freqOf(n);
        const o = osc('sawtooth', f, t, t + 2.4);
        o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 2.2);
        const g = sus(t, 0.05, 0.02, 1.6, 0.7);
        o.connect(filter('lowpass', 1600, 0.8)).connect(g);
        out(g, sfxBus, 0.6);
      });
      const swell = ctx.createGain();
      swell.gain.setValueAtTime(0.0001, t);
      swell.gain.exponentialRampToValueAtTime(0.5, t + 0.9);
      swell.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      noiseSrc(t, t + 2.5).connect(filter('lowpass', 2500, 0.6)).connect(swell);
      out(swell, sfxBus, 0.6);
      tone(70, t, 1.4, 'sine', 0.7, 0.4, 30);
      break;
    }
    case 'cheer': {
      // Applause and a lifted crowd: dense claps over a bright murmur.
      for (let i = 0; i < 60; i++) {
        const st = t + Math.random() * 2.4;
        hiss(st, 0.03, 0.18 + Math.random() * 0.12, 'bandpass', 1500 + Math.random() * 2500, 1.2, 0.4);
      }
      for (let i = 0; i < 6; i++) {
        const st = t + Math.random() * 0.6;
        const len = 1.4 + Math.random();
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.15, st + 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, st + len);
        noiseSrc(st, st + len + 0.05).connect(filter('bandpass', 600 + Math.random() * 700, 2.5)).connect(g);
        out(g, sfxBus, 0.5);
      }
      break;
    }
    case 'heartbeat':
      tone(60, t, 0.18, 'sine', 0.6, 0.2, 40);
      tone(55, t + 0.24, 0.2, 'sine', 0.45, 0.2, 38);
      break;
    case 'chime':
      // The convenience-store door: ding, dong.
      INSTRUMENTS.bell(freqOf('E6'), t, 0.5, 0.1, sfxBus, 0.35);
      INSTRUMENTS.bell(freqOf('C6'), t + 0.34, 0.5, 0.1, sfxBus, 0.35);
      break;
    case 'watch': {
      // Smartwatch alert: three bright blips over a short buzz on the wrist.
      ['A6', 'C#7', 'E7'].forEach((n, i) => tone(freqOf(n), t + i * 0.075, 0.07, 'sine', 0.16, 0.15));
      const buzz = osc('square', 150, t, t + 0.32);
      const am = osc('square', 28, t, t + 0.32);
      const amGain = ctx.createGain();
      amGain.gain.value = 0.012;
      const g = sus(t, 0.012, 0.01, 0.26, 0.05);
      am.connect(amGain).connect(g.gain);
      buzz.connect(filter('lowpass', 500, 1)).connect(g);
      out(g, sfxBus);
      break;
    }
    case 'shutter': {
      // A rolling shutter: a long metal rattle over a low rumble, ending in a clank.
      for (let i = 0; i < 26; i++) {
        hiss(t + i * 0.045, 0.04, 0.16 * (1 - i / 34), 'bandpass', 1300 + Math.random() * 1100, 2.5, 0.2);
      }
      tone(72, t, 1.2, 'sine', 0.3, 0.2, 60);
      knock(t + 1.2);
      break;
    }
    case 'detect':
      // The camera AI flags something: two sharp beeps and a low buzz.
      [0, 0.16].forEach((d) => {
        tone(1320, t + d, 0.08, 'square', 0.13);
        tone(990, t + d + 0.08, 0.08, 'square', 0.13);
      });
      tone(110, t, 0.4, 'sawtooth', 0.09, 0, 100);
      break;
    case 'tape': {
      // A recorder's play button: click, motor whir, then hiss.
      hiss(t, 0.02, 0.5, 'highpass', 3000, 0.7);
      const whir = osc('triangle', 180, t + 0.03, t + 0.6);
      whir.frequency.exponentialRampToValueAtTime(240, t + 0.4);
      const wg = sus(t + 0.03, 0.08, 0.08, 0.35, 0.15);
      whir.connect(wg);
      out(wg, sfxBus);
      hiss(t + 0.1, 0.9, 0.08, 'highpass', 5000, 0.5);
      break;
    }
    case 'thud':
      // A body against a steel shelf: a dull blow, then the shelf rings.
      tone(58, t, 0.45, 'sine', 0.85, 0.3, 32);
      hiss(t, 0.22, 0.5, 'lowpass', 450, 0.8, 0.3);
      tone(342, t + 0.01, 0.9, 'sine', 0.05, 0.5);
      tone(517, t + 0.01, 0.7, 'sine', 0.035, 0.5);
      tone(1210, t + 0.01, 0.4, 'sine', 0.02, 0.5);
      break;
  }
}

function knock(t: number): void {
  hiss(t, 0.09, 0.6, 'bandpass', 1600, 1.2, 0.45);
  tone(150, t, 0.2, 'sine', 0.55, 0.45, 60);
}

// ---------------------------------------------------------------- music

interface Playing {
  name: BgmName;
  bus: GainNode;
  nextLoop: number;
  loopDur: number;
  stepDur: number;
  steps: number;
  parts: { part: Part; notes: { step: number; len: number; token: string }[]; steps: number }[];
}

let playing: Playing | null = null;

function parse(seq: string) {
  const tokens = seq.trim().split(/\s+/);
  const notes: { step: number; len: number; token: string }[] = [];
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

export function playBgm(name: BgmName | null): void {
  if (!ctx) return;
  if (playing && playing.name === name) return;
  if (playing) {
    const old = playing.bus;
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    setTimeout(() => old.disconnect(), 1500);
    playing = null;
  }
  if (!name) return;
  const track = TRACKS[name];
  const stepDur = 60 / track.bpm / track.div;
  const parts = track.parts.map((part) => ({ part, ...parse(part.seq) }));
  const steps = Math.max(...parts.map((p) => p.steps));
  const b = ctx.createGain();
  b.gain.setValueAtTime(0, ctx.currentTime);
  b.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.4);
  b.connect(musicBus);
  playing = { name, bus: b, stepDur, steps, loopDur: steps * stepDur, nextLoop: ctx.currentTime + 0.12, parts };
  tick();
}

function tick(): void {
  if (!ctx) return;
  scheduleAmbience();
  const p = playing;
  if (!p) return;
  while (p.nextLoop < ctx.currentTime + 0.4) {
    const t0 = p.nextLoop;
    for (const { part, notes, steps } of p.parts) {
      // Shorter parts repeat to fill the loop.
      for (let offset = 0; offset < p.steps; offset += steps) {
        for (const n of notes) {
          const step = offset + n.step;
          if (step >= p.steps) continue;
          playNote(part, n.token, t0 + step * p.stepDur, n.len * p.stepDur, p.bus);
        }
      }
    }
    p.nextLoop += p.loopDur;
  }
}

// ---------------------------------------------------------------- ambience

interface Ambience {
  name: AmbienceName;
  bus: GainNode;
  stop: () => void;
  /** Periodic sounds (clock ticks), scheduled ahead like music. */
  every?: { period: number; next: number; play: (t: number, dest: AudioNode) => void };
}

let amb: Ambience | null = null;

/** A looping room tone for where the scene is: court, lobby, call center, server room, lounge. */
export function playAmbience(name: AmbienceName | null): void {
  if (!ctx) return;
  if (amb && amb.name === name) return;
  if (amb) {
    const old = amb;
    old.bus.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    setTimeout(() => {
      old.stop();
      old.bus.disconnect();
    }, 1500);
    amb = null;
  }
  if (!name) return;
  const t = ctx.currentTime;
  const b = ctx.createGain();
  b.gain.setValueAtTime(0, t);
  b.gain.linearRampToValueAtTime(1, t + 1.2);
  b.connect(ambBus);
  const stops: (() => void)[] = [];
  const bed = (type: BiquadFilterType, freq: number, vol: number, q = 0.7) => {
    const src = noiseSrc(t, t + 3600);
    const g = ctx!.createGain();
    g.gain.value = vol;
    src.connect(filter(type, freq, q)).connect(g).connect(b);
    stops.push(() => src.stop());
  };
  const hum = (freq: number, vol: number) => {
    const o = osc('sine', freq, t, t + 3600);
    const g = ctx!.createGain();
    g.gain.value = vol;
    o.connect(g).connect(b);
    stops.push(() => o.stop());
  };
  const clock = (t0: number, dest: AudioNode) => {
    const g = perc(t0, 0.05, 0.03);
    noiseSrc(t0, t0 + 0.05).connect(filter('bandpass', 3200, 3)).connect(g);
    out(g, dest, 0.2);
  };
  const a: Ambience = { name, bus: b, stop: () => stops.forEach((s) => s()) };
  switch (name) {
    case 'court':
      bed('lowpass', 500, 0.05);
      break;
    case 'lobby':
      bed('bandpass', 900, 0.03, 0.5);
      bed('lowpass', 300, 0.04);
      break;
    case 'clock':
      bed('lowpass', 400, 0.035);
      a.every = { period: 1, next: t + 0.5, play: clock };
      break;
    case 'hum':
      bed('lowpass', 220, 0.12);
      bed('highpass', 6000, 0.008);
      hum(60, 0.025);
      hum(120, 0.012);
      break;
    case 'lounge':
      bed('lowpass', 350, 0.04);
      hum(100, 0.01);
      a.every = { period: 1, next: t + 0.5, play: clock };
      break;
    case 'store':
      // Refrigerated shelves and a fluorescent tube in an empty shop.
      bed('lowpass', 240, 0.07);
      bed('highpass', 7000, 0.005);
      hum(50, 0.03);
      hum(100, 0.012);
      hum(120, 0.004);
      break;
    case 'alley': {
      // Night wind, and a car passing on the main road now and then.
      bed('lowpass', 520, 0.05);
      bed('bandpass', 260, 0.025, 0.6);
      const car = (t0: number, dest: AudioNode) => {
        const g = ctx!.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.09, t0 + 1.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.4);
        noiseSrc(t0, t0 + 3.5).connect(filter('lowpass', 420, 0.7)).connect(g).connect(dest);
      };
      a.every = { period: 11, next: t + 3, play: car };
      break;
    }
    case 'tape':
      // Recorder hiss with a little low rumble from the handling.
      bed('highpass', 4200, 0.03);
      bed('lowpass', 160, 0.04);
      break;
  }
  amb = a;
}

function scheduleAmbience(): void {
  if (!ctx || !amb?.every) return;
  const e = amb.every;
  while (e.next < ctx.currentTime + 0.4) {
    e.play(e.next, amb.bus);
    e.next += e.period;
  }
}
