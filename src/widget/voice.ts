import type { Priority } from '../shared/types';
import { state } from './state';
import { addPinComment, renderPins, elementToPinCoords } from './pin';
import { voiceApi } from './api';

interface Section {
  index: number;
  title: string;
  x: number; // ピン座標系（%）
  y: number; // ピン座標系（px）
}

let mediaRecorder: MediaRecorder | null = null;
let chunks: BlobPart[] = [];
let stream: MediaStream | null = null;
let onChange: () => void = () => {};

/** 録音状態が変わったときに UI を再描画させるためのコールバックを登録する。 */
export function setVoiceOnChange(cb: () => void): void {
  onChange = cb;
}

function getContainer(): HTMLElement {
  return document.querySelector('main') || document.body;
}

/**
 * ページの見出し構造を抽出し、各セクションの「タイトル＋ピン座標」を返す。
 * Gemini にはタイトルだけ渡し、座標は配置時にこちら側で使う。
 */
export function extractSections(): Section[] {
  const container = getContainer();
  const nodes = Array.from(container.querySelectorAll('h1,h2,h3,h4')) as HTMLElement[];
  const sections: Section[] = [];
  nodes.forEach((node) => {
    const title = (node.textContent || '').trim();
    if (!title) return;
    const { x, y } = elementToPinCoords(node);
    sections.push({ index: sections.length, title, x, y });
  });
  return sections;
}

export function toggleRecording(): void {
  if (state.voiceProcessing) return;
  if (state.voiceRecording) {
    stopRecording();
  } else {
    void startRecording();
  }
}

export async function startRecording(): Promise<void> {
  if (state.voiceRecording || state.voiceProcessing) return;
  state.voiceError = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    state.voiceError = 'マイクへのアクセスが許可されませんでした';
    onChange();
    return;
  }

  chunks = [];
  const mime = pickMime();
  mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  mediaRecorder.onstop = () => {
    void handleStop();
  };
  mediaRecorder.start();

  state.voiceRecording = true;
  onChange();
}

export function stopRecording(): void {
  if (!state.voiceRecording || !mediaRecorder) return;
  mediaRecorder.stop();
  state.voiceRecording = false;
  state.voiceProcessing = true;
  onChange();
}

async function handleStop(): Promise<void> {
  // マイクを解放
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;

  const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
  chunks = [];

  const sections = extractSections();
  if (sections.length === 0) {
    state.voiceError = 'セクション（見出し）が見つかりませんでした';
    state.voiceProcessing = false;
    onChange();
    return;
  }

  try {
    // 録音(webm/mp4等) を Gemini が確実に扱える 16kHz モノラル WAV に変換して送る
    const base64 = await blobToWavBase64(blob);
    const resp = await voiceApi(
      base64,
      'audio/wav',
      sections.map((s) => ({ index: s.index, title: s.title })),
    );
    if (resp.error) {
      state.voiceError = resp.error;
    } else {
      placePins(resp.results || [], sections);
    }
  } catch {
    state.voiceError = '音声の解析に失敗しました';
  } finally {
    state.voiceProcessing = false;
    onChange();
  }
}

function placePins(
  results: { section_index: number; comment: string; priority: string }[],
  sections: Section[],
): void {
  if (!Array.isArray(results) || results.length === 0) {
    state.voiceError = 'フィードバックを聞き取れませんでした。もう一度お試しください';
    return;
  }
  results.forEach((r) => {
    const sec = sections.find((s) => s.index === r.section_index) || sections[0];
    if (!sec) return;
    addPinComment(sec.x, sec.y, r.comment, normalizePriority(r.priority));
  });
  renderPins();
}

function normalizePriority(p: string): Priority {
  return p === 'must' || p === 'better' || p === 'want' ? p : 'better';
}

/** MediaRecorder が対応する音声形式を優先順に選ぶ。 */
function pickMime(): string {
  const cands = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4'];
  for (const c of cands) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return '';
}

/**
 * 録音 Blob を 16kHz モノラルの WAV (base64) に変換する。
 * Gemini の対応音声形式（wav/mp3/aiff/aac/ogg/flac）に確実に乗せ、
 * かつ 16kHz モノラルに落としてペイロードを小さくする。
 */
async function blobToWavBase64(blob: Blob): Promise<string> {
  const arrayBuf = await blob.arrayBuffer();
  const AudioCtx: typeof AudioContext =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(arrayBuf);
  } finally {
    void ctx.close();
  }

  const targetRate = 16000;
  const length = Math.max(1, Math.ceil(decoded.duration * targetRate));
  // チャンネル数1の出力に繋ぐと自動でモノラルにダウンミックスされる
  const offline = new OfflineAudioContext(1, length, targetRate);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();

  const wav = encodeWav(rendered.getChannelData(0), targetRate);
  return arrayBufferToBase64(wav);
}

/** Float32 PCM を 16bit モノラル WAV (ArrayBuffer) にエンコードする。 */
function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);     // PCM チャンクサイズ
  view.setUint16(20, 1, true);      // PCM
  view.setUint16(22, 1, true);      // モノラル
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byteRate = rate * blockAlign
  view.setUint16(32, 2, true);      // blockAlign = ch * bytesPerSample
  view.setUint16(34, 16, true);     // bitsPerSample
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return buffer;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
