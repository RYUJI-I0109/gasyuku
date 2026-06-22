import { el } from '../dom';
import { icon } from '../icons';
import { state } from '../state';

let _onToggleArea: (() => void) | null = null;
let _onVoice: (() => void) | null = null;

export function setToggleAreaHandler(handler: () => void): void {
  _onToggleArea = handler;
}

export function setToggleVoiceHandler(handler: () => void): void {
  _onVoice = handler;
}

export function renderToggle(toggleSidebar: () => void): void {
  let btn = document.getElementById('fb-toggle');
  if (!btn) {
    btn = el('button', { id: 'fb-toggle' });
    btn.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
      if (target?.dataset.action === 'area-mode') {
        _onToggleArea?.();
      } else if (target?.dataset.action === 'voice') {
        _onVoice?.();
      } else {
        toggleSidebar();
      }
    });
    document.body.appendChild(btn);
  }
  const unresolvedCount = state.comments.filter((c) => !c.parentId && !c.resolved).length;
  const pinCount = state.pinComments.length;
  let h = '<span class="fb-toggle-icon">' + icon('panelRight', 16);
  if (unresolvedCount > 0) h += '<span class="fb-badge">' + unresolvedCount + '</span>';
  h += '</span>';
  const pinStyle = state.pinMode ? 'color:var(--fb-accent);background:rgba(59,130,246,0.1);border-radius:4px' : '';
  const pinTitle = state.pinMode
    ? 'フィードバックモード ON（クリックで終了）／クリック=ピン・ドラッグ=引用'
    : 'フィードバックモード OFF（クリックで開始）';
  h += '<span class="fb-toggle-pin" data-action="area-mode" style="' + pinStyle + '" title="' + pinTitle + '">'
    + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10"/><circle cx="12" cy="14" r="2"/><path d="M12 16v6"/></svg>';
  if (pinCount > 0) h += '<span style="font-size:9px;font-weight:700;color:var(--fb-accent);margin-left:1px">' + pinCount + '</span>';
  h += '</span>';
  const voiceCls = state.voiceRecording ? ' recording' : state.voiceProcessing ? ' processing' : '';
  const voiceTitle = state.voiceRecording ? '録音中（クリックで停止して解析）' : state.voiceProcessing ? '解析中...' : '音声でフィードバック';
  // 解析中はマイクではなくスピナー（円形ローダー）を回す
  const voiceIcon = state.voiceProcessing ? icon('loader', 14) : icon('mic', 14);
  h += '<span class="fb-toggle-voice' + voiceCls + '" data-action="voice" title="' + voiceTitle + '">' + voiceIcon + '</span>';
  h += '<span class="fb-toggle-label">コメント</span>';
  btn.innerHTML = h;
  btn.style.display = state.sidebarOpen ? 'none' : '';
}
