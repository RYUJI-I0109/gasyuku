import { authHeaders } from '../shared/api-client';

let apiBase = '';
let apiToken = '';

export function initApi(base: string, token: string): void {
  apiBase = base;
  apiToken = token;
}

export function api(method: string, params: Record<string, unknown>): Promise<unknown> {
  let url = apiBase + '/api/comments';
  const hdrs = authHeaders(apiToken);
  const opts: RequestInit = { method, headers: hdrs };
  if (method === 'GET') {
    url += '?slug=' + encodeURIComponent(params.slug as string);
  } else if (method === 'DELETE') {
    url += '?id=' + encodeURIComponent(params.id as string);
  } else {
    opts.body = JSON.stringify(params);
  }
  return fetch(url, opts).then((r) => r.json());
}

/**
 * 録音した音声(base64) + セクション一覧を /api/voice-analyze に送り、
 * Gemini が「文字起こし＋セクション振り分け」した結果を受け取る。
 * 返り値: { results: { section_index, comment, priority }[] } または { error }
 */
export function voiceApi(
  audioBase64: string,
  mimeType: string,
  sections: { index: number; title: string }[],
): Promise<{ results?: { section_index: number; comment: string; priority: string }[]; error?: string }> {
  return fetch(apiBase + '/api/voice-analyze', {
    method: 'POST',
    headers: authHeaders(apiToken),
    body: JSON.stringify({ audioBase64, mimeType, sections }),
  }).then((r) => r.json());
}
