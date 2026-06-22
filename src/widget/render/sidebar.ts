import type { Priority, FilterMode } from '../../shared/types';
import { SIDEBAR_WIDTH_KEY } from '../../shared/constants';
import { el, esc } from '../dom';
import { icon } from '../icons';
import { state } from '../state';
import { renderCard } from './card';

function applySidebarWidth(): void {
  const sb = document.getElementById('fb-sidebar');
  if (!sb) return;
  const w = state.sidebarWidth;
  sb.style.width = w + 'px';
  sb.style.right = state.sidebarOpen ? '0px' : (-(w + 20)) + 'px';
  document.body.style.marginRight = state.sidebarOpen ? w + 'px' : '';
}

export function toggleSidebar(): void {
  state.sidebarOpen = !state.sidebarOpen;
  const btn = document.getElementById('fb-toggle');
  if (btn) btn.style.display = state.sidebarOpen ? 'none' : '';
  document.body.style.transition = 'margin-right 0.3s ease';
  applySidebarWidth();
}

function topLevel() { return state.comments.filter((c) => !c.parentId); }

function filtered() {
  const tl = topLevel();
  if (state.filter === 'resolved') return tl.filter((c) => c.resolved);
  if (state.filter === 'all') return tl;
  return tl.filter((c) => !c.resolved);
}

export function renderSidebar(onRender: () => void): void {
  let sb = document.getElementById('fb-sidebar');
  const isNew = !sb;
  if (isNew) {
    sb = el('div', { id: 'fb-sidebar' });
    document.body.appendChild(sb);
    sb.addEventListener('mouseover', (e) => {
      const card = (e.target as HTMLElement).closest('.fb-card') as HTMLElement | null;
      if (!card) return;
      const mark = document.querySelector('.fb-highlight[data-comment-id="' + card.dataset.id + '"]');
      if (mark) mark.classList.add('fb-pulse');
    });
    sb.addEventListener('mouseout', (e) => {
      const card = (e.target as HTMLElement).closest('.fb-card') as HTMLElement | null;
      if (!card) return;
      if (e.relatedTarget && card.contains(e.relatedTarget as Node)) return;
      const mark = document.querySelector('.fb-highlight[data-comment-id="' + card.dataset.id + '"]');
      if (mark) mark.classList.remove('fb-pulse');
    });
  }
  applySidebarWidth();

  const tl = topLevel();
  const counts = {
    unresolved: tl.filter((c) => !c.resolved).length,
    resolved: tl.filter((c) => c.resolved).length,
    all: tl.length,
  };

  let html = '<div class="fb-resize-handle"></div>';

  html += '<div class="fb-header">';
  html += '<div class="fb-header-left"><span class="fb-header-title">コメント</span><span class="fb-header-count">' + counts.all + '</span></div>';
  html += '<div class="fb-header-actions">';
  html += '<button class="fb-hdr-btn" data-action="close" title="閉じる">' + icon('x', 18) + '</button>';
  html += '</div></div>';

  if (state.username) {
    if (state.editingName) {
      html += '<div class="fb-user-row"><input class="fb-name-input" value="' + esc(state.nameInput) + '" data-action="name-input" autofocus></div>';
    } else {
      html += '<div class="fb-user-row" data-action="edit-name">' + icon('user', 14) + esc(state.username) + '</div>';
    }
  }

  html += '<div class="fb-filters">';
  (['unresolved', 'resolved', 'all'] as const).forEach((f) => {
    const label = f === 'unresolved' ? '未解決' : f === 'resolved' ? '解決済' : 'すべて';
    html += '<button class="fb-filter' + (state.filter === f ? ' active' : '') + '" data-filter="' + f + '">' + label + '<span class="cnt">' + counts[f] + '</span></button>';
  });
  html += '</div>';

  const items = filtered().sort((a, b) => b.timestamp - a.timestamp);
  html += '<div class="fb-list">';
  if (items.length === 0) {
    html += '<div class="fb-empty">' + icon('message', 40) + 'コメントはまだありません<br><span style="font-size:11px">テキストを選択してコメントを追加</span></div>';
  } else {
    items.forEach((c) => { html += renderCard(c); });
  }
  html += '</div>';

  sb!.innerHTML = html;
  if (isNew) bindSidebarEvents(sb!, onRender);
}

export interface SidebarActions {
  toggleSidebar: () => void;
  cyclePriority: (id: string) => void;
  scrollToQuote: (id: string) => void;
  resolveComment: (id: string) => void;
  deleteComment: (id: string) => void;
  deleteReply: (id: string) => void;
  saveEdit: (id: string) => void;
  submitReply: (id: string) => void;
  finishNameEdit: () => void;
}

let _actions: SidebarActions | null = null;

export function setSidebarActions(actions: SidebarActions): void {
  _actions = actions;
}

function bindSidebarEvents(sb: HTMLElement, onRender: () => void): void {
  sb.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (t) {
      const action = t.dataset.action;
      const id = t.dataset.id;

      if (action === 'close') { _actions?.toggleSidebar(); }
      else if (action === 'edit-name') { state.editingName = true; state.nameInput = state.username; onRender(); }
      else if (action === 'cycle' && id) { _actions?.cyclePriority(id); }
      else if (action === 'scroll-quote' && id) { _actions?.scrollToQuote(id); }
      else if (action === 'reply' && id) { state.replyingTo = state.replyingTo === id ? null : id; state.replyText = ''; onRender(); }
      else if (action === 'resolve' && id) { _actions?.resolveComment(id); }
      else if (action === 'edit' && id) { const c = state.comments.find((x) => x.id === id); if (c) { state.editingId = id; state.editContent = c.content; state.editPriority = c.priority; onRender(); } }
      else if (action === 'delete' && id) { _actions?.deleteComment(id); }
      else if (action === 'delete-reply' && id) { _actions?.deleteReply(id); }
      else if (action === 'cancel-edit') { state.editingId = null; onRender(); }
      else if (action === 'save-edit' && id) { _actions?.saveEdit(id); }
      else if (action === 'submit-reply' && id) { _actions?.submitReply(id); }
      else if (action === 'set-edit-pri') { state.editPriority = t.dataset.pri as Priority; onRender(); }
      return;
    }
    const filterBtn = (e.target as HTMLElement).closest('[data-filter]') as HTMLElement | null;
    if (filterBtn) { state.filter = filterBtn.dataset.filter as FilterMode; onRender(); return; }

    const card = (e.target as HTMLElement).closest('.fb-card') as HTMLElement | null;
    if (card && card.dataset.id) {
      _actions?.scrollToQuote(card.dataset.id);
    }
  });

  sb.addEventListener('mousedown', (e) => {
    if (!(e.target as HTMLElement).closest('.fb-resize-handle')) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = state.sidebarWidth;
    const handle = (e.target as HTMLElement).closest('.fb-resize-handle')!;
    document.body.classList.add('fb-resizing');
    handle.classList.add('active');
    function onMove(ev: MouseEvent) {
      state.sidebarWidth = Math.min(800, Math.max(300, startWidth + (startX - ev.clientX)));
      const s = document.getElementById('fb-sidebar');
      if (s) s.style.width = state.sidebarWidth + 'px';
      document.body.style.transition = 'none';
      document.body.style.marginRight = state.sidebarWidth + 'px';
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.classList.remove('fb-resizing');
      handle.classList.remove('active');
      document.body.style.transition = '';
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(state.sidebarWidth));
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  sb.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.dataset.action === 'name-input') { state.nameInput = t.value; }
    else if (t.dataset.action === 'edit-textarea') { state.editContent = t.value; }
    else if (t.dataset.action === 'reply-textarea') { state.replyText = t.value; const btn = sb.querySelector('[data-action="submit-reply"]') as HTMLButtonElement | null; if (btn) btn.disabled = !state.replyText.trim(); }
  });

  sb.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t.dataset.action === 'name-input') {
      if (e.key === 'Enter') { _actions?.finishNameEdit(); }
      else if (e.key === 'Escape') { state.editingName = false; onRender(); }
    }
    if (t.dataset.action === 'reply-textarea' && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      const id = (sb.querySelector('[data-action="submit-reply"]') as HTMLElement | null)?.dataset.id;
      if (id) _actions?.submitReply(id);
    }
  });

  sb.addEventListener('blur', (e) => {
    if ((e.target as HTMLElement).dataset?.action === 'name-input') { _actions?.finishNameEdit(); }
  }, true);
}
