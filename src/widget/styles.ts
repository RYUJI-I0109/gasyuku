export function injectStyles(): void {
  const style = document.createElement('style');
  style.id = 'fb-widget-styles';
  // ピン型（涙型マーカー）カーソル。先端（下端中央）=ホットスポット 14,26
  const pinCursor =
    `url('data:image/svg+xml,%3Csvg%20xmlns="http://www.w3.org/2000/svg"%20width="28"%20height="28"%20viewBox="0%200%2028%2028"%3E%3Cpath%20d="M14%202a8%208%200%200%200-8%208c0%205.5%208%2016%208%2016s8-10.5%208-16a8%208%200%200%200-8-8Z"%20fill="%233b82f6"%20stroke="%23ffffff"%20stroke-width="1.6"%20stroke-linejoin="round"/%3E%3Ccircle%20cx="14"%20cy="10"%20r="3"%20fill="%23ffffff"/%3E%3C/svg%3E') 14 26, auto`;
  style.textContent = [
    ':root{--fb-bg:#ffffff;--fb-fg:#0a0a0a;--fb-muted:#f5f5f5;--fb-muted-fg:#737373;--fb-border:#e5e5e5;--fb-primary:#171717;--fb-primary-fg:#fafafa;--fb-accent:#3b82f6;--fb-destructive:#ef4444;--fb-font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Hiragino Sans",sans-serif}',

    '#fb-toggle{position:fixed;right:0;top:50%;transform:translateY(-50%);width:36px;background:var(--fb-bg);border:1px solid var(--fb-border);border-right:none;border-radius:8px 0 0 8px;cursor:pointer;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-family:var(--fb-font);transition:all .15s;box-shadow:-2px 0 8px rgba(0,0,0,0.06);padding:8px 0}',
    '#fb-toggle:hover{background:var(--fb-muted);box-shadow:-2px 0 12px rgba(0,0,0,0.1)}',
    '#fb-toggle .fb-toggle-icon{color:var(--fb-muted-fg);display:flex;align-items:center;justify-content:center;position:relative}',
    '#fb-toggle .fb-toggle-label{font-size:10px;color:var(--fb-accent);font-weight:700;writing-mode:vertical-rl;letter-spacing:1px;line-height:1;white-space:nowrap}',
    '#fb-toggle .fb-badge{position:absolute;top:-6px;left:-6px;background:var(--fb-destructive);color:#fff;font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 3px;line-height:1}',

    '#fb-sidebar{position:fixed;top:0;height:100vh;background:rgba(245,245,245,0.5);border-left:1px solid var(--fb-border);z-index:99998;transition:right .3s ease;display:flex;flex-direction:column;font-family:var(--fb-font);font-size:14px;color:var(--fb-fg)}',
    '#fb-sidebar *{box-sizing:border-box}',

    '.fb-resize-handle{position:absolute;left:-3px;top:0;width:6px;height:100%;cursor:col-resize;z-index:1}',
    '.fb-resize-handle:hover{background:rgba(59,130,246,0.15)}',
    '.fb-resize-handle.active{background:rgba(59,130,246,0.3)}',
    'body.fb-resizing{cursor:col-resize !important;-webkit-user-select:none !important;user-select:none !important}',
    'body.fb-resizing *{cursor:col-resize !important}',

    '.fb-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--fb-border)}',
    '.fb-header-left{display:flex;align-items:center;gap:8px}',
    '.fb-header-title{font-size:14px;font-weight:700;color:var(--fb-accent)}',
    '.fb-header-count{background:var(--fb-muted);color:var(--fb-muted-fg);font-size:11px;padding:1px 7px;border-radius:10px}',
    '.fb-header-actions{display:flex;align-items:center;gap:2px}',
    '.fb-hdr-btn{background:none;border:none;cursor:pointer;padding:6px;border-radius:6px;color:var(--fb-muted-fg);transition:all .15s;display:inline-flex;align-items:center;gap:4px;font-family:var(--fb-font);font-size:12px}',
    '.fb-hdr-btn:hover{background:var(--fb-muted);color:var(--fb-fg)}',

    '.fb-user-row{display:flex;align-items:center;padding:8px 16px;border-bottom:1px solid var(--fb-border);font-size:13px;color:var(--fb-muted-fg);cursor:pointer;transition:color .15s;gap:6px}',
    '.fb-user-row:hover{color:var(--fb-fg)}',

    '.fb-filters{display:flex;border-bottom:1px solid var(--fb-border)}',
    '.fb-filter{flex:1;padding:10px 0;text-align:center;font-size:13px;color:var(--fb-muted-fg);border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;font-family:var(--fb-font)}',
    '.fb-filter:hover{color:var(--fb-fg)}',
    '.fb-filter.active{color:var(--fb-fg);border-bottom-color:var(--fb-accent)}',
    '.fb-filter .cnt{font-size:11px;margin-left:4px;padding:1px 5px;border-radius:8px;background:var(--fb-muted);color:var(--fb-muted-fg)}',
    '.fb-filter.active .cnt{background:rgba(59,130,246,0.1);color:var(--fb-accent)}',

    '.fb-list{flex:1;overflow-y:auto;padding:8px}',
    '.fb-empty{text-align:center;padding:60px 20px;color:var(--fb-muted-fg);font-size:13px}',
    '.fb-empty svg{margin:0 auto 12px;display:block;color:var(--fb-border)}',

    '.fb-card{background:var(--fb-bg);border:1px solid var(--fb-border);border-left:3px solid var(--fb-border);border-radius:12px;padding:14px;margin-bottom:6px;transition:box-shadow .3s,background .3s;cursor:pointer}',
    '.fb-card:hover{box-shadow:0 1px 3px rgba(0,0,0,0.05)}',
    '.fb-card.resolved{opacity:.5}',

    '.fb-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}',
    '.fb-card-head-left{display:flex;align-items:center;gap:6px}',
    '.fb-avatar{width:22px;height:22px;border-radius:50%;background:var(--fb-primary);color:var(--fb-primary-fg);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}',
    '.fb-author{font-size:13px;font-weight:700;color:var(--fb-fg)}',
    '.fb-time{font-size:11px;color:var(--fb-muted-fg)}',
    '.fb-resolved-mark{font-size:11px;color:#22c55e;margin-left:4px;display:inline-flex;align-items:center;gap:2px}',

    '.fb-badge-p{font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;color:#fff;cursor:default;transition:all .15s}',
    '.fb-badge-p.own{cursor:pointer}',
    '.fb-badge-p.own:hover{transform:scale(1.1);box-shadow:0 0 0 2px rgba(0,0,0,0.08)}',

    '.fb-quote{font-size:12px;color:var(--fb-muted-fg);padding:6px 10px;background:var(--fb-muted);border-left:2px solid var(--fb-primary);border-radius:0 4px 4px 0;margin-bottom:8px;font-style:italic;line-height:1.5;cursor:pointer;transition:background .15s}',
    '.fb-quote:hover{background:var(--fb-border)}',

    '.fb-body{font-size:13px;color:var(--fb-muted-fg);line-height:1.6;margin-bottom:6px;white-space:pre-wrap}',

    '.fb-actions{display:flex;gap:2px;flex-wrap:wrap}',
    '.fb-act{font-size:12px;color:#a3a3a3;background:none;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:3px;font-family:var(--fb-font)}',
    '.fb-act:hover{color:var(--fb-fg)}',
    '.fb-act.del:hover{color:var(--fb-destructive)}',
    '.fb-act.res:hover{color:#22c55e}',

    '.fb-replies{margin-top:8px;padding-top:8px;border-top:1px solid var(--fb-muted)}',
    '.fb-reply-item{display:flex;gap:8px;padding:6px 0}',
    '.fb-reply-item+.fb-reply-item{border-top:1px solid var(--fb-muted)}',
    '.fb-reply-avatar{width:20px;height:20px;border-radius:50%;background:var(--fb-primary);color:var(--fb-primary-fg);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;margin-top:2px}',
    '.fb-reply-meta{font-size:12px;color:var(--fb-muted-fg);margin-bottom:2px}',
    '.fb-reply-meta strong{color:#525252;font-weight:700}',
    '.fb-reply-text{font-size:13px;color:var(--fb-muted-fg);line-height:1.5}',

    '.fb-reply-input{display:flex;gap:8px;margin-top:8px}',
    '.fb-reply-input textarea{flex:1;padding:8px 10px;border:1px solid var(--fb-border);border-radius:6px;font-size:13px;font-family:var(--fb-font);resize:none;outline:none;min-height:36px;color:var(--fb-fg)}',
    '.fb-reply-input textarea:focus{border-color:var(--fb-accent)}',
    '.fb-reply-input button{padding:6px 14px;background:var(--fb-primary);color:var(--fb-primary-fg);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:var(--fb-font);align-self:flex-end}',
    '.fb-reply-input button:disabled{opacity:.4;cursor:default}',

    '.fb-edit-area textarea{width:100%;padding:8px 10px;border:1px solid var(--fb-border);border-radius:6px;font-size:13px;font-family:var(--fb-font);resize:vertical;outline:none;min-height:50px;margin-bottom:6px;color:var(--fb-fg)}',
    '.fb-edit-area textarea:focus{border-color:var(--fb-accent)}',
    '.fb-edit-btns{display:flex;gap:6px}',
    '.fb-edit-btns button{padding:4px 12px;border-radius:6px;font-size:12px;cursor:pointer;border:1px solid var(--fb-border);background:var(--fb-bg);color:var(--fb-muted-fg);font-family:var(--fb-font)}',
    '.fb-edit-btns button.save{background:var(--fb-primary);color:var(--fb-primary-fg);border-color:var(--fb-primary)}',
    '.fb-edit-pri{display:flex;gap:4px;margin-bottom:6px}',
    '.fb-edit-pri button{padding:2px 10px;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid var(--fb-border);background:var(--fb-bg);color:var(--fb-muted-fg);font-family:var(--fb-font);transition:all .15s}',

    '.fb-popup{position:fixed;z-index:100000;width:400px;background:var(--fb-bg);border:1px solid var(--fb-border);border-radius:12px;padding:16px;box-shadow:0 10px 25px rgba(0,0,0,0.1);font-family:var(--fb-font);display:none}',
    '.fb-popup.show{display:block}',
    '.fb-popup-head{margin-bottom:10px}',
    '.fb-popup-head span{font-size:14px;font-weight:700;color:var(--fb-fg)}',
    '.fb-popup-quote{font-size:13px;color:var(--fb-muted-fg);padding:8px 12px;background:var(--fb-muted);border-left:2px solid var(--fb-accent);border-radius:0 6px 6px 0;margin-bottom:10px;font-style:italic;line-height:1.5}',
    '.fb-popup textarea{width:100%;min-height:70px;padding:10px 12px;border:1px solid var(--fb-border);border-radius:8px;font-size:14px;font-family:var(--fb-font);resize:vertical;outline:none;margin-bottom:10px;color:var(--fb-fg)}',
    '.fb-popup textarea:focus{border-color:var(--fb-accent)}',
    '.fb-popup textarea::placeholder{color:var(--fb-muted-fg)}',
    '.fb-popup-pri{display:flex;gap:6px;margin-bottom:10px}',
    '.fb-popup-pri button{flex:1;padding:7px 8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:2px solid transparent;transition:all .15s;font-family:var(--fb-font)}',
    '.fb-popup-actions{display:flex;gap:8px;justify-content:flex-end}',
    '.fb-popup-actions button{padding:8px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;font-family:var(--fb-font)}',
    '.fb-popup-actions .cancel{background:none;border:1px solid var(--fb-border);color:var(--fb-muted-fg)}',
    '.fb-popup-actions .cancel:hover{background:var(--fb-muted);color:var(--fb-fg)}',
    '.fb-popup-actions .submit{border:none;color:#fff}',

    '.fb-name-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:100001}',
    '.fb-name-box{background:var(--fb-bg);border-radius:12px;padding:28px;width:360px;box-shadow:0 20px 40px rgba(0,0,0,0.15)}',
    '.fb-name-box h2{font-size:18px;font-weight:700;margin:0 0 6px;color:var(--fb-fg)}',
    '.fb-name-box p{font-size:14px;color:var(--fb-muted-fg);margin:0 0 16px}',
    '.fb-name-box input{width:100%;padding:10px 14px;border:1px solid var(--fb-border);border-radius:8px;font-size:15px;outline:none;margin-bottom:12px;font-family:var(--fb-font);color:var(--fb-fg)}',
    '.fb-name-box input:focus{border-color:var(--fb-accent)}',
    '.fb-name-box input::placeholder{color:var(--fb-muted-fg)}',
    '.fb-name-box button{width:100%;padding:10px;background:var(--fb-primary);color:var(--fb-primary-fg);border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--fb-font)}',
    '.fb-name-box button:disabled{opacity:.4;cursor:default}',

    '.fb-name-input{width:100%;padding:4px 8px;border:1px solid var(--fb-border);border-radius:4px;font-size:12px;outline:none;font-family:var(--fb-font);color:var(--fb-fg)}',
    '.fb-name-input:focus{border-color:var(--fb-accent)}',

    '.fb-highlight{padding:1px 0;cursor:pointer;transition:background .15s}',
    '.fb-highlight-must{background:rgba(239,68,68,0.15);border-bottom:2px solid #ef4444}',
    '.fb-highlight-must:hover{background:rgba(239,68,68,0.25)}',
    '.fb-highlight-better{background:rgba(245,158,11,0.15);border-bottom:2px solid #f59e0b}',
    '.fb-highlight-better:hover{background:rgba(245,158,11,0.25)}',
    '.fb-highlight-want{background:rgba(34,197,94,0.15);border-bottom:2px solid #22c55e}',
    '.fb-highlight-want:hover{background:rgba(34,197,94,0.25)}',

    '@keyframes fb-pulse{0%,100%{opacity:1}50%{opacity:0.4}}',
    '.fb-highlight.fb-pulse{animation:fb-pulse 1s ease-in-out infinite}',
    '.fb-card.fb-focused{box-shadow:0 0 0 2px var(--fb-accent);background:rgba(59,130,246,0.04)}',

    '#fb-sidebar svg,#fb-toggle svg,.fb-popup svg{pointer-events:none}',

    // Pin mode styles
    'body.fb-pin-mode{cursor:' + pinCursor + '}',
    'body.fb-pin-mode *:not(#fb-toggle):not(#fb-toggle *):not(#fb-sidebar):not(#fb-sidebar *):not(#fb-pin-popup):not(#fb-pin-popup *):not(.fb-pin-marker):not(.fb-pin-marker *){cursor:' + pinCursor + '}',

    '.fb-toggle-pin{display:flex;align-items:center;justify-content:center;padding:4px;cursor:pointer;transition:all .15s}',
    '.fb-toggle-pin:hover{color:var(--fb-accent)}',

    // Voice (mic) button
    '.fb-toggle-voice{display:flex;align-items:center;justify-content:center;padding:4px;cursor:pointer;color:var(--fb-muted-fg);border-radius:4px;transition:all .15s}',
    '.fb-toggle-voice:hover{color:var(--fb-accent)}',
    '.fb-toggle-voice.recording{color:#ef4444;background:rgba(239,68,68,0.12);animation:fb-mic-pulse 1.1s ease-in-out infinite}',
    '.fb-toggle-voice.processing{color:var(--fb-accent)}',
    '.fb-toggle-voice.processing svg{animation:fb-mic-spin .8s linear infinite;transform-origin:center}',
    '@keyframes fb-mic-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)}50%{box-shadow:0 0 0 5px rgba(239,68,68,0)}}',
    '@keyframes fb-mic-spin{to{transform:rotate(360deg)}}',

    '.fb-pin-marker{position:absolute;transform:translate(-50%,-100%);cursor:pointer;z-index:99990;transition:transform .15s}',
    '.fb-pin-marker:hover{transform:translate(-50%,-100%) scale(1.15)}',
    // フィードバックモードON中はピンを掴んで移動できることを示す
    'body.fb-pin-mode .fb-pin-marker{cursor:grab}',
    'body.fb-dragging-pin,body.fb-dragging-pin *{cursor:grabbing !important;-webkit-user-select:none !important;user-select:none !important}',
    // ドラッグ中はホバー拡大アニメを止めてカクつきを防ぐ
    'body.fb-dragging-pin .fb-pin-marker{transition:none}',
    'body.fb-dragging-pin .fb-pin-tooltip{display:none !important}',
    // ホバー吹き出しの優先度バッジ（クリックで循環）
    '.fb-pin-badge{cursor:pointer;transition:transform .1s}',
    '.fb-pin-badge:hover{transform:scale(1.08)}',
    '.fb-pin-badge.readonly{cursor:default}',
    '.fb-pin-icon{width:24px;height:24px;border-radius:50%;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);position:relative}',
    '.fb-pin-icon::after{content:"";position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--pin-color,#3b82f6)}',

    '.fb-pin-tooltip{display:none;position:absolute;top:8px;left:28px;background:var(--fb-bg);border:1px solid var(--fb-border);border-radius:8px;padding:10px 12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);min-width:180px;max-width:280px;z-index:99995;font-family:var(--fb-font)}',
    '.fb-pin-marker:hover .fb-pin-tooltip{display:block}',
    '.fb-pin-delete{position:absolute;top:4px;right:4px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.5);color:#fff;border:none;font-size:13px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s}',
    '.fb-pin-tooltip:hover .fb-pin-delete{opacity:1}',

    '.fb-pin-popup{position:fixed;z-index:100000;width:300px;background:var(--fb-bg);border:1px solid var(--fb-border);border-radius:12px;padding:16px;box-shadow:0 10px 25px rgba(0,0,0,0.12);font-family:var(--fb-font);display:none}',
    '.fb-pin-popup.show{display:block}',
    '.fb-pin-popup-head{font-size:14px;font-weight:700;color:var(--fb-fg);margin-bottom:10px}',
    '.fb-pin-popup textarea{width:100%;min-height:60px;padding:10px 12px;border:1px solid var(--fb-border);border-radius:8px;font-size:14px;font-family:var(--fb-font);resize:vertical;outline:none;margin-bottom:10px;color:var(--fb-fg);box-sizing:border-box}',
    '.fb-pin-popup textarea:focus{border-color:var(--fb-accent)}',
    '.fb-pin-popup textarea::placeholder{color:var(--fb-muted-fg)}',
    '.fb-pin-popup-pri{display:flex;gap:6px;margin-bottom:10px}',
    '.fb-pin-pri-btn{flex:1;padding:6px 8px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:opacity .15s}',
    '.fb-pin-popup-actions{display:flex;gap:8px;justify-content:flex-end}',
    '.fb-pin-popup-actions button{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;font-family:var(--fb-font)}',
    '.fb-pin-cancel{background:none;border:1px solid var(--fb-border);color:var(--fb-muted-fg)}',
    '.fb-pin-cancel:hover{background:var(--fb-muted);color:var(--fb-fg)}',
    '.fb-pin-submit{background:var(--fb-accent);border:none;color:#fff}',
    '.fb-pin-submit:hover{background:#2563eb}',
  ].join('\n');
  document.head.appendChild(style);
}
