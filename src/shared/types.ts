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
  pinX: number | null;  // type==='pin' のときコンテナ幅に対する%
  pinY: number | null;  // type==='pin' のときコンテナ上端からのpx
}

export type FilterMode = 'unresolved' | 'resolved' | 'all';
