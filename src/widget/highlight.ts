import { state, type FbComment } from './state';

function collectTextNodes(): Text[] {
  const nodes: Text[] = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (p.tagName === 'SCRIPT' || p.tagName === 'STYLE') return NodeFilter.FILTER_REJECT;
      if (p.closest('#fb-sidebar,#fb-toggle,#fb-popup,.fb-highlight')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let n: Node | null;
  while ((n = tw.nextNode())) nodes.push(n as Text);
  return nodes;
}

export function mapNormToOrig(orig: string, normStart: number, normEnd: number): [number, number] | null {
  const normalized = orig.replace(/[\s\u00A0]+/g, ' ');
  if (normStart >= normalized.length) return null;
  let origIdx = 0, normIdx = 0;
  let origStart = -1, origEnd = -1;
  while (origIdx < orig.length) {
    if (normIdx === normStart && origStart === -1) origStart = origIdx;
    if (normIdx === normEnd) { origEnd = origIdx; break; }
    if (normIdx < normalized.length && orig[origIdx] === normalized[normIdx]) {
      origIdx++; normIdx++;
    } else {
      origIdx++;
    }
  }
  if (origEnd === -1 && normIdx >= normEnd) origEnd = origIdx;
  if (origStart === -1 || origEnd === -1 || origStart >= origEnd) return null;
  return [origStart, origEnd];
}

function wrapTextRange(node: Text, start: number, end: number, comment: FbComment, onClickHighlight: (id: string) => void): void {
  const orig = node.textContent!;
  const before = document.createTextNode(orig.substring(0, start));
  const mark = document.createElement('mark');
  mark.className = 'fb-highlight fb-highlight-' + comment.priority;
  mark.dataset.commentId = comment.id;
  mark.textContent = orig.substring(start, end);
  mark.addEventListener('click', () => { onClickHighlight(comment.id); });
  const after = document.createTextNode(orig.substring(end));
  node.parentNode!.insertBefore(before, node);
  node.parentNode!.insertBefore(mark, node);
  node.parentNode!.insertBefore(after, node);
  node.parentNode!.removeChild(node);
}

export function applyHighlights(onClickHighlight: (id: string) => void): void {
  document.querySelectorAll('.fb-highlight').forEach((el) => {
    const t = document.createTextNode(el.textContent || '');
    el.parentNode!.replaceChild(t, el);
  });
  document.body.normalize();

  state.comments.filter((c) => !c.parentId && !c.resolved && c.quote && c.quote.length >= 2).forEach((c) => {
    const search = c.quote.replace(/[\s\u00A0]+/g, ' ').trim();
    const textNodes = collectTextNodes();
    let found = false;

    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      const orig = node.textContent!;

      const di = orig.indexOf(search);
      if (di !== -1) {
        try { wrapTextRange(node, di, di + search.length, c, onClickHighlight); found = true; } catch (_) { /* ignore */ }
        break;
      }

      const norm = orig.replace(/[\s\u00A0]+/g, ' ');
      const ni = norm.indexOf(search);
      if (ni === -1) continue;
      const range = mapNormToOrig(orig, ni, ni + search.length);
      if (range) {
        try { wrapTextRange(node, range[0], range[1], c, onClickHighlight); found = true; } catch (_) { /* ignore */ }
        break;
      }
    }

    if (!found) {
      let concat = '';
      const nodeMap: Array<{ node: Text; start: number; end: number }> = [];
      for (let j = 0; j < textNodes.length; j++) {
        const s = concat.length;
        concat += textNodes[j].textContent;
        nodeMap.push({ node: textNodes[j], start: s, end: concat.length });
      }
      const concatNorm = concat.replace(/[\s\u00A0]+/g, ' ');
      const ci = concatNorm.indexOf(search);
      if (ci !== -1) {
        const range = mapNormToOrig(concat, ci, ci + search.length);
        if (range) {
          const mStart = range[0], mEnd = range[1];
          for (let k = nodeMap.length - 1; k >= 0; k--) {
            const nm = nodeMap[k];
            if (nm.end <= mStart || nm.start >= mEnd) continue;
            const ls = Math.max(0, mStart - nm.start);
            const le = Math.min(nm.node.textContent!.length, mEnd - nm.start);
            try { wrapTextRange(nm.node, ls, le, c, onClickHighlight); } catch (_) { /* ignore */ }
          }
        }
      }
    }
  });
}
