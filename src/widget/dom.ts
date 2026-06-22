type Attrs = Record<string, unknown>;

export function el(tag: string, attrs?: Attrs | null, children?: string | Node | (Node | null)[] | null): HTMLElement {
  const e = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach((k) => {
    const v = attrs[k];
    if (k === 'className') e.className = v as string;
    else if (k === 'innerHTML') e.innerHTML = v as string;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.substring(2).toLowerCase(), v as EventListener);
    else e.setAttribute(k, String(v));
  });
  if (children != null) {
    if (typeof children === 'string') e.textContent = children;
    else if (Array.isArray(children)) children.forEach((c) => { if (c) e.appendChild(c); });
    else e.appendChild(children);
  }
  return e;
}

export function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
