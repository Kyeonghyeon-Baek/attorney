import { el } from './dom';

/** Fit the authored stage inside the visible, safe area, including browser chrome changes. */
export function bindViewport(root: HTMLElement, viewport: HTMLElement, stage: HTMLElement): void {
  const rotate = el('section', 'rotate-screen', root);
  rotate.setAttribute('aria-label', '가로 화면 안내');
  const phone = el('div', 'rotate-phone', rotate);
  phone.setAttribute('aria-hidden', 'true');
  el('p', 'rotate-kicker', rotate, '판 뒤집기');
  el('h1', '', rotate, '휴대폰을 가로로 돌려 주세요');
  el('p', '', rotate, '법정과 대사를 더 크게 볼 수 있어요.');
  el('p', 'rotate-tip', rotate, '화면이 돌아가지 않으면 휴대폰의 화면 회전 잠금을 해제해 주세요.');
  const mobile = matchMedia('(pointer: coarse) and (max-width: 1100px)');
  const fit = () => {
    const { width, height } = viewport.getBoundingClientRect();
    if (!width || !height) return;
    stage.style.setProperty('--scale', String(Math.min(width / 1280, height / 720)));
    stage.classList.toggle('touch-layout', mobile.matches);
    const portrait = mobile.matches && innerHeight > innerWidth;
    rotate.hidden = !portrait;
    viewport.inert = portrait;
  };
  fit();
  new ResizeObserver(fit).observe(viewport);
  mobile.addEventListener('change', fit);
  addEventListener('resize', fit);
  visualViewport?.addEventListener('resize', fit);
}

/** Fullscreen is optional: unsupported phones keep the regular browser view. */
export function addFullscreenButton(parent: HTMLElement): void {
  if (!document.fullscreenEnabled) return;
  const label = () => document.fullscreenElement ? '전체 화면 나가기' : '전체 화면';
  const button = el('button', 'btn mobile-fullscreen', parent, label());
  button.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      button.textContent = label();
    } catch {
      button.textContent = '브라우저 화면으로 플레이';
    }
  });
}
