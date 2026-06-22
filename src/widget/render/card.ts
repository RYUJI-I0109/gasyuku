import { PRIORITY_COLORS } from '../../shared/constants';
import { fmtTime } from '../../shared/time';
import { esc } from '../dom';
import { icon } from '../icons';
import { state, type FbComment } from '../state';
import { pinNumber } from '../pin';

export function renderCard(c: FbComment): string {
  const isOwn = c.author === state.username;
  const pc = PRIORITY_COLORS[c.priority] || PRIORITY_COLORS.want;

  let h = '<div class="fb-card' + (c.resolved ? ' resolved' : '') + '" style="border-left-color:' + pc.bg + '" data-id="' + c.id + '">';

  h += '<div class="fb-card-head"><div class="fb-card-head-left">';
  h += '<div class="fb-avatar">' + esc(c.author.charAt(0)) + '</div>';
  h += '<span class="fb-author">' + esc(c.author) + '</span>';
  h += '<span class="fb-time">' + fmtTime(c.timestamp) + '</span>';
  if (c.resolved) h += '<span class="fb-resolved-mark">' + icon('check', 12) + ' 解決済</span>';
  h += '</div>';
  h += '<span class="fb-badge-p' + (isOwn ? ' own' : '') + '" style="background:' + pc.bg + '" data-action="cycle" data-id="' + c.id + '">' + esc(c.priority.charAt(0).toUpperCase() + c.priority.slice(1)) + '</span>';
  h += '</div>';

  if (c.type === 'pin') {
    // ピンは引用の代わりに「📍 #N」インジケータ（クリックで該当ピンへスクロール）
    h += '<div class="fb-pin-ref" data-action="scroll-pin" data-id="' + c.id + '"><span class="fb-pin-ref-badge" style="background:' + pc.bg + '">' + pinNumber(c.id) + '</span>ピンを表示</div>';
  } else if (c.quote) {
    const q = c.quote.length > 100 ? c.quote.substring(0, 100) + '...' : c.quote;
    h += '<div class="fb-quote" style="border-left-color:' + pc.bg + '" data-action="scroll-quote" data-id="' + c.id + '">' + esc(q) + '</div>';
  }

  if (state.editingId === c.id) {
    h += '<div class="fb-edit-area">';
    h += '<div class="fb-edit-pri">';
    (['must', 'better', 'want'] as const).forEach((p) => {
      const sel = state.editPriority === p;
      const pc2 = PRIORITY_COLORS[p];
      h += '<button data-action="set-edit-pri" data-pri="' + p + '" style="' + (sel ? 'background:' + pc2.bg + ';color:#fff;border-color:' + pc2.bg : '') + '">' + p.charAt(0).toUpperCase() + p.slice(1) + '</button>';
    });
    h += '</div>';
    h += '<textarea data-action="edit-textarea">' + esc(state.editContent) + '</textarea>';
    h += '<div class="fb-edit-btns"><button data-action="cancel-edit">キャンセル</button><button class="save" data-action="save-edit" data-id="' + c.id + '">保存</button></div>';
    h += '</div>';
  } else {
    h += '<div class="fb-body">' + esc(c.content) + '</div>';
  }

  if (state.editingId !== c.id) {
    h += '<div class="fb-actions">';
    h += '<button class="fb-act" data-action="reply" data-id="' + c.id + '">' + icon('message', 12) + '返信</button>';
    h += '<button class="fb-act res" data-action="resolve" data-id="' + c.id + '">' + (c.resolved ? icon('rotateCcw', 12) : icon('check', 12)) + (c.resolved ? '戻す' : '解決') + '</button>';
    if (isOwn) h += '<button class="fb-act" data-action="edit" data-id="' + c.id + '">' + icon('pencil', 12) + '編集</button>';
    if (isOwn) h += '<button class="fb-act del" data-action="delete" data-id="' + c.id + '">' + icon('trash', 12) + '削除</button>';
    h += '</div>';
  }

  const replies = state.comments.filter((r) => r.parentId === c.id).sort((a, b) => a.timestamp - b.timestamp);
  if (replies.length > 0) {
    h += '<div class="fb-replies">';
    replies.forEach((r) => {
      const isOwnReply = r.author === state.username;
      h += '<div class="fb-reply-item"><div class="fb-reply-avatar">' + esc(r.author.charAt(0)) + '</div><div style="flex:1;min-width:0"><div class="fb-reply-meta"><strong>' + esc(r.author) + '</strong> &middot; ' + fmtTime(r.timestamp) + '</div>';
      if (state.editingId === r.id) {
        h += '<div class="fb-edit-area"><textarea data-action="edit-textarea">' + esc(state.editContent) + '</textarea><div class="fb-edit-btns"><button data-action="cancel-edit">キャンセル</button><button class="save" data-action="save-edit" data-id="' + r.id + '">保存</button></div></div>';
      } else {
        h += '<div class="fb-reply-text">' + esc(r.content) + '</div>';
        h += '<div class="fb-actions" style="margin-top:4px">';
        h += '<button class="fb-act" data-action="reply" data-id="' + c.id + '">' + icon('message', 12) + '返信</button>';
        if (isOwnReply) h += '<button class="fb-act" data-action="edit" data-id="' + r.id + '">' + icon('pencil', 12) + '編集</button>';
        if (isOwnReply) h += '<button class="fb-act del" data-action="delete-reply" data-id="' + r.id + '">' + icon('trash', 12) + '削除</button>';
        h += '</div>';
      }
      h += '</div></div>';
    });
    h += '</div>';
  }

  if (state.replyingTo === c.id) {
    h += '<div class="fb-reply-input"><textarea placeholder="返信を入力..." data-action="reply-textarea">' + esc(state.replyText) + '</textarea><button data-action="submit-reply" data-id="' + c.id + '"' + (state.replyText.trim() ? '' : ' disabled') + '>送信</button></div>';
  }

  h += '</div>';
  return h;
}
