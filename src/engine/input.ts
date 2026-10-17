export type Action =
  | 'advance' | 'left' | 'right' | 'up' | 'down'
  | 'press' | 'present' | 'record' | 'back' | 'tab'
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

export function emit(a: Action): void {
  stack[stack.length - 1]?.(a);
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

export function bindKeyboard(onMute: () => void): void {
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'KeyM') {
      onMute();
      return;
    }
    const a = KEYS[e.code];
    if (!a) return;
    e.preventDefault();
    if (e.repeat && a !== 'advance') return;
    emit(a);
  });
}
