import 'galmuri/dist/galmuri.css';
import '@fontsource/black-han-sans';
import './style.css';
import { CASE_DAON } from './content/case-daon';
import { Game } from './engine/game';

// ?scene=intro|cross1|cross2|climax jumps ahead, ?fast types text instantly,
// ?spots outlines every examine spot (for lining them up with new backgrounds).
const params = new URLSearchParams(location.search);
if (params.has('spots')) document.body.classList.add('show-spots');
const jump = params.get('scene');
const game = new Game(document.getElementById('app')!, CASE_DAON, params.has('fast'));
void game.start(jump && CASE_DAON.scenes[jump] ? jump : null);
