import type { BgmName } from './types';

// Background music as data. Each part is a string of step tokens:
//   "A4"        a note        "A3+C4+E4"  a chord        "-"  hold the previous note
//   "."         rest          "x" / "X" / "o"  drum hit (normal / accent / ghost)
// `div` is steps per beat (2 = eighth notes, 4 = sixteenths). A part shorter than
// the longest one repeats to fill the loop.

export type Inst =
  | 'piano' | 'bell' | 'pad' | 'strings' | 'pluck' | 'lead' | 'bass'
  | 'kick' | 'snare' | 'hat' | 'shaker' | 'rim' | 'crash';

export interface Part {
  inst: Inst;
  vol: number;
  /** Reverb send, 0..1. */
  rev?: number;
  seq: string;
}

export interface Track {
  bpm: number;
  div: number;
  parts: Part[];
}

/**
 * A recorded track overrides the synth one: drop `assets/music/<BgmName>.m4a` (or .mp3/.ogg)
 * in and it plays instead. The file plays from the start once, then repeats loopStart..loopEnd
 * (seconds; without them the whole file loops). `gain` levels it against the synth tracks.
 */
export interface Recording {
  loopStart?: number;
  loopEnd?: number;
  gain?: number;
}

export const RECORDINGS: Partial<Record<BgmName, Recording>> = {
  // Suno v6 cover of the synth track (orchestral, moderato), one steady arrangement throughout.
  // Plays the opening once, then loops the rest.
  cross: { loopStart: 17.506083, gain: 1.14 },
  // The same orchestra, allegro: the late-trial variation of cross.
  crossTense: { loopStart: 35.739167, gain: 1.5 },
};

const bars = (...b: string[]) => b.join(' ');
const rep = (s: string, n: number) => Array(n).fill(s).join(' ');
const hold = (chord: string, steps: number) => [chord, ...Array(steps - 1).fill('-')].join(' ');
const rest = (steps: number) => Array(steps).fill('.').join(' ');
const holds = (chords: string[], steps: number) => chords.map((c) => hold(c, steps)).join(' ');

export const TRACKS: Record<BgmName, Track> = {
  // 법정, 개정 전후. 따뜻한 피아노와 종소리 멜로디.
  trial: {
    bpm: 92, div: 2,
    parts: [
      { inst: 'piano', vol: 0.11, rev: 0.35, seq: bars(
        'D3 A3 D4 F#4 A4 F#4 D4 A3', 'B2 F#3 B3 D4 F#4 D4 B3 F#3',
        'G2 D3 G3 B3 D4 B3 G3 D3', 'A2 E3 A3 C#4 E4 C#4 A3 E3',
        'D3 A3 D4 F#4 A4 F#4 D4 A3', 'B2 F#3 B3 D4 F#4 D4 B3 F#3',
        'E3 B3 E4 G4 B4 G4 E4 B3', 'A2 E3 A3 C#4 E4 C#4 A3 E3') },
      { inst: 'bell', vol: 0.05, rev: 0.5, seq: bars(
        'F#5 - - - E5 - D5 -', 'D5 - - - C#5 - B4 -', 'B4 - D5 - G5 - F#5 -', 'E5 - - - - - . .',
        'F#5 - A5 - D6 - C#6 -', 'B5 - - - A5 - F#5 -', 'G5 - - - F#5 - E5 -', 'E5 - - - C#5 - - -') },
      { inst: 'bass', vol: 0.12, rev: 0.1, seq: holds(['D2', 'B1', 'G1', 'A1', 'D2', 'B1', 'E2', 'A1'], 8) },
      { inst: 'pad', vol: 0.035, rev: 0.6, seq: holds(
        ['D3+F#3+A3', 'B2+D3+F#3', 'G2+B2+D3', 'A2+C#3+E3', 'D3+F#3+A3', 'B2+D3+F#3', 'E3+G3+B3', 'A2+C#3+E3'], 8) },
    ],
  },

  // 증언 (처음 한 번 듣는 동안).
  testimony: {
    bpm: 100, div: 2,
    parts: [
      { inst: 'piano', vol: 0.1, rev: 0.3, seq: bars(
        'E5 - - C5 D5 - E5 -', 'F5 - E5 - D5 - C5 -', 'E5 - - G5 - - E5 -', 'D5 - - - - - . .',
        'E5 - - C5 D5 - E5 -', 'F5 - A5 - G5 - F5 -', 'E5 - D5 - C5 - D5 -', 'B4 - - - G#4 - - -') },
      { inst: 'bass', vol: 0.13, rev: 0.05, seq: bars(
        'A2 . A2 A2 . A2 . E2', 'F2 . F2 F2 . F2 . C2', 'C2 . C2 C2 . C2 . G2', 'G2 . G2 G2 . G2 . D2',
        'A2 . A2 A2 . A2 . E2', 'F2 . F2 F2 . F2 . C2', 'D2 . D2 D2 . D2 . A1', 'E2 . E2 E2 . E2 . B1') },
      { inst: 'pad', vol: 0.03, rev: 0.5, seq: holds(
        ['A2+C3+E3', 'F2+A2+C3', 'C3+E3+G3', 'G2+B2+D3', 'A2+C3+E3', 'F2+A2+C3', 'D3+F3+A3', 'E2+G#2+B2'], 8) },
      { inst: 'kick', vol: 0.32, seq: 'x . . . x . . .' },
      { inst: 'hat', vol: 0.05, seq: '. o . o . o . o' },
      { inst: 'rim', vol: 0.06, rev: 0.2, seq: '. . x . . . x .' },
    ],
  },

  // 반대신문.
  cross: {
    bpm: 132, div: 2,
    parts: [
      { inst: 'lead', vol: 0.05, rev: 0.25, seq: bars(
        'E5 - A5 - G5 E5 D5 -', 'D5 - G5 - F5 D5 B4 -', 'C5 - F5 - E5 C5 A4 -', 'B4 C5 D5 E5 G#5 - - -',
        'A5 - - G5 E5 - C5 -', 'B4 - - D5 G5 - F5 -', 'E5 - F5 E5 D5 - C5 -', 'B4 - G#4 - E4 - - -') },
      { inst: 'bass', vol: 0.14, seq: rep(bars(
        'A2 A2 A3 A2 A2 A2 A3 A2', 'G2 G2 G3 G2 G2 G2 G3 G2',
        'F2 F2 F3 F2 F2 F2 F3 F2', 'E2 E2 E3 E2 E2 E2 E3 E2'), 2) },
      { inst: 'strings', vol: 0.035, rev: 0.45, seq: rep(holds(['A3+C4+E4', 'G3+B3+D4', 'F3+A3+C4', 'E3+G#3+B3'], 8), 2) },
      { inst: 'kick', vol: 0.45, seq: 'x . . . x . . x' },
      { inst: 'snare', vol: 0.16, rev: 0.15, seq: '. . X . . . X .' },
      { inst: 'hat', vol: 0.06, seq: 'x o x o x o x o' },
      { inst: 'crash', vol: 0.08, rev: 0.3, seq: `X ${rest(63)}` },
    ],
  },

  // 추궁. 진실에 다가갈 때.
  pursuit: {
    bpm: 160, div: 2,
    parts: [
      { inst: 'lead', vol: 0.05, rev: 0.2, seq: bars(
        'E5 G5 B5 - A5 G5 F#5 G5', 'E5 G5 C6 - B5 A5 G5 A5',
        'F#5 A5 D6 - C6 B5 A5 B5', 'D#5 - F#5 - B5 - - -') },
      { inst: 'bass', vol: 0.15, seq: bars(
        'E2 E3 E2 E3 E2 E3 E2 E3', 'C2 C3 C2 C3 C2 C3 C2 C3',
        'D2 D3 D2 D3 D2 D3 D2 D3', 'B1 B2 B1 B2 B1 B2 B1 B2') },
      { inst: 'strings', vol: 0.05, rev: 0.3, seq: bars(
        'E3+G3+B3 . . E3+G3+B3 . . E3+G3+B3 .', 'C3+E3+G3 . . C3+E3+G3 . . C3+E3+G3 .',
        'D3+F#3+A3 . . D3+F#3+A3 . . D3+F#3+A3 .', 'B2+D#3+F#3 - - - - - - -') },
      { inst: 'kick', vol: 0.5, seq: 'x . x . x . x .' },
      { inst: 'snare', vol: 0.18, rev: 0.15, seq: '. . X . . . X .' },
      { inst: 'hat', vol: 0.06, seq: 'x x x x x x x x' },
      { inst: 'crash', vol: 0.09, rev: 0.3, seq: `X ${rest(31)}` },
    ],
  },

  // 숨죽인 긴장. 심장 박동.
  suspense: {
    bpm: 66, div: 2,
    parts: [
      { inst: 'pad', vol: 0.06, rev: 0.7, seq: hold('E2+B2+E3', 32) },
      { inst: 'kick', vol: 0.3, seq: 'x . o . . . . .' },
      { inst: 'bell', vol: 0.04, rev: 0.85, seq: bars('. . . . . . B5 .', rest(8), '. . . . A#5 . . .', rest(8)) },
      { inst: 'piano', vol: 0.07, rev: 0.6, seq: bars(rest(8), rest(8), rest(8), '. . . . E2+F2 - - -') },
    ],
  },

  // 다온의 테마. 맑고, 차갑고, 흔들림 없는.
  daon: {
    bpm: 104, div: 4,
    parts: [
      { inst: 'bell', vol: 0.07, rev: 0.6, seq: bars(
        'E5 . B5 . G5 . D6 . E5 . B5 . F#5 . D6 .', 'C5 . G5 . E5 . B5 . C5 . G5 . E5 . D6 .',
        'G4 . D5 . B4 . F#5 . G4 . D5 . B4 . A5 .', 'D5 . A5 . F#5 . B5 . D5 . A5 . F#5 . E5 .') },
      { inst: 'pad', vol: 0.055, rev: 0.7, seq: holds(['E3+B3+D4+F#4', 'C3+G3+B3+E4', 'G2+D3+B3+F#4', 'D3+A3+B3+F#4'], 16) },
      { inst: 'bass', vol: 0.11, seq: bars(
        'E2 . . . . . . . E2 . . . . . . .', 'C2 . . . . . . . C2 . . . . . . .',
        'G1 . . . . . . . G1 . . . . . . .', 'D2 . . . . . . . D2 . . . . . . .') },
      { inst: 'hat', vol: 0.03, seq: 'o . . . o . . . o . . . o . o .' },
    ],
  },

  // 조사: 누리랩 로비. 가볍고 호기심 많은.
  investigate: {
    bpm: 112, div: 2,
    parts: [
      { inst: 'pluck', vol: 0.09, rev: 0.25, seq: bars(
        'C5 . A4 C5 F5 - E5 .', 'D5 . A4 D5 F5 - E5 D5',
        'D5 . Bb4 D5 F5 - G5 .', 'E5 - C5 - G4 - . .') },
      { inst: 'bass', vol: 0.12, seq: bars(
        'F2 . C3 . F2 . C3 .', 'D2 . A2 . D2 . A2 .', 'Bb1 . F2 . Bb1 . F2 .', 'C2 . G2 . C2 . G2 .') },
      { inst: 'pad', vol: 0.025, rev: 0.5, seq: holds(['F3+A3+C4', 'D3+F3+A3', 'Bb2+D3+F3', 'C3+E3+G3'], 8) },
      { inst: 'shaker', vol: 0.05, seq: 'x o x o x o x o' },
      { inst: 'rim', vol: 0.05, rev: 0.2, seq: '. . x . . . x .' },
      { inst: 'kick', vol: 0.25, seq: 'x . . . x . . .' },
    ],
  },

  // 조사: 사람이 떠난 고객센터. 외로운 피아노.
  emptyroom: {
    bpm: 72, div: 2,
    parts: [
      { inst: 'piano', vol: 0.16, rev: 0.6, seq: bars(
        'G4 - - - Eb5 - D5 -', 'C5 - - - - - . .', 'Bb4 - - - G4 - Bb4 -', 'D5 - - - - - . .',
        'G4 - - - Eb5 - F5 -', 'G5 - - - Eb5 - C5 -', 'Ab4 - - - C5 - F5 -', 'D5 - - - B4 - - -') },
      { inst: 'piano', vol: 0.09, rev: 0.6, seq: holds(
        ['C3+G3+Eb4', 'Ab2+Eb3+C4', 'Eb3+Bb3+G4', 'Bb2+F3+D4', 'C3+G3+Eb4', 'Ab2+Eb3+C4', 'F2+C3+Ab3', 'G2+D3+B3'], 8) },
      { inst: 'pad', vol: 0.04, rev: 0.7, seq: holds(['C3+Eb3+G3', 'Ab2+C3+Eb3', 'Eb3+G3+Bb3', 'Bb2+D3+F3', 'C3+Eb3+G3', 'Ab2+C3+Eb3', 'F2+Ab2+C3', 'G2+B2+D3'], 8) },
    ],
  },

  // 조사: 서버실. 차가운 아르페지오와 낮은 맥박.
  serverroom: {
    bpm: 96, div: 4,
    parts: [
      { inst: 'pluck', vol: 0.08, rev: 0.4, seq: bars(
        'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 F4 D4 F4 A4 F4',
        'Bb3 D4 F4 Bb4 F4 D4 Bb3 D4 F4 Bb4 F4 D4 Bb3 D4 F4 D4',
        'C4 E4 G4 C5 G4 E4 C4 E4 G4 C5 G4 E4 C4 E4 G4 E4',
        'A3 C#4 E4 A4 E4 C#4 A3 C#4 E4 A4 E4 C#4 A3 C#4 E4 C#4') },
      { inst: 'bass', vol: 0.15, seq: bars(
        'D2 . . . D2 . . . D2 . . . D2 . . .', 'Bb1 . . . Bb1 . . . Bb1 . . . Bb1 . . .',
        'C2 . . . C2 . . . C2 . . . C2 . . .', 'A1 . . . A1 . . . A1 . . . A1 . . .') },
      { inst: 'bell', vol: 0.06, rev: 0.8, seq: bars(`A5 ${rest(15)}`, rest(16), `${rest(8)} E5 ${rest(7)}`, rest(16)) },
      { inst: 'hat', vol: 0.03, seq: 'o . o o o . o o o . o o o . o o' },
      { inst: 'pad', vol: 0.025, rev: 0.6, seq: hold('D3+A3', 64) },
    ],
  },

  // 진범을 몰아붙일 때. 추궁보다 한 단계 더 빠르고 무겁게.
  cornered: {
    bpm: 150, div: 2,
    parts: [
      { inst: 'lead', vol: 0.05, rev: 0.2, seq: bars(
        'D5 - F5 - A5 G5 F5 E5', 'D5 - F5 - A5 Bb5 A5 G5',
        'F5 - A5 - C6 Bb5 A5 G5', 'A5 - G5 - F5 - E5 -') },
      { inst: 'bass', vol: 0.16, seq: bars(
        'D2 D3 D2 D3 D2 D3 D2 D3', 'Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2',
        'F2 F3 F2 F3 F2 F3 F2 F3', 'A1 A2 A1 A2 A1 A2 A1 A2') },
      { inst: 'strings', vol: 0.05, rev: 0.3, seq: bars(
        'D3+F3+A3 . D3+F3+A3 . . D3+F3+A3 . .', 'Bb2+D3+F3 . Bb2+D3+F3 . . Bb2+D3+F3 . .',
        'F3+A3+C4 . F3+A3+C4 . . F3+A3+C4 . .', 'A2+C#3+E3 - - - A2+C#3+E3 - - -') },
      { inst: 'kick', vol: 0.5, seq: 'x . x x x . x .' },
      { inst: 'snare', vol: 0.18, rev: 0.15, seq: '. . X . . . X x' },
      { inst: 'hat', vol: 0.06, seq: 'x x x x x x x x' },
      { inst: 'crash', vol: 0.09, rev: 0.3, seq: `X ${rest(31)}` },
    ],
  },

  // 무죄. 밝은 팡파르.
  victory: {
    bpm: 128, div: 2,
    parts: [
      { inst: 'lead', vol: 0.05, rev: 0.3, seq: bars(
        'C5 - E5 G5 C6 - - -', 'B5 - A5 - G5 - E5 -', 'F5 - A5 C6 F6 - E6 D6', 'C6 - - - G5 - C6 -') },
      { inst: 'strings', vol: 0.045, rev: 0.4, seq: holds(['C4+E4+G4', 'E3+G3+B3', 'F3+A3+C4', 'G3+B3+D4'], 8) },
      { inst: 'bass', vol: 0.14, seq: bars('C2 . C3 . C2 . C3 .', 'E2 . E3 . E2 . E3 .', 'F2 . F3 . F2 . F3 .', 'G2 . G3 . G2 . G3 .') },
      { inst: 'bell', vol: 0.035, rev: 0.5, seq: bars('. . . . . . G6 .', '. . . . . . E6 .', '. . . . . . A6 .', '. . . . . . B6 .') },
      { inst: 'kick', vol: 0.4, seq: 'x . . . x . . .' },
      { inst: 'snare', vol: 0.14, rev: 0.2, seq: '. . x . . . x .' },
      { inst: 'hat', vol: 0.05, seq: 'x o x o x o x o' },
      { inst: 'crash', vol: 0.08, rev: 0.3, seq: `X ${rest(31)}` },
    ],
  },

  // 에필로그. 조용하고 희망적인.
  ending: {
    bpm: 84, div: 2,
    parts: [
      { inst: 'piano', vol: 0.1, rev: 0.5, seq: bars(
        'G2 D3 G3 B3 D4 B3 G3 D3', 'D2 A2 D3 F#3 A3 F#3 D3 A2', 'E2 B2 E3 G3 B3 G3 E3 B2', 'C2 G2 C3 E3 G3 E3 C3 G2',
        'G2 D3 G3 B3 D4 B3 G3 D3', 'D2 A2 D3 F#3 A3 F#3 D3 A2', 'C2 G2 C3 E3 G3 E3 C3 G2', 'D2 A2 D3 F#3 A3 F#3 D3 A2') },
      { inst: 'bell', vol: 0.05, rev: 0.55, seq: bars(
        'B4 - D5 - G5 - F#5 E5', 'D5 - - - A4 - - -', 'G4 - B4 - E5 - D5 C5', 'B4 - - - - - . .',
        'B4 - D5 - G5 - A5 B5', 'A5 - - - F#5 - D5 -', 'E5 - G5 - E5 - C5 -', 'D5 - - - - - - -') },
      { inst: 'strings', vol: 0.03, rev: 0.6, seq: holds(['G3+B3+D4', 'D3+F#3+A3', 'E3+G3+B3', 'C3+E3+G3', 'G3+B3+D4', 'D3+F#3+A3', 'C3+E3+G3', 'D3+F#3+A3'], 8) },
    ],
  },

  // 모녀, 슬픔, 대기실.
  sorrow: {
    bpm: 68, div: 2,
    parts: [
      { inst: 'strings', vol: 0.08, rev: 0.6, seq: bars(
        'A4 - - - C5 - Bb4 A4', 'G4 - - - - - E4 -', 'F4 - - - A4 - D5 -', 'C5 - - - - - . .',
        'A4 - - - C5 - F5 -', 'E5 - - - D5 - C5 -', 'D5 - C5 - Bb4 - A4 -', 'G4 - - - - - - -') },
      { inst: 'piano', vol: 0.12, rev: 0.5, seq: bars(
        'F2 C3 F3 A3 C4 A3 F3 C3', 'E2 C3 E3 G3 C4 G3 E3 C3', 'D2 A2 D3 F3 A3 F3 D3 A2', 'Bb1 F2 Bb2 D3 F3 D3 Bb2 F2',
        'F2 C3 F3 A3 C4 A3 F3 C3', 'C2 G2 C3 E3 G3 E3 C3 G2', 'Bb1 F2 Bb2 D3 F3 D3 Bb2 F2', 'C2 G2 C3 E3 G3 E3 C3 G2') },
      { inst: 'pad', vol: 0.04, rev: 0.7, seq: holds(['F3+A3+C4', 'E3+G3+C4', 'D3+F3+A3', 'Bb2+D3+F3', 'F3+A3+C4', 'C3+E3+G3', 'Bb2+D3+F3', 'C3+E3+G3'], 8) },
    ],
  },

  // 타이틀, 사건 기록부. 시리즈의 주제: 판을 뒤집는 순간을 향해 가는 오음음계 팡파르.
  title: {
    bpm: 104, div: 2,
    parts: [
      { inst: 'lead', vol: 0.045, rev: 0.35, seq: bars(
        'A4 - D5 - E5 - F#5 -', 'A5 - - - F#5 E5 D5 -', 'B4 - D5 - E5 - D5 B4', 'A4 - - - - - . .',
        'A4 - D5 - E5 - F#5 A5', 'B5 - - - A5 - F#5 -', 'E5 - F#5 E5 D5 - B4 -', 'D5 - - - - - . .') },
      { inst: 'bell', vol: 0.03, rev: 0.6, seq: bars(
        'A5 . . . . . . .', 'A6 . . . . . . .', 'B5 . . . . . . .', 'A5 . . . E6 . . .',
        'A5 . . . . . . .', 'B6 . . . . . . .', 'E6 . . . . . . .', 'D6 . . . A5 . D6 .') },
      { inst: 'strings', vol: 0.04, rev: 0.5, seq: holds(
        ['D3+F#3+A3', 'F#2+A2+C#3', 'G2+B2+D3', 'A2+C#3+E3', 'D3+F#3+A3', 'B2+D3+F#3', 'A2+C#3+E3', 'D3+F#3+A3'], 8) },
      { inst: 'bass', vol: 0.13, seq: bars(
        'D2 . D2 . A2 . D2 .', 'F#2 . F#2 . C#3 . F#2 .', 'G2 . G2 . D3 . G2 .', 'A2 . A2 . E2 . A2 .',
        'D2 . D2 . A2 . D2 .', 'B1 . B1 . F#2 . B1 .', 'A1 . A1 . E2 . A1 .', 'D2 . A2 . D2 . . .') },
      { inst: 'kick', vol: 0.32, seq: 'x . . x x . . .' },
      { inst: 'snare', vol: 0.12, rev: 0.2, seq: '. . X . . . X .' },
      { inst: 'shaker', vol: 0.04, seq: 'x o x o x o x o' },
      { inst: 'crash', vol: 0.07, rev: 0.3, seq: `X ${rest(63)}` },
    ],
  },

  // 1화 프롤로그: 새벽 두 시 반의 무인 편의점. 냉장고 소리 같은 로파이.
  night: {
    bpm: 74, div: 2,
    parts: [
      { inst: 'piano', vol: 0.1, rev: 0.55, seq: holds(['F3+A3+C4+E4', 'E3+G3+B3+D4', 'D3+F3+A3+C4', 'C3+E3+G3+B3'], 8) },
      { inst: 'bell', vol: 0.065, rev: 0.6, seq: bars(
        '. . A5 - G5 - E5 -', '. . G5 - E5 - D5 -', '. . F5 - E5 - C5 -', 'D5 - - - - - . .') },
      { inst: 'bass', vol: 0.14, seq: bars('F2 . . . . . C2 .', 'E2 . . . . . B1 .', 'D2 . . . . . A1 .', 'C2 . . . . . G1 .') },
      { inst: 'kick', vol: 0.18, seq: 'x . . . . . x .' },
      { inst: 'rim', vol: 0.04, rev: 0.3, seq: '. . x . . . x .' },
      { inst: 'shaker', vol: 0.025, seq: 'x o . o x o . o' },
    ],
  },

  // 오정택의 테마: 매끈한 영업용 미소. 걸어 다니는 베이스와 톡톡 끊는 멜로디.
  oh: {
    bpm: 118, div: 2,
    parts: [
      { inst: 'pluck', vol: 0.085, rev: 0.25, seq: bars(
        'D5 . Bb4 . G4 . A4 Bb4', 'C5 . . Bb4 A4 . F#4 .', 'G4 . Bb4 . Eb5 . D5 C5', 'D5 . . . A4 . . .',
        'D5 . Bb4 . G4 . A4 Bb4', 'C5 . Eb5 . D5 . C5 Bb4', 'A4 . C5 . F#4 . A4 .', 'G4 . . . . . . .') },
      { inst: 'bass', vol: 0.14, seq: bars(
        'G2 - Bb2 - C3 - C#3 -', 'D3 - C3 - Bb2 - A2 -', 'Eb2 - G2 - Bb2 - B2 -', 'C3 - Bb2 - A2 - D2 -',
        'G2 - Bb2 - C3 - C#3 -', 'D3 - C3 - Bb2 - A2 -', 'D2 - F#2 - A2 - C3 -', 'G2 - D2 - G2 - . .') },
      { inst: 'piano', vol: 0.06, rev: 0.3, seq: bars(
        '. . G3+Bb3+D4 . . . G3+Bb3+D4 .', '. . D3+F#3+C4 . . . D3+F#3+C4 .',
        '. . Eb3+G3+Bb3 . . . Eb3+G3+Bb3 .', '. . C3+Eb3+G3 . . . D3+F#3+A3 .',
        '. . G3+Bb3+D4 . . . G3+Bb3+D4 .', '. . C3+Eb3+G3 . . . C3+Eb3+G3 .',
        '. . D3+F#3+C4 . . . D3+F#3+C4 .', '. . G3+Bb3+D4 . . . . .') },
      { inst: 'bell', vol: 0.025, rev: 0.6, seq: bars(rest(8), '. . . . . . G6 .', rest(8), '. . . . . . D6 .') },
      { inst: 'kick', vol: 0.26, seq: 'x . . . x . . .' },
      { inst: 'rim', vol: 0.06, rev: 0.2, seq: '. . x . . . x .' },
      { inst: 'hat', vol: 0.04, seq: 'x o x o x o x o' },
    ],
  },

  // 1화의 정(情): 폐기 삼각김밥과 골목 할머니. 가야금 같은 뜯는 소리, 굿거리처럼 셋씩 흔들리는 박.
  jeong: {
    bpm: 62, div: 3,
    parts: [
      { inst: 'pluck', vol: 0.14, rev: 0.45, seq: bars(
        'D5 - E5 D5 B4 -', 'A4 - B4 G4 - -', 'E4 - G4 A4 B4 -', 'D5 - - - - -',
        'E5 - G5 E5 D5 -', 'B4 - D5 B4 A4 -', 'G4 - A4 B4 - D5', 'G4 - - - - -') },
      { inst: 'piano', vol: 0.1, rev: 0.5, seq: bars(
        'G2 D3 G3 B3 G3 D3', 'E2 B2 E3 G3 E3 B2', 'C2 G2 C3 E3 C3 G2', 'D2 A2 D3 F#3 D3 A2',
        'C2 G2 C3 E3 C3 G2', 'B1 F#2 B2 D3 B2 F#2', 'A1 E2 A2 C3 A2 E2', 'G2 D3 G3 B3 G3 D3') },
      { inst: 'strings', vol: 0.05, rev: 0.6, seq: holds(
        ['G3+B3+D4', 'E3+G3+B3', 'C3+E3+G3', 'D3+F#3+A3', 'C3+E3+G3', 'B2+D3+F#3', 'A2+C3+E3', 'G3+B3+D4'], 6) },
      { inst: 'bell', vol: 0.03, rev: 0.7, seq: bars(rest(6), rest(6), rest(6), '. . . A5 . .', rest(6), rest(6), rest(6), '. . . G5 . .') },
    ],
  },

  // 엄정한의 테마: 차갑고 정확한 초침. 모두진술과 검찰의 공세에.
  eom: {
    bpm: 104, div: 4,
    parts: [
      { inst: 'piano', vol: 0.11, rev: 0.35, seq: bars(
        'C5 . . G4 . . Eb5 . D5 . . . . . . .', 'C5 . . G4 . . Ab5 . G5 . . . . . . .',
        'F5 . . C5 . . Eb5 . D5 . . C5 . . B4 .', 'C5 . . . . . . . G4 . . . B4 . . .') },
      { inst: 'strings', vol: 0.045, rev: 0.5, seq: holds(['C3+Eb3+G3', 'Ab2+C3+Eb3', 'F2+Ab2+C3', 'G2+B2+D3'], 16) },
      { inst: 'bass', vol: 0.13, seq: bars(
        'C2 . . . C3 . . . C2 . . . C3 . . .', 'Ab1 . . . Ab2 . . . Ab1 . . . Ab2 . . .',
        'F1 . . . F2 . . . F1 . . . F2 . . .', 'G1 . . . G2 . . . G1 . . . B1 . . .') },
      { inst: 'bell', vol: 0.03, rev: 0.7, seq: bars(`G6 ${rest(15)}`, rest(16), `Eb6 ${rest(15)}`, rest(16)) },
      { inst: 'hat', vol: 0.04, seq: 'x . o . x . o . x . o . x . o .' },
      { inst: 'kick', vol: 0.28, seq: `x ${rest(7)} x ${rest(7)}` },
      { inst: 'rim', vol: 0.05, rev: 0.25, seq: `${rest(4)} x ${rest(7)} x ${rest(2)}` },
    ],
  },

  // 반전. 올바른 증거가 꽂히고 증인이 흔들리는 순간부터.
  objection: {
    bpm: 152, div: 2,
    parts: [
      { inst: 'lead', vol: 0.05, rev: 0.25, seq: bars(
        'D5 - F#5 - A5 - - B5', 'A5 - F#5 - D5 - E5 -', 'G5 - - - F#5 - E5 -', 'F#5 - - - - - . .',
        'D5 - F#5 - A5 - - D6', 'C#6 - B5 - A5 - G5 -', 'F#5 - G5 - A5 - E5 -', 'D5 - - - - - . .') },
      { inst: 'strings', vol: 0.045, rev: 0.3, seq: bars(
        'D3+F#3+A3 . . D3+F#3+A3 . . D3+F#3+A3 .', 'A2+C#3+E3 . . A2+C#3+E3 . . A2+C#3+E3 .',
        'G2+B2+D3 . . G2+B2+D3 . . G2+B2+D3 .', 'D3+F#3+A3 - - - D3+F#3+A3 . . .',
        'D3+F#3+A3 . . D3+F#3+A3 . . D3+F#3+A3 .', 'A2+C#3+E3 . . A2+C#3+E3 . . A2+C#3+E3 .',
        'G2+B2+D3 . . G2+B2+D3 . A2+C#3+E3 . .', 'D3+F#3+A3 - - - - - - -') },
      { inst: 'bass', vol: 0.15, seq: bars(
        'D2 D2 D3 D2 D2 D2 D3 D2', 'A1 A1 A2 A1 A1 A1 A2 A1', 'G1 G1 G2 G1 G1 G1 G2 G1', 'D2 D2 D3 D2 D2 D2 D3 D2',
        'D2 D2 D3 D2 D2 D2 D3 D2', 'A1 A1 A2 A1 A1 A1 A2 A1', 'G1 G1 G2 G1 A1 A1 A2 A1', 'D2 D2 D3 D2 D2 . D2 .') },
      { inst: 'bell', vol: 0.03, rev: 0.5, seq: bars(rest(8), rest(8), rest(8), '. . . . A6 . D7 .') },
      { inst: 'kick', vol: 0.5, seq: 'x . x . x . x .' },
      { inst: 'snare', vol: 0.17, rev: 0.15, seq: '. . X . . . X .' },
      { inst: 'hat', vol: 0.06, seq: 'x x x x x x x x' },
      { inst: 'crash', vol: 0.09, rev: 0.3, seq: `X ${rest(31)}` },
    ],
  },
  // 1화 후반 반대신문: 같은 동기를 한 음 올려, 옥타브로 펌핑하는 베이스와 마디 끝 스네어 롤로 몰아붙인다.
  // 뒷 네 마디는 더 높이 올라가 딸림화음에서 숨을 멈춘다.
  crossTense: {
    bpm: 144, div: 2,
    parts: [
      { inst: 'lead', vol: 0.05, rev: 0.25, seq: bars(
        'F#5 - B5 - A5 F#5 E5 -', 'E5 - A5 - G5 E5 C#5 -', 'D5 - G5 - F#5 D5 B4 -', 'C#5 D5 E5 F#5 A#5 - - -',
        'B5 - C#6 D6 F#6 - E6 D6', 'C#6 - A5 - E6 - D6 C#6', 'B5 - D6 B5 F#5 - G5 A5', 'A#5 - F#5 - A#5 - C#6 -') },
      { inst: 'pluck', vol: 0.05, rev: 0.2, seq: rep(bars(
        'B3 D4 F#4 D4 B3 D4 F#4 D4', 'A3 C#4 E4 C#4 A3 C#4 E4 C#4',
        'G3 B3 D4 B3 G3 B3 D4 B3', 'F#3 A#3 C#4 A#3 F#3 A#3 C#4 E4'), 2) },
      { inst: 'bass', vol: 0.15, seq: rep(bars(
        'B1 B2 B1 B2 B1 B2 B1 B2', 'A1 A2 A1 A2 A1 A2 A1 A2',
        'G1 G2 G1 G2 G1 G2 G1 G2', 'F#1 F#2 F#1 F#2 F#1 F#2 A#1 C#2'), 2) },
      { inst: 'strings', vol: 0.04, rev: 0.4, seq: rep(bars(
        'B2+D3+F#3 . . B2+D3+F#3 . . B2+D3+F#3 .', 'A2+C#3+E3 . . A2+C#3+E3 . . A2+C#3+E3 .',
        'G2+B2+D3 . . G2+B2+D3 . . G2+B2+D3 .', 'F#2+A#2+C#3 - - - F#2+A#2+C#3 - - -'), 2) },
      { inst: 'kick', vol: 0.48, seq: 'x . x . x . x .' },
      { inst: 'snare', vol: 0.16, rev: 0.15, seq: bars(rep('. . X . . . X .', 3), '. . X . X x X X') },
      { inst: 'hat', vol: 0.06, seq: 'x o x x x o x x' },
      { inst: 'crash', vol: 0.09, rev: 0.3, seq: `X ${rest(31)}` },
    ],
  },

  // 1화 후반 증언: 같은 멜로디 위로 반음씩 내려앉는 베이스. 평온한 척하는 목소리 아래의 균열.
  testimonyTense: {
    bpm: 108, div: 2,
    parts: [
      { inst: 'piano', vol: 0.1, rev: 0.3, seq: bars(
        'E5 - - C5 D5 - E5 -', 'F5 - E5 - D5 - C5 -', 'E5 - - G5 - - E5 -', 'D#5 - - - - - . .',
        'E5 - - C5 D5 - E5 -', 'F5 - A5 - G5 - F5 -', 'E5 - D#5 - D5 - C5 -', 'B4 - - - G#4 - - -') },
      { inst: 'bass', vol: 0.13, rev: 0.05, seq: bars(
        'A2 . A2 A2 . A2 . A2', 'G#2 . G#2 G#2 . G#2 . G#2', 'G2 . G2 G2 . G2 . G2', 'F#2 . F#2 F#2 . F#2 . F#2',
        'F2 . F2 F2 . F2 . F2', 'D2 . D2 D2 . D2 . D2', 'E2 . E2 E2 . E2 . E2', 'E2 . E2 . E1 . E2 .') },
      { inst: 'pad', vol: 0.03, rev: 0.5, seq: holds(
        ['A2+C3+E3', 'G#2+C3+E3', 'G2+C3+E3', 'F#2+A2+D#3', 'F2+A2+C3', 'D2+F2+A2', 'E2+G#2+B2', 'E2+G#2+B2'], 8) },
      { inst: 'kick', vol: 0.3, seq: 'x . . x x . . .' },
      { inst: 'hat', vol: 0.05, seq: 'x o o x x o o x' },
      { inst: 'rim', vol: 0.07, rev: 0.2, seq: '. . x . . . x .' },
    ],
  },

  // 1화 16:00, 진상 직전: 느린 심장 박동 같은 16분음 베이스 위로 현이 한 계단씩 올라간다. 아직 터지지 않는다.
  climax: {
    bpm: 96, div: 4,
    parts: [
      { inst: 'bass', vol: 0.13, seq: bars(
        'D2 . D2 . D2 . D2 . D2 . D2 . D2 . D2 .', 'Bb1 . Bb1 . Bb1 . Bb1 . Bb1 . Bb1 . Bb1 . Bb1 .',
        'G1 . G1 . G1 . G1 . G1 . G1 . G1 . G1 .', 'A1 . A1 . A1 . A1 . A1 . A1 . C#2 . E2 .') },
      { inst: 'strings', vol: 0.05, rev: 0.55, seq: bars(
        hold('D3+F3+A3', 16), hold('D3+F3+Bb3', 16), hold('D3+G3+Bb3', 16), hold('C#3+E3+A3', 8), hold('E3+G3+C#4', 8),
        hold('F3+A3+D4', 16), hold('F3+Bb3+D4', 16), hold('G3+Bb3+E4', 16), hold('A3+C#4+E4', 8), hold('A3+E4+G4', 8)) },
      { inst: 'piano', vol: 0.08, rev: 0.45, seq: bars(
        'D5 . . . A4 . . . F5 . . . E5 . . .', 'D5 . . . Bb4 . . . F5 . . . G5 . . .',
        'G5 . . . D5 . . . Bb5 . . . A5 . . .', 'A5 . . . . . . . G5 . . . E5 . C#5 .',
        'F5 . . . D5 . . . A5 . . . G5 . . .', 'F5 . . . D5 . . . Bb5 . . . A5 . . .',
        'Bb5 . . . G5 . . . E6 . . . D6 . . .', 'C#6 . . . . . . . E6 . . . A5 . . .') },
      { inst: 'bell', vol: 0.03, rev: 0.75, seq: bars(`A6 ${rest(15)}`, rest(16), `D7 ${rest(15)}`, rest(16)) },
      { inst: 'kick', vol: 0.34, seq: `x ${rest(3)} x ${rest(3)} ${rest(4)} x ${rest(3)}` },
      { inst: 'shaker', vol: 0.025, seq: 'x . o . x . o . x . o . x . o .' },
      { inst: 'snare', vol: 0.12, rev: 0.3, seq: bars(rest(16), rest(16), rest(16), `${rest(8)} x . x . X x X X`) },
    ],
  },

  // 1화 추궁: 마지막 한 방. 타이틀의 "판을 뒤집는" 오음음계 동기(A–D–E–F#)를 빠르고 높게 펼친다.
  // 16마디, 뒤 8마디는 한 옥타브 위에서 같은 길을 다시 달려 으뜸화음으로 내려앉는다.
  pursuitTruth: {
    bpm: 168, div: 2,
    parts: [
      { inst: 'lead', vol: 0.055, rev: 0.25, seq: bars(
        'A4 - D5 - E5 - F#5 -', 'G5 - - - E5 - C5 -', 'D5 - G5 - A5 - B5 -', 'C#6 - - - A5 - - -',
        'B5 - A5 - F#5 - D5 -', 'G5 - F#5 - E5 - D5 -', 'E5 - F#5 - G5 - B5 -', 'A5 - - - - - . .',
        'A5 - D6 - C#6 - A5 -', 'G5 - C6 - B5 - G5 -', 'B5 - D6 - E6 - D6 -', 'C#6 - E6 - A5 - C#6 -',
        'D6 - - - C#6 - B5 -', 'B5 - - - A5 - G5 -', 'A5 - B5 - C#6 - E6 -', 'D6 - - - - - . .') },
      { inst: 'bell', vol: 0.03, rev: 0.5, seq: bars(
        rest(8), rest(8), rest(8), '. . . . E6 . A6 .', rest(8), rest(8), rest(8), '. . . . A6 . C#7 .',
        rest(8), rest(8), rest(8), '. . . . E6 . A6 .', rest(8), rest(8), rest(8), '. . . . D7 . . .') },
      { inst: 'bass', vol: 0.16, seq: bars(
        'D2 D3 D2 D3 D2 D3 D2 D3', 'C2 C3 C2 C3 C2 C3 C2 C3', 'G1 G2 G1 G2 G1 G2 G1 G2', 'A1 A2 A1 A2 A1 A2 A1 A2',
        'B1 B2 B1 B2 B1 B2 B1 B2', 'G1 G2 G1 G2 G1 G2 G1 G2', 'E2 E3 E2 E3 E2 E3 E2 E3', 'A1 A2 A1 A2 A1 A2 C#2 E2',
        'D2 D3 D2 D3 D2 D3 D2 D3', 'C2 C3 C2 C3 C2 C3 C2 C3', 'G1 G2 G1 G2 G1 G2 G1 G2', 'A1 A2 A1 A2 A1 A2 A1 A2',
        'B1 B2 B1 B2 B1 B2 B1 B2', 'G1 G2 G1 G2 G1 G2 G1 G2', 'A1 A2 A1 A2 A1 A2 A1 A2', 'D2 D3 D2 D3 D2 . D2 .') },
      { inst: 'strings', vol: 0.05, rev: 0.35, seq: bars(
        'D3+F#3+A3 . . D3+F#3+A3 . . D3+F#3+A3 .', 'C3+E3+G3 . . C3+E3+G3 . . C3+E3+G3 .',
        'G2+B2+D3 . . G2+B2+D3 . . G2+B2+D3 .', 'A2+C#3+E3 - - - A2+C#3+E3 - - -',
        'B2+D3+F#3 . . B2+D3+F#3 . . B2+D3+F#3 .', 'G2+B2+D3 . . G2+B2+D3 . . G2+B2+D3 .',
        'E3+G3+B3 . . E3+G3+B3 . . E3+G3+B3 .', 'A2+C#3+E3 - - - A2+C#3+E3 - - -',
        'D3+F#3+A3 . . D3+F#3+A3 . . D3+F#3+A3 .', 'C3+E3+G3 . . C3+E3+G3 . . C3+E3+G3 .',
        'G2+B2+D3 . . G2+B2+D3 . . G2+B2+D3 .', 'A2+C#3+E3 - - - A2+C#3+E3 - - -',
        'B2+D3+F#3 . . B2+D3+F#3 . . B2+D3+F#3 .', 'G2+B2+D3 . . G2+B2+D3 . . G2+B2+D3 .',
        'A2+C#3+E3 . . A2+C#3+E3 . . A2+C#3+E3 .', 'D3+F#3+A3 - - - - - - -') },
      { inst: 'kick', vol: 0.52, seq: 'x . x . x . x .' },
      { inst: 'snare', vol: 0.18, rev: 0.15, seq: bars(rep('. . X . . . X .', 7), '. . X . X x X X') },
      { inst: 'hat', vol: 0.065, seq: 'x x x x x x x x' },
      { inst: 'crash', vol: 0.1, rev: 0.3, seq: `X ${rest(63)}` },
    ],
  },

  // 1화 피고인 대기실: 휴정의 숨 돌림. 따뜻한 로파이 피아노와 느슨한 림샷.
  waitroom: {
    bpm: 80, div: 2,
    parts: [
      { inst: 'piano', vol: 0.1, rev: 0.45, seq: bars(
        'F3+A3+C4+E4 . . . . . A3+C4+E4 .', 'E3+G3+B3+D4 . . . . . G3+B3+D4 .',
        'D3+F3+A3+C4 . . . . . F3+A3+C4 .', 'G2+B2+D3+F3 . . . . . C3+E3+G3 .') },
      { inst: 'bell', vol: 0.045, rev: 0.6, seq: bars(
        'C5 - A4 - C5 D5 E5 -', 'D5 - B4 - G4 - . .', 'A4 - C5 - F5 - E5 D5', 'D5 - - - C5 - . .',
        'C5 - A4 - C5 D5 E5 G5', 'F5 - E5 - D5 - B4 -', 'C5 - D5 - A4 - F4 -', 'G4 - - - - - . .') },
      { inst: 'bass', vol: 0.12, seq: bars('F2 . . . C3 . . .', 'E2 . . . B2 . . .', 'D2 . . . A2 . . .', 'G1 . . . G2 . C2 .') },
      { inst: 'kick', vol: 0.2, seq: 'x . . . . . x .' },
      { inst: 'rim', vol: 0.05, rev: 0.25, seq: '. . x . . . x .' },
      { inst: 'shaker', vol: 0.025, seq: 'x o x o x o x o' },
    ],
  },
};
