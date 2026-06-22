import type { Priority } from '../shared/types';
import { state } from './state';

const PRIORITY_FLASH: Record<Priority, string> = {
  must: 'rgba(239,68,68,0.4)',
  better: 'rgba(245,158,11,0.4)',
  want: 'rgba(34,197,94,0.4)',
};

export function scrollToQuote(id: string): void {
  const mark = document.querySelector('.fb-highlight[data-comment-id="' + id + '"]') as HTMLElement | null;
  if (!mark) return;
  mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const c = state.comments.find((x) => x.id === id);
  const flashColor = c ? (PRIORITY_FLASH[c.priority] || PRIORITY_FLASH.want) : PRIORITY_FLASH.want;
  const orig = mark.style.backgroundColor;
  mark.style.backgroundColor = flashColor;
  mark.style.transition = 'background-color 0.3s';
  setTimeout(() => { mark.style.backgroundColor = orig; }, 1500);
}

export function scrollToPin(id: string): void {
  const marker = document.querySelector('.fb-pin-marker[data-pin-id="' + id + '"]') as HTMLElement | null;
  if (!marker) return;
  marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
  marker.classList.add('fb-pin-flash');
  setTimeout(() => { marker.classList.remove('fb-pin-flash'); }, 1500);
}

export function scrollToCard(id: string, toggleSidebar: () => void): void {
  const wasClosed = !state.sidebarOpen;
  if (wasClosed) { toggleSidebar(); }
  setTimeout(() => {
    const card = document.querySelector('.fb-card[data-id="' + id + '"]') as HTMLElement | null;
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('fb-focused');
    setTimeout(() => { card.classList.remove('fb-focused'); }, 1500);
  }, wasClosed ? 350 : 0);
}
