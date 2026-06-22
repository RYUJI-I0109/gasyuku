export type Priority = 'must' | 'better' | 'want';

export type CommentType = 'comment' | 'strikethrough' | 'pin';

export interface Comment {
  id: string;
  author: string;
  type: CommentType;
  quote: string;
  quoteContext: { beforeText: string; afterText: string };
  content: string;
  priority: Priority;
  parentId: string | null;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: number | null;
  timestamp: number;
  updatedAt: number | null;
  pageUrl: string;
  pinX: number | null;  // type==='pin' のときコンテナ幅に対する%（フォールバック）
  pinY: number | null;  // type==='pin' のときコンテナ上端からのpx（フォールバック）
  anchorSelector: string | null;  // 追従の基準にする最寄り要素の CSS セレクタ
  anchorDx: number | null;  // 基準要素の左上からの相対px（横）
  anchorDy: number | null;  // 基準要素の左上からの相対px（縦）
}

export type FilterMode = 'unresolved' | 'resolved' | 'all';
