import { sfx } from './audio';
import { el, replay, setLabel } from './dom';
import { fromSpace, push } from './input';
import { touchLayout } from './viewport';

export interface MatchCard {
  id: string;
  /** As the record states it (each row keeps its own device's clock). */
  time: string;
  who: string;
  text: string;
}

/**
 * Two records laid out as rows of cards; the player puts one card of each row side by side
 * (1화: a line in the 112 call and the alley line said at the same time). Wrong pairs only get a
 * line of feedback.
 */
export interface MatchTask {
  title: string;
  prompt: string;
  rows: [{ label: string; cards: MatchCard[] }, { label: string; cards: MatchCard[] }];
  /** Pairs that count as the same moment (top id, bottom id). */
  answer: [string, string][];
  /** Feedback for a wrong pair, looked up as `top|bottom`, then the top id, then the bottom id, then `default`. */
  wrong: Record<string, string>;
  done: string;
  /** Label of the check button (default: "같은 시각에 놓기"). */
  confirm?: string;
  /** Stop the music the moment the right pair lands (the climax beat), not after "계속". */
  cutMusic?: boolean;
}

export class MatchView {
  open(stage: HTMLElement, t: MatchTask, onSolve?: () => void, openRecord?: () => Promise<unknown>): Promise<void> {
    const root = el('div', 'matchview', stage);
    const panel = el('div', 'matchview-panel', root);
    el('h2', 'matchview-title', panel, t.title);
    el('p', 'matchview-prompt', panel, t.prompt);
    const rows = el('div', 'matchview-rows', panel);
    const picks = el('p', 'matchview-picks', panel);
    const say = el('p', 'matchview-say', panel);
    say.setAttribute('aria-live', 'polite');
    const foot = el('footer', 'matchview-foot', panel);
    const hint = el('span', 'matchview-hint', foot, '클릭 또는 Space로 카드 고르기 · ↑ ↓ 줄 · ← → 카드 · 두 줄에서 한 장씩 고르면 Enter');
    const label = `${t.confirm ?? '같은 시각에 놓기'}  Enter`;
    const go = el('button', 'btn btn-primary', foot, label);

    const chosen: [number, number] = [-1, -1];
    let row = 0;
    let col = 0;
    let done = false;
    const tell = (text: string, good = false) => {
      say.textContent = text;
      say.classList.toggle('good', good);
      replay(say, 'on');
    };

    const paint = () => {
      rows.replaceChildren();
      t.rows.forEach((r, ri) => {
        const line = el('div', 'match-row', rows);
        line.classList.toggle('active', ri === row && !done);
        el('div', 'match-label', line, r.label);
        const cards = el('div', 'match-cards', line);
        r.cards.forEach((c, ci) => {
          const b = el('button', 'match-card', cards);
          b.classList.toggle('on', chosen[ri] === ci);
          b.classList.toggle('focus', ri === row && ci === col && !done);
          b.classList.toggle('dim', done && chosen[ri] !== ci);
          if (chosen[ri] === ci) el('span', 'match-check', b, '✓ 고름');
          el('span', 'match-time', b, c.time);
          el('span', 'match-who', b, c.who);
          el('span', 'match-text', b, c.text);
          b.addEventListener('click', () => {
            if (done) return;
            row = ri;
            col = ci;
            put();
          });
        });
      });
      go.disabled = !done && (chosen[0] < 0 || chosen[1] < 0);
      const name = (ri: number) => (chosen[ri] < 0 ? '아직 안 고름' : `${t.rows[ri].cards[chosen[ri]].time} ${t.rows[ri].cards[chosen[ri]].who}`);
      picks.textContent = done ? '' : `고른 카드 — 위: ${name(0)} · 아래: ${name(1)}${go.disabled || touchLayout() ? '' : '  → Enter로 확인'}`;
      setLabel(go, done ? '계속  Enter' : label);
      hint.hidden = done;
    };

    // Places (or lifts) the focused card as this row's pick.
    const put = () => {
      chosen[row] = chosen[row] === col ? -1 : col;
      sfx('select');
      paint();
    };

    const check = () => {
      if (chosen[0] < 0 || chosen[1] < 0) {
        tell('두 줄에서 한 장씩 고르세요.');
        return;
      }
      const a = t.rows[0].cards[chosen[0]].id;
      const b = t.rows[1].cards[chosen[1]].id;
      if (t.answer.some(([x, y]) => x === a && y === b)) {
        done = true;
        onSolve?.();
        sfx('realize');
        tell(t.done, true);
        root.classList.add('solved');
        paint();
        return;
      }
      sfx('close');
      tell(t.wrong[`${a}|${b}`] ?? t.wrong[a] ?? t.wrong[b] ?? t.wrong.default ?? '그 둘은 같은 순간이 아니야.');
    };

    paint();
    sfx('paper');

    return new Promise((resolve) => {
      const finish = () => {
        pop();
        root.remove();
        sfx('close');
        resolve();
      };
      go.addEventListener('click', () => (done ? finish() : check()));
      const pop = push((a) => {
        if (a === 'record' && openRecord) {
          void openRecord();
          return;
        }
        if (done) {
          if (a === 'advance') finish();
          return;
        }
        const n = t.rows[row].cards.length;
        if (a === 'left') col = Math.max(0, col - 1);
        else if (a === 'right') col = Math.min(n - 1, col + 1);
        else if (a === 'up' || a === 'down') {
          row = a === 'up' ? 0 : 1;
          col = Math.min(col, t.rows[row].cards.length - 1);
        } else if (a === 'advance' && fromSpace()) {
          put();
          return;
        } else if (a === 'advance' || a === 'present') {
          // Enter on a card not yet placed places it; once both rows hold a card it checks the pair.
          if (chosen[0] >= 0 && chosen[1] >= 0) check();
          else put();
          return;
        } else return;
        sfx('select');
        paint();
      }, { strict: true });
    });
  }
}
