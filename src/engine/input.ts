export type Action =
  | 'advance' | 'left' | 'right' | 'up' | 'down'
  | 'press' | 'present' | 'record' | 'back' | 'tab' | 'hint'
  | 'n1' | 'n2' | 'n3' | 'n4';

type Handler = (a: Action) => void;

// Only the handler on top of the stack receives actions, so an open overlay
// (court record, question menu) naturally blocks the dialogue underneath it.
const stack: Handler[] = [];

export function push(handler: Handler): () => void {
  stack.push(handler);
  return () => {
    const i = stack.lastIndexOf(handler);
    if (i >= 0) stack.splice(i, 1);
  };
}

// Overlays the player can open at any moment (settings, line history) sit above the stack,
// so a script that starts waiting for input while one is open can't take its keys.
const modals: Handler[] = [];

export function pushModal(handler: Handler): () => void {
  modals.push(handler);
  return () => {
    const i = modals.lastIndexOf(handler);
    if (i >= 0) modals.splice(i, 1);
  };
}

export function emit(a: Action): void {
  (modals[modals.length - 1] ?? stack[stack.length - 1])?.(a);
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
  KeyQ: 'press', KeyE: 'present', KeyR: 'record', KeyH: 'hint',
  Escape: 'back', Backspace: 'back', Tab: 'tab',
  Digit1: 'n1', Digit2: 'n2', Digit3: 'n3', Digit4: 'n4',
};

/** M toggles sound, O opens the settings and L the line history, whatever else is on screen. */
export function bindKeyboard(hotkeys: { mute: () => void; settings: () => void; backlog: () => void }): void {
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'KeyM') {
      hotkeys.mute();
      return;
    }
    if (e.code === 'KeyO' && !e.repeat) {
      hotkeys.settings();
      return;
    }
    if (e.code === 'KeyL' && !e.repeat) {
      hotkeys.backlog();
      return;
    }
    const a = KEYS[e.code];
    if (!a) return;
    e.preventDefault();
    if (e.repeat && a !== 'advance') return;
    emit(a);
  });
}
