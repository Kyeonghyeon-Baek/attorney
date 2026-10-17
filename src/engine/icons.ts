import type { IconName } from './types';

// Simple line icons for evidence until real item art exists.
const PATHS: Record<IconName, string> = {
  door: `
    <rect x="14" y="8" width="26" height="48" rx="2"/>
    <circle cx="34" cy="33" r="2" fill="currentColor"/>
    <rect x="45" y="22" width="11" height="17" rx="2"/>
    <path d="M48 27h5M48 31h5"/>`,
  autopsy: `
    <rect x="14" y="10" width="36" height="46" rx="3"/>
    <rect x="24" y="6" width="16" height="8" rx="2"/>
    <path d="M22 26h20M22 34h20M22 42h12"/>
    <path d="M40 44l4 4 8-10"/>`,
  card: `
    <rect x="10" y="16" width="44" height="30" rx="4"/>
    <circle cx="23" cy="29" r="5"/>
    <path d="M17 40c2-4 10-4 12 0M34 26h13M34 32h9"/>
    <circle cx="48" cy="46" r="9"/>
    <path d="M44 46l3 3 5-6"/>`,
  brochure: `
    <path d="M8 14l16-4 16 4 16-4v40l-16 4-16-4-16 4z"/>
    <path d="M24 10v40M40 14v40"/>
    <path d="M30 26l2-5 2 5 5 2-5 2-2 5-2-5-5-2z" fill="currentColor"/>`,
  contract: `
    <path d="M14 8h36v48H14z"/>
    <path d="M20 18h24M20 25h24M20 32h16"/>
    <path d="M20 46c3-5 6 3 9-2s5 2 8-1"/>
    <circle cx="44" cy="45" r="5" fill="currentColor"/>`,
  mic: `
    <rect x="24" y="8" width="16" height="28" rx="8"/>
    <path d="M16 30c0 9 7 16 16 16s16-7 16-16M32 46v10M22 56h20"/>`,
  log: `
    <path d="M14 8h28l8 8v40H14z"/>
    <path d="M42 8v8h8"/>
    <path d="M20 24h24M20 30h24M20 36h18M20 42h24M20 48h14"/>`,
};

export function icon(name: IconName): string {
  return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;
}
