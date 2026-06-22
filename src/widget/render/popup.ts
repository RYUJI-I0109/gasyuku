import type { Priority } from '../../shared/types';
import { PRIORITY_COLORS } from '../../shared/constants';
import { el, esc } from '../dom';
import { state } from '../state';

export function renderPopup(onRender: () => void, closePopup: () => void, submitComment: (priority: Priority) => void): void {
  let popup = document.getElementById('fb-popup');
  const isNew = !popup;
  if (isNew) {
    popup = el('div', { id: 'fb-popup', className: 'fb-popup' });
    document.body.appendChild(popup);
    popup.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
      if (!t) return;
      if (t.dataset.action === 'cancel-popup') { closePopup(); }
      else if (t.dataset.action === 'set-popup-pri') { state.popupPriority = t.dataset.pri as Priority; onRender(); }
      else if (t.dataset.action === 'submit-popup') { submitComment(state.popupPriority); }
    });
    popup.addEventListener('input', (e) => {
      if ((e.target as HTMLElement).dataset.action === 'popup-textarea') state.popupContent = (e.target as HTMLTextAreaElement).value;
    });
    popup.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement).dataset.action === 'popup-textarea' && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        submitComment(state.popupPriority);
      }
    });
  }
  if (!state.selectedRect) { popup!.classList.remove('show'); return; }
  popup!.classList.add('show');

  const q = state.selectedText.length > 120 ? state.selectedText.substring(0, 120) + '...' : state.selectedText;
  const selPc = PRIORITY_COLORS[state.popupPriority];
  let h = '<div class="fb-popup-head"><span>コメントを追加</span></div>';
  h += '<div class="fb-popup-quote">' + esc(q) + '</div>';
  h += '<textarea placeholder="フィードバックを入力..." data-action="popup-textarea">' + esc(state.popupContent) + '</textarea>';
  h += '<div class="fb-popup-pri">';
  (['must', 'better', 'want'] as const).forEach((p) => {
    const pc = PRIORITY_COLORS[p];
    const sel = state.popupPriority === p;
    const style = sel
      ? 'background:' + pc.light + ';color:' + pc.bg + ';border-color:' + pc.bg
      : 'background:var(--fb-bg);color:var(--fb-muted-fg);border-color:var(--fb-border)';
    h += '<button style="' + style + '" data-action="set-popup-pri" data-pri="' + p + '">' + p.charAt(0).toUpperCase() + p.slice(1) + '</button>';
  });
  h += '</div>';
  h += '<div class="fb-popup-actions">';
  h += '<button class="cancel" data-action="cancel-popup">キャンセル</button>';
  h += '<button class="submit" style="background:' + selPc.bg + '" data-action="submit-popup">送信</button>';
  h += '</div>';
  popup!.innerHTML = h;

  const rect = state.selectedRect;
  const pw = 400, ph = 300, m = 12;
  let top = rect.bottom + m;
  if (top + ph > window.innerHeight) top = rect.top - ph - m;
  if (top < m) top = Math.max(m, (window.innerHeight - ph) / 2);
  const availW = state.sidebarOpen ? window.innerWidth - state.sidebarWidth : window.innerWidth;
  const left = Math.max(m, Math.min(rect.left, availW - pw - m));
  popup!.style.top = top + 'px';
  popup!.style.left = left + 'px';
}
