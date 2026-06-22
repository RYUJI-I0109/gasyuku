import { USERNAME_KEY } from '../../shared/constants';
import { el } from '../dom';
import { state } from '../state';

export function renderNameDialog(onRender: () => void): void {
  const existing = document.getElementById('fb-name-overlay');
  if (state.username) { if (existing) existing.remove(); return; }
  if (existing) return;
  const overlay = el('div', { id: 'fb-name-overlay', className: 'fb-name-overlay' });
  overlay.innerHTML = '<div class="fb-name-box"><h2>ようこそ</h2><p>コメントに表示される名前を入力してください。</p><input placeholder="例: 田中太郎" id="fb-name-field"><button id="fb-name-submit" disabled>始める</button></div>';
  document.body.appendChild(overlay);
  const input = document.getElementById('fb-name-field') as HTMLInputElement;
  const btn = document.getElementById('fb-name-submit') as HTMLButtonElement;
  input.addEventListener('input', () => { btn.disabled = !input.value.trim(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value.trim()) { setName(input.value.trim(), onRender); } });
  btn.addEventListener('click', () => { if (input.value.trim()) setName(input.value.trim(), onRender); });
  setTimeout(() => { input.focus(); }, 100);
}

function setName(name: string, onRender: () => void): void {
  state.username = name;
  localStorage.setItem(USERNAME_KEY, name);
  const overlay = document.getElementById('fb-name-overlay');
  if (overlay) overlay.remove();
  onRender();
}
