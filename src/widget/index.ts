/**
 * Icons: Lucide (https://lucide.dev)
 * ISC License - Copyright (c) Lucide Contributors 2026
 */

// document.currentScript は IIFE 先頭でキャプチャ必須（esbuild の import 巻き上げ前に実行される）
const SCRIPT = document.currentScript as HTMLScriptElement | null;
const API_BASE = SCRIPT ? SCRIPT.src.replace(/\/widget\.js.*$/, '') : '';
const API_TOKEN = SCRIPT ? (SCRIPT.dataset.token || '') : '';

import type { Priority } from '../shared/types';
import { USERNAME_KEY, PRIORITY_CYCLE } from '../shared/constants';
import { generateId } from '../shared/slug';
import { initApi, api } from './api';
import { state, slug, type FbComment } from './state';
import { injectStyles } from './styles';
import { render, toggleSidebar, setRenderDeps } from './render/index';
import { setToggleAreaHandler, setToggleVoiceHandler } from './render/toggle';
import { setSidebarActions } from './render/sidebar';
import { applyHighlights } from './highlight';
import { scrollToQuote, scrollToCard, scrollToPin } from './scroll';
import { setupTextSelection } from './selection';
import {
  enterPinMode, exitPinMode,
  handlePinClick, renderPins, renderPinPopup, cancelPinPopup,
  setupPinDrag,
} from './pin';
import { toggleRecording, setVoiceOnChange } from './voice';

initApi(API_BASE, API_TOKEN);

function loadComments(): Promise<void> {
  return api('GET', { slug }).then((c) => {
    if (Array.isArray(c)) state.comments = c;
    render();
    renderPins(); // ピンも state.comments に含まれるため取得後に描画
    applyHighlights(onClickHighlight);
  }).catch(() => {
    render();
    renderPins();
    applyHighlights(onClickHighlight);
  });
}

function closePopup(): void {
  state.selectedText = '';
  state.selectedRect = null;
  state.popupContent = '';
  state.popupPriority = 'must';
  render();
}

function submitComment(priority: Priority): void {
  if (!state.selectedText) return;
  const c: FbComment = {
    id: generateId(), author: state.username || '匿名', type: 'comment',
    quote: state.selectedText, quoteContext: state.selectedQuoteContext,
    content: state.popupContent.trim(),
    priority, parentId: null, pageUrl: window.location.href,
    projectSlug: slug, timestamp: Date.now(),
    resolved: false, resolvedBy: null, resolvedAt: null, updatedAt: null,
  };
  state.comments.push(c);
  closePopup();
  applyHighlights(onClickHighlight);
  api('POST', c as unknown as Record<string, unknown>).then(loadComments);
}

function resolveComment(id: string): void {
  const c = state.comments.find((x) => x.id === id);
  if (!c) return;
  const now = !c.resolved;
  c.resolved = now;
  c.resolvedBy = now ? state.username : null;
  c.resolvedAt = now ? Date.now() : null;
  render(); applyHighlights(onClickHighlight);
  api('PUT', { id, action: 'resolve', resolved: now, resolvedBy: c.resolvedBy, resolvedAt: c.resolvedAt });
}

function cyclePriority(id: string): void {
  const c = state.comments.find((x) => x.id === id);
  if (!c || c.author !== state.username) return;
  c.priority = PRIORITY_CYCLE[c.priority] || 'must';
  render(); applyHighlights(onClickHighlight);
  api('PUT', { id, action: 'cyclePriority', priority: c.priority });
}

function deleteComment(id: string): void {
  state.comments = state.comments.filter((c) => c.id !== id && c.parentId !== id);
  render(); applyHighlights(onClickHighlight);
  api('DELETE', { id });
}

function deleteReply(id: string): void {
  state.comments = state.comments.filter((c) => c.id !== id);
  render();
  api('DELETE', { id });
}

function saveEdit(id: string): void {
  const c = state.comments.find((x) => x.id === id);
  if (!c) return;
  c.content = state.editContent;
  c.priority = state.editPriority;
  state.editingId = null;
  render(); applyHighlights(onClickHighlight);
  api('PUT', { id, action: 'edit', content: c.content, priority: c.priority });
}

function submitReply(parentId: string): void {
  if (!state.replyText.trim() || !state.username) return;
  const r: FbComment = {
    id: generateId(), author: state.username, type: 'comment',
    quote: '', quoteContext: { beforeText: '', afterText: '' },
    content: state.replyText.trim(), priority: 'want',
    parentId, pageUrl: window.location.href,
    projectSlug: slug, timestamp: Date.now(),
    resolved: false, resolvedBy: null, resolvedAt: null, updatedAt: null,
  };
  state.comments.push(r);
  state.replyingTo = null;
  state.replyText = '';
  render();
  api('POST', r as unknown as Record<string, unknown>);
}

function finishNameEdit(): void {
  if (state.nameInput.trim() && state.nameInput.trim() !== state.username) {
    const oldName = state.username;
    state.username = state.nameInput.trim();
    localStorage.setItem(USERNAME_KEY, state.username);
    api('PUT', { id: '_rename', action: 'rename', author: state.username, oldAuthor: oldName, projectSlug: slug }).then(loadComments);
  }
  state.editingName = false;
  render();
}

function onClickHighlight(id: string): void {
  scrollToCard(id, toggleSidebar);
}

function togglePinMode(): void {
  if (state.pinMode) {
    exitPinMode();
  } else {
    enterPinMode();
  }
  render();
  renderPins(); // 吹き出しの編集UI（バッジ/削除）の表示をモードに合わせて更新
}

function handleVoiceToggle(): void {
  toggleRecording();
}

// Wire up dependencies before first render
setRenderDeps(closePopup, submitComment);
setToggleAreaHandler(togglePinMode);
setToggleVoiceHandler(handleVoiceToggle);
// 録音状態の変化やエラー、ピン配置完了時に UI を更新する
setVoiceOnChange(() => {
  render();
  if (state.voiceError) {
    // 簡易通知（Step4 でリッチ化）
    console.warn('[voice]', state.voiceError);
  }
});
setSidebarActions({
  toggleSidebar,
  cyclePriority,
  scrollToQuote,
  scrollToPin,
  resolveComment,
  deleteComment,
  deleteReply,
  saveEdit,
  submitReply,
  finishNameEdit,
});

// フィードバックモード ON 中の「クリック=ピン / ドラッグ=テキスト選択」自動判定。
// クリックかドラッグかは mousedown→click の移動距離で判定し、テキスト選択時はピンを置かない。
const WIDGET_UI_SELECTOR = '#fb-sidebar,#fb-toggle,#fb-pin-popup,.fb-pin-marker,.fb-pin-tooltip,.fb-pin-delete,.fb-popup';
const CLICK_DRAG_THRESHOLD = 6; // px

function setupClickAndDrag(): void {
  let downX = 0;
  let downY = 0;

  document.addEventListener('mousedown', (e) => {
    downX = e.clientX;
    downY = e.clientY;
  }, true);

  document.addEventListener('click', (e) => {
    if (!state.pinMode) return; // マスターOFF中は何もしない
    if ((e.target as HTMLElement).closest(WIDGET_UI_SELECTOR)) return;

    // ドラッグでテキスト選択された場合はテキストフロー(mode1)に委譲
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) return;

    // 移動が大きければドラッグとみなしてピンは置かない
    if (Math.hypot(e.clientX - downX, e.clientY - downY) >= CLICK_DRAG_THRESHOLD) return;

    e.preventDefault();
    e.stopPropagation();
    handlePinClick(e);
    if (state.pinPopupPos) {
      renderPinPopup(render);
    }
    render();
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.pinPopupPos) {
        cancelPinPopup();
        state.editingPinId = null;
        const popup = document.getElementById('fb-pin-popup');
        if (popup) popup.classList.remove('show');
        render();
      } else if (state.pinMode) {
        exitPinMode();
        render();
        renderPins();
      }
    }
  });
}

function init(): void {
  injectStyles();
  render();
  setupTextSelection(render, closePopup);
  setupClickAndDrag();
  setupPinDrag(render);
  loadComments(); // 取得後に renderPins も実行される（ピンは state.comments に含まれる）
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
