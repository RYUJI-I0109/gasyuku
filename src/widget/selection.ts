import { state, type QuoteContext } from './state';

export function getQuoteContext(range: Range): QuoteContext {
  let before = '', after = '';
  try {
    const br = document.createRange();
    br.setStart(document.body, 0);
    br.setEnd(range.startContainer, range.startOffset);
    before = br.toString().slice(-50).replace(/[\s\u00A0]+/g, ' ').trim();
    const ar = document.createRange();
    ar.setStart(range.endContainer, range.endOffset);
    ar.setEnd(document.body, document.body.childNodes.length);
    after = ar.toString().slice(0, 50).replace(/[\s\u00A0]+/g, ' ').trim();
  } catch (_) { /* ignore */ }
  return { beforeText: before, afterText: after };
}

export function setupTextSelection(onRender: () => void, closePopup: () => void): void {
  document.addEventListener('mouseup', (e) => {
    if (!state.pinMode) return; // フィードバックモードOFF中は通常のテキスト選択・コピーを邪魔しない
    if ((e.target as HTMLElement).closest('#fb-sidebar,#fb-toggle,#fb-popup')) return;
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || !sel || sel.rangeCount === 0) return; // 名前未設定でも可（送信時に匿名で扱う）
    const range = sel.getRangeAt(0);
    state.selectedText = text.replace(/[\s\u00A0]+/g, ' ').substring(0, 200);
    state.selectedRect = range.getBoundingClientRect();
    state.selectedQuoteContext = getQuoteContext(range);
    state.popupContent = '';
    onRender();
  });
  document.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).closest('#fb-popup')) return;
    if (state.selectedRect) closePopup();
  });
}
