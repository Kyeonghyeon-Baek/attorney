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
};
