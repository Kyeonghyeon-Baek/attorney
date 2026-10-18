import 'galmuri/dist/galmuri.css';
import '@fontsource/black-han-sans';
import './style.css';
import { EPISODES } from './content/episodes';
import { Game, type CaseData } from './engine/game';

// ?ep=1 opens that episode directly, ?scene=<id> also jumps to a scene in it
// (?scene alone finds the episode that has the scene), ?fast types text instantly,
// ?spots outlines every examine spot (for lining them up with new backgrounds).
const params = new URLSearchParams(location.search);
if (params.has('spots')) document.body.classList.add('show-spots');
const scene = params.get('scene');
const cases = EPISODES.filter((x): x is CaseData => !('locked' in x));
let ep = Number(params.get('ep')) || null;
if (scene && !ep) ep = cases.find((c) => c.scenes[scene])?.ep ?? null;
const game = new Game(document.getElementById('app')!, EPISODES, params.has('fast'));
void game.start({ ep, jump: scene });
