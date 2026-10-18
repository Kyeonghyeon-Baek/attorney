export type Action =
  | 'advance' | 'left' | 'right' | 'up' | 'down'
  | 'press' | 'present' | 'record' | 'back' | 'tab' | 'hint' | 'restart'
  | 'n1' | 'n2' | 'n3' | 'n4';

type Handler = (a: Action) => void;

interface Entry {
  fn: Handler;
  /**
   * Choice screens (menus, the court record when presenting, map picks) only take a fresh key press:
   * auto-repeat is ignored, and a key that was already held when the screen opened is ignored until
   * it is released. Mashing Enter through dialogue can then never pick an answer by itself.
   */
  strict: boolean;
  blocked: Set<string>;
}

// Only the handler on top of the stack receives actions, so an open overlay
// (court record, question menu) naturally blocks the dialogue underneath it.
const stack: Entry[] = [];

// Keys physically down right now, by KeyboardEvent.code.
const held = new Set<string>();

function remover(list: Entry[], entry: Entry): () => void {
  return () => {
    const i = list.lastIndexOf(entry);
    if (i >= 0) list.splice(i, 1);
  };
}

export function push(fn: Handler, opts: { strict?: boolean } = {}): () => void {
  const entry: Entry = { fn, strict: !!opts.strict, blocked: new Set(held) };
  stack.push(entry);
  return remover(stack, entry);
}

// Overlays the player can open at any moment (settings, line history) sit above the stack,
// so a script that starts waiting for input while one is open can't take its keys.
const modals: Entry[] = [];

export function pushModal(fn: Handler, opts: { strict?: boolean } = {}): () => void {
  const entry: Entry = { fn, strict: !!opts.strict, blocked: new Set(held) };
  modals.push(entry);
  return remover(modals, entry);
}

function top(): Entry | undefined {
  return modals[modals.length - 1] ?? stack[stack.length - 1];
}

// The key behind the action being handled, '' for buttons and clicks.
let current = '';

/** Whether the action being handled came from the space bar (Enter and Space both 'advance'). */
export function fromSpace(): boolean {
  return current === 'Space';
}

/** Actions from buttons and clicks: always a deliberate, single press. */
export function emit(a: Action): void {
  current = '';
  top()?.fn(a);
}

function emitKey(a: Action, code: string, repeat: boolean): void {
  const t = top();
  if (!t) return;
  if (t.strict && (repeat || t.blocked.has(code))) return;
  current = code;
  try {
    t.fn(a);
  } finally {
    current = '';
  }
}

export function waitFor(allowed: Action[]): Promise<Action> {
  return new Promise((resolve) => {
    const pop = push((a) => {
      if (!allowed.includes(a)) return;
      pop();
      resolve(a);
    });
  });
}

// KeyboardEvent.code is layout independent, so Q/E/R still work while the
// Korean IME is on.
const KEYS: Record<string, Action> = {
  Enter: 'advance', NumpadEnter: 'advance', Space: 'advance',
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyQ: 'press', KeyE: 'present', KeyR: 'record',
  Escape: 'back', Backspace: 'back', Tab: 'tab',
  Digit1: 'n1', Digit2: 'n2', Digit3: 'n3', Digit4: 'n4',
};

/**
 * M toggles sound, O opens the settings and L the line history, whatever else is on screen.
 * H asks the game for a hint first; when the game has no hint window to open it becomes the
 * plain 'hint' action (4화's scripted hints).
 */
export function bindKeyboard(hotkeys: {
  mute: () => void;
  settings: () => void;
  backlog: () => void;
  hint: () => boolean;
}): void {
  window.addEventListener('keyup', (e) => {
    held.delete(e.code);
    for (const entry of [...stack, ...modals]) entry.blocked.delete(e.code);
  });
  // A key released while the window was in the background never sends keyup.
  window.addEventListener('blur', () => {
    held.clear();
    for (const entry of [...stack, ...modals]) entry.blocked.clear();
  });
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const wasHeld = held.has(e.code);
    held.add(e.code);
    const repeat = e.repeat || wasHeld;
    if (e.code === 'KeyM') {
      if (!repeat) hotkeys.mute();
      return;
    }
    if (e.code === 'KeyO' && !repeat) {
      hotkeys.settings();
      return;
    }
    if (e.code === 'KeyL' && !repeat) {
      hotkeys.backlog();
      return;
    }
    if (e.code === 'KeyH') {
      e.preventDefault();
      if (!repeat && !hotkeys.hint()) emitKey('hint', e.code, false);
      return;
    }
    const a = KEYS[e.code];
    if (!a) return;
    e.preventDefault();
    if (repeat && a !== 'advance') return;
    emitKey(a, e.code, repeat);
  });
}
