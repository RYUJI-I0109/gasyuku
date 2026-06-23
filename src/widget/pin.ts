import type { Priority } from '../shared/types';
import { PRIORITY_COLORS } from '../shared/constants';
import { generateId } from '../shared/slug';
import { state, slug, type FbComment } from './state';
import { api } from './api';
import { esc } from './dom';

function getContainer(): HTMLElement {
  return document.querySelector('main') || document.body;
}

export interface PinAnchor { selector: string; dx: number; dy: number; }

// 新規ピン配置時に handlePinClick が捕捉したアンカーを submit まで一時保持する
let pendingAnchor: PinAnchor | null = null;

/** 要素から、document.querySelector で再取得できる安定的な CSS パスを生成する。 */
function cssPath(el: Element): string {
  const esc = (s: string) => (window.CSS && CSS.escape ? CSS.escape(s) : s);
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node !== document.body) {
    if ((node as HTMLElement).id) { parts.unshift('#' + esc((node as HTMLElement).id)); break; }
    let sel = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    if (parent) {
      const sib = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
      if (sib.length > 1) sel += ':nth-of-type(' + (sib.indexOf(node) + 1) + ')';
    }
    parts.unshift(sel);
    node = parent;
  }
  return parts.join('>');
}

/** 画面座標(clientX,clientY)の直下にある「コンテナ内の要素」をアンカーとして捕捉する。 */
function captureAnchorAtPoint(clientX: number, clientY: number): PinAnchor | null {
  const container = getContainer();
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
  if (!el) return null;
  if (el.closest('#fb-sidebar,#fb-toggle,#fb-pin-popup,.fb-pin-marker,.fb-pin-tooltip')) return null;
  if (el === container || el === document.body || !container.contains(el)) return null;
  const eRect = el.getBoundingClientRect();
  return { selector: cssPath(el), dx: clientX - eRect.left, dy: clientY - eRect.top };
}

/** 要素そのものをアンカーにする（音声ピン：見出し要素の左上に配置）。 */
export function anchorFromElement(el: Element): PinAnchor {
  return { selector: cssPath(el), dx: 0, dy: 0 };
}

/**
 * ピンの表示座標を解決する。
 * anchorSelector があり要素が見つかれば「要素位置 + 相対オフセット」で再計算（レスポンシブ追従）。
 * 見つからなければ保存済みの pinX%/pinY px にフォールバック。
 */
function resolvePinPosition(c: { pinX?: number | null; pinY?: number | null; anchorSelector?: string | null; anchorDx?: number | null; anchorDy?: number | null; }): { xPct: number; yPx: number } {
  const container = getContainer();
  const cRect = container.getBoundingClientRect();
  if (c.anchorSelector) {
    let el: Element | null = null;
    try { el = document.querySelector(c.anchorSelector); } catch { el = null; }
    if (el) {
      const eRect = el.getBoundingClientRect();
      let xPct = (((eRect.left - cRect.left) + (c.anchorDx ?? 0)) / cRect.width) * 100;
      if (xPct < 5) xPct = 5;
      if (xPct > 95) xPct = 95;
      const yPx = (eRect.top - cRect.top) + (c.anchorDy ?? 0);
      return { xPct, yPx };
    }
  }
  return { xPct: c.pinX ?? 50, yPx: c.pinY ?? 0 };
}

/** state.comments の中からピン（type==='pin' のトップレベル）を作成順で返す。 */
export function getPins(): FbComment[] {
  return state.comments.filter((c) => c.type === 'pin' && !c.parentId);
}

/** ピンの通し番号（マーカーとサイドバーカードで一致させる。作成順=配列順）。 */
export function pinNumber(id: string): number {
  return getPins().findIndex((p) => p.id === id) + 1;
}

/**
 * ページ上の要素を、ピン座標系（x: コンテナ幅に対する %, y: コンテナ上端からの px）に変換する。
 * handlePinClick と同じ基準で座標を出すため、音声(voice.ts)から打つピンも手動ピンと整合する。
 */
export function elementToPinCoords(target: Element): { x: number; y: number } {
  const container = getContainer();
  const cRect = container.getBoundingClientRect();
  const eRect = target.getBoundingClientRect();
  let xPct = ((eRect.left - cRect.left) / cRect.width) * 100;
  if (xPct < 5) xPct = 5;          // 左端に寄りすぎるとピンが見切れる
  if (xPct > 95) xPct = 95;
  const yPx = eRect.top - cRect.top; // スクロールに依存しないコンテナ内オフセット
  return { x: xPct, y: yPx };
}

export function enterPinMode(): void {
  state.pinMode = true;
  state.pinPopupPos = null;
  document.body.classList.add('fb-pin-mode');
}

export function exitPinMode(): void {
  state.pinMode = false;
  state.pinPopupPos = null;
  document.body.classList.remove('fb-pin-mode');
}

export function handlePinClick(e: MouseEvent): void {
  if ((e.target as HTMLElement).closest('#fb-sidebar,#fb-toggle,#fb-pin-popup,.fb-pin-marker,.fb-pin-tooltip')) return;

  const container = getContainer();
  const containerRect = container.getBoundingClientRect();

  const relX = e.clientX - containerRect.left;
  const xPct = (relX / containerRect.width) * 100;
  const yPx = e.pageY - (containerRect.top + window.scrollY);

  state.editingPinId = null; // 新規ピン追加（編集モードを解除）
  state.pinPopupPos = { x: xPct, y: yPx };
  pendingAnchor = captureAnchorAtPoint(e.clientX, e.clientY); // 最寄り要素を追従基準に
}

/**
 * ピンを1件追加する汎用関数（手動クリック・音声解析の両方から呼ばれる）。
 * type='pin' のコメントとして state.comments に積み、DB に保存する。
 * 描画はまとめたいことがあるため、ここでは renderPins しない（呼び出し側で行う）。
 */
export function addPin(x: number, y: number, content: string, priority: Priority, anchor?: PinAnchor | null): FbComment {
  const c: FbComment = {
    id: generateId(),
    author: state.username || '匿名',
    type: 'pin',
    quote: '',
    quoteContext: { beforeText: '', afterText: '' },
    content: content.trim() || '(コメントなし)',
    priority,
    parentId: null,
    pageUrl: window.location.href,
    projectSlug: slug,
    timestamp: Date.now(),
    resolved: false,
    resolvedBy: null,
    resolvedAt: null,
    updatedAt: null,
    pinX: x,
    pinY: y,
    anchorSelector: anchor?.selector ?? null,
    anchorDx: anchor?.dx ?? null,
    anchorDy: anchor?.dy ?? null,
  };
  state.comments.push(c);
  api('POST', c as unknown as Record<string, unknown>);
  return c;
}

export function submitPinComment(content: string, priority: Priority): void {
  if (!state.pinPopupPos) return;
  addPin(state.pinPopupPos.x, state.pinPopupPos.y, content, priority, pendingAnchor);
  pendingAnchor = null;
  state.pinPopupPos = null;
  renderPins();
}

export function cancelPinPopup(): void {
  state.pinPopupPos = null;
}

/** ピン（と返信）を削除。DBにも反映。 */
export function deletePin(id: string): void {
  state.comments = state.comments.filter((c) => c.id !== id && c.parentId !== id);
  api('DELETE', { id });
  renderPins();
}

/** ピンの位置を更新（ドラッグ移動）。アンカーも取り直して DB に反映。 */
export function movePin(id: string, x: number, y: number, anchor?: PinAnchor | null): void {
  const c = state.comments.find((p) => p.id === id);
  if (!c) return;
  c.pinX = x;
  c.pinY = y;
  c.anchorSelector = anchor?.selector ?? null;
  c.anchorDx = anchor?.dx ?? null;
  c.anchorDy = anchor?.dy ?? null;
  api('PUT', { id, action: 'move', pinX: x, pinY: y, anchorSelector: c.anchorSelector, anchorDx: c.anchorDx, anchorDy: c.anchorDy });
  renderPins();
}

/** ピンの本文・優先度を更新（編集ポップアップの保存）。DBにも反映。 */
export function updatePin(id: string, content: string, priority: Priority): void {
  const c = state.comments.find((p) => p.id === id);
  if (!c) return;
  c.content = content.trim() || '(コメントなし)';
  c.priority = priority;
  api('PUT', { id, action: 'edit', content: c.content, priority });
  renderPins();
}

/** ピンをクリックしたとき、その場に編集ポップアップ（本文・優先度・削除）を開く。 */
export function openPinEditor(id: string, onRender: () => void): void {
  const c = getPins().find((p) => p.id === id);
  if (!c) return;
  state.editingPinId = id;
  const pos = resolvePinPosition(c); // アンカーで再計算した現在位置にポップアップを出す
  state.pinPopupPos = { x: pos.xPct, y: pos.yPx };
  renderPinPopup(onRender);
}

/**
 * ピンのドラッグ移動をセットアップする（委譲方式）。
 * sidebar のリサイズハンドル実装と同じ mousedown→mousemove→mouseup パターン。
 * フィードバックモード(state.pinMode) が OFF の間はドラッグ開始しない（閲覧専用）。
 */
export function setupPinDrag(onRender: () => void): void {
  document.addEventListener('mousedown', (e) => {
    if (!state.pinMode) return;
    const target = e.target as HTMLElement;
    const marker = target.closest('.fb-pin-marker') as HTMLElement | null;
    if (!marker) return;
    const id = marker.dataset.pinId;
    if (!id) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    function onMove(ev: MouseEvent) {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
      if (!moved) {
        moved = true;
        document.body.classList.add('fb-dragging-pin');
      }
      ev.preventDefault();
      const container = getContainer();
      const cRect = container.getBoundingClientRect();
      let xPct = ((ev.clientX - cRect.left) / cRect.width) * 100;
      if (xPct < 5) xPct = 5;
      if (xPct > 95) xPct = 95;
      marker!.style.left = xPct + '%';
      marker!.style.top = (ev.clientY - cRect.top) + 'px';
    }

    function onUp(ev: MouseEvent) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (!moved) {
        openPinEditor(id!, onRender); // 動かさずに離した = クリック → 編集
        return;
      }
      document.body.classList.remove('fb-dragging-pin');
      const container = getContainer();
      const cRect = container.getBoundingClientRect();
      let xPct = ((ev.clientX - cRect.left) / cRect.width) * 100;
      if (xPct < 5) xPct = 5;
      if (xPct > 95) xPct = 95;
      const yPx = ev.clientY - cRect.top;
      const anchor = captureAnchorAtPoint(ev.clientX, ev.clientY); // 落とした先の最寄り要素を新基準に
      movePin(id!, xPct, yPx, anchor);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

export function renderPins(): void {
  document.querySelectorAll('.fb-pin-marker').forEach((el) => el.remove());

  const container = getContainer();
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }

  // まず各ピンの表示座標を解決（アンカー追従。無ければ pinX/pinY フォールバック）
  const pins = getPins();
  const pos = pins.map((p) => resolvePinPosition(p));

  // 近接ピンをクラスタ化し、重なって見えないよう横に扇状オフセットする（データは変更しない）。
  const FAN_STEP = 26; // px
  const clusters: { x: number; y: number; items: number[] }[] = [];
  pos.forEach((p, i) => {
    let cl = clusters.find((c) => Math.abs(c.x - p.xPct) < 2 && Math.abs(c.y - p.yPx) < 24);
    if (!cl) { cl = { x: p.xPct, y: p.yPx, items: [] }; clusters.push(cl); }
    cl.items.push(i);
  });
  const fanOffset: Record<number, number> = {};
  clusters.forEach((c) => {
    const n = c.items.length;
    c.items.forEach((idx, k) => { fanOffset[idx] = (k - (n - 1) / 2) * FAN_STEP; });
  });

  pins.forEach((comment, idx) => {
    const pin = document.createElement('div');
    pin.className = 'fb-pin-marker' + (comment.resolved ? ' resolved' : '');
    pin.dataset.pinId = comment.id;

    const pc = PRIORITY_COLORS[comment.priority] || PRIORITY_COLORS.want;
    const off = fanOffset[idx] || 0;
    const xPct = pos[idx].xPct;
    // 横オフセットは calc で left に加算（transform は維持されるのでホバー拡大も効く）
    pin.style.left = off ? 'calc(' + xPct + '% + ' + off + 'px)' : xPct + '%';
    pin.style.top = pos[idx].yPx + 'px';
    pin.style.setProperty('--pin-color', pc.bg);

    pin.innerHTML = '<div class="fb-pin-icon" style="background:' + pc.bg + '">' + (idx + 1) + '</div>';

    // ホバー吹き出しは「内容の確認専用」。編集・削除・優先度はピンをクリックして開く編集ポップアップで。
    const tooltip = document.createElement('div');
    tooltip.className = 'fb-pin-tooltip';
    const priLabel = comment.priority.charAt(0).toUpperCase() + comment.priority.slice(1);
    const badge = '<span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;color:#fff;background:' + pc.bg + '">' + priLabel + '</span>';
    const hint = state.pinMode
      ? '<div style="font-size:11px;color:#a3a3a3;margin-top:6px">クリックで編集 / ドラッグで移動</div>'
      : '';
    tooltip.innerHTML = '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">' + badge + '<span style="font-size:11px;color:#737373">' + esc(comment.author) + '</span></div><div style="font-size:13px;color:#0a0a0a;white-space:pre-wrap">' + esc(comment.content) + '</div>' + hint;

    pin.appendChild(tooltip);
    container.appendChild(pin);
  });
}

export function renderPinPopup(onRender: () => void): void {
  let popup = document.getElementById('fb-pin-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'fb-pin-popup';
    popup.className = 'fb-pin-popup';
    document.body.appendChild(popup);
  }

  if (!state.pinPopupPos) {
    popup.classList.remove('show');
    return;
  }

  popup.classList.add('show');

  // 編集対象ピン（あれば編集モード、なければ新規追加モード）
  const editing = state.editingPinId
    ? getPins().find((p) => p.id === state.editingPinId) || null
    : null;

  const container = getContainer();
  const containerRect = container.getBoundingClientRect();
  const absX = (state.pinPopupPos.x / 100) * containerRect.width + containerRect.left;
  const absY = state.pinPopupPos.y + containerRect.top + window.scrollY;

  let h = '<div class="fb-pin-popup-head">' + (editing ? 'コメントを編集' : 'コメントを追加') + '</div>';
  h += '<textarea id="fb-pin-textarea" placeholder="コメントを入力...（Cmd+Enter で' + (editing ? '保存' : '送信') + '）"></textarea>';
  h += '<div class="fb-pin-popup-pri">';
  (['must', 'better', 'want'] as const).forEach((p) => {
    const pc = PRIORITY_COLORS[p];
    h += '<button class="fb-pin-pri-btn" data-pri="' + p + '" style="background:' + pc.bg + ';color:#fff">' + p.charAt(0).toUpperCase() + p.slice(1) + '</button>';
  });
  h += '</div>';
  h += '<div class="fb-pin-popup-actions">';
  if (editing) {
    h += '<button class="fb-pin-delete-btn">削除</button>';
    h += '<button class="fb-pin-submit">保存</button>';
  } else {
    h += '<button class="fb-pin-cancel">キャンセル</button>';
    h += '<button class="fb-pin-submit">送信</button>';
  }
  h += '</div>';

  popup.innerHTML = h;

  const pw = 300, m = 8;
  let top = absY + 24 - window.scrollY;
  if (top + 220 > window.innerHeight) top = absY - 220 - m - window.scrollY;
  let left = absX - pw / 2;
  if (left < m) left = m;
  if (left + pw > window.innerWidth - m) left = window.innerWidth - pw - m;

  popup.style.position = 'fixed';
  popup.style.top = top + 'px';
  popup.style.left = left + 'px';

  const textarea = popup.querySelector('#fb-pin-textarea') as HTMLTextAreaElement;
  textarea.value = editing ? editing.content : '';
  setTimeout(() => textarea?.focus(), 50);

  const priBtns = popup.querySelectorAll('.fb-pin-pri-btn');
  let selectedPri: Priority = editing ? editing.priority : 'better';
  const paintPri = () => priBtns.forEach((b) => {
    (b as HTMLElement).style.opacity = (b as HTMLElement).dataset.pri === selectedPri ? '1' : '0.4';
  });
  priBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedPri = (btn as HTMLElement).dataset.pri as Priority;
      paintPri();
    });
  });
  paintPri();

  const close = () => {
    state.editingPinId = null;
    state.pinPopupPos = null;
    popup!.classList.remove('show');
    onRender();
  };

  const commit = () => {
    if (editing) {
      updatePin(editing.id, textarea.value, selectedPri);
    } else {
      submitPinComment(textarea.value, selectedPri);
    }
    close();
  };

  if (editing) {
    popup.querySelector('.fb-pin-delete-btn')!.addEventListener('click', () => {
      deletePin(editing.id);
      close();
    });
  } else {
    popup.querySelector('.fb-pin-cancel')!.addEventListener('click', () => {
      cancelPinPopup();
      close();
    });
  }

  popup.querySelector('.fb-pin-submit')!.addEventListener('click', commit);

  textarea.addEventListener('keydown', (ev) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') commit();
  });
}
