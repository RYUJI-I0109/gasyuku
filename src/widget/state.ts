import type { Priority, FilterMode } from '../shared/types';
import { USERNAME_KEY, SIDEBAR_WIDTH_KEY } from '../shared/constants';
import { slugify } from '../shared/slug';

export interface QuoteContext {
  beforeText: string;
  afterText: string;
}

export interface FbComment {
  id: string;
  author: string;
  type: string;  // 'comment' | 'pin' など
  quote: string;
  quoteContext: QuoteContext;
  content: string;
  priority: Priority;
  parentId: string | null;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: number | null;
  timestamp: number;
  updatedAt: number | null;
  pageUrl: string;
  projectSlug?: string;
  pinX?: number | null;  // type==='pin' のときコンテナ幅に対する%（フォールバック）
  pinY?: number | null;  // type==='pin' のときコンテナ上端からのpx（フォールバック）
  anchorSelector?: string | null;  // 追従基準の最寄り要素セレクタ
  anchorDx?: number | null;  // 基準要素左上からの相対px（横）
  anchorDy?: number | null;  // 基準要素左上からの相対px（縦）
}

export interface WidgetState {
  username: string;
  comments: FbComment[];
  filter: FilterMode;
  sidebarOpen: boolean;
  selectedText: string;
  selectedQuoteContext: QuoteContext;
  selectedRect: DOMRect | null;
  popupContent: string;
  editingId: string | null;
  editContent: string;
  editPriority: Priority;
  replyingTo: string | null;
  replyText: string;
  editingName: boolean;
  nameInput: string;
  popupPriority: Priority;
  sidebarWidth: number;
  pinMode: boolean;
  pinPopupPos: { x: number; y: number } | null;  // クリック位置（%,px）
  editingPinId: string | null;  // 編集中ピンのID（null=新規ピン追加）
  voiceRecording: boolean;   // 録音中
  voiceProcessing: boolean;  // 音声をGeminiで解析中
  voiceError: string | null; // 直近のエラーメッセージ
}

export const state: WidgetState = {
  username: localStorage.getItem(USERNAME_KEY) || '',
  comments: [],
  filter: 'unresolved',
  sidebarOpen: false,
  selectedText: '',
  selectedQuoteContext: { beforeText: '', afterText: '' },
  selectedRect: null,
  popupContent: '',
  editingId: null,
  editContent: '',
  editPriority: 'want',
  replyingTo: null,
  replyText: '',
  editingName: false,
  nameInput: '',
  popupPriority: 'must',
  sidebarWidth: parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) || '', 10) || 400,
  pinMode: false,
  pinPopupPos: null,
  editingPinId: null,
  voiceRecording: false,
  voiceProcessing: false,
  voiceError: null,
};

export const slug = slugify(window.location.href);
