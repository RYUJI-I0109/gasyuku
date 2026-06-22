import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { Comment } from '@/shared/types';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders() });
}

function verifyToken(request: NextRequest): boolean {
  const token = process.env.API_TOKEN;
  if (!token) return true; // トークン未設定時はスキップ（開発環境向け）

  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return false;

  return auth.slice(7) === token;
}

export async function GET(request: NextRequest) {
  if (!verifyToken(request)) return json({ error: 'Unauthorized' }, 403);
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return json({ error: 'slug is required' }, 400);

  const sql = getDb();
  const rows = await sql`
    SELECT * FROM comments WHERE project_slug = ${slug} ORDER BY timestamp ASC
  `;

  return json(rows.map(toComment));
}

export async function POST(request: NextRequest) {
  if (!verifyToken(request)) return json({ error: 'Unauthorized' }, 403);
  const body = await request.json();
  const { id, author, type, quote, quoteContext, content, priority, parentId, pageUrl, projectSlug, timestamp, pinX, pinY, anchorSelector, anchorDx, anchorDy } = body;

  if (!id || !author || !projectSlug) return json({ error: 'Missing required fields' }, 400);

  const sql = getDb();
  await sql`
    INSERT INTO comments (id, author, type, quote, quote_context_before, quote_context_after, content, priority, parent_id, page_url, project_slug, timestamp, pin_x, pin_y, anchor_selector, anchor_dx, anchor_dy)
    VALUES (${id}, ${author}, ${type || 'comment'}, ${quote || ''}, ${quoteContext?.beforeText || ''}, ${quoteContext?.afterText || ''}, ${content || ''}, ${priority || 'want'}, ${parentId || null}, ${pageUrl || ''}, ${projectSlug}, ${timestamp || Date.now()}, ${pinX ?? null}, ${pinY ?? null}, ${anchorSelector ?? null}, ${anchorDx ?? null}, ${anchorDy ?? null})
  `;

  return json({ ok: true });
}

type PutAction = 'edit' | 'resolve' | 'cyclePriority' | 'rename' | 'move';

export async function PUT(request: NextRequest) {
  if (!verifyToken(request)) return json({ error: 'Unauthorized' }, 403);
  const body = await request.json();
  const { id, action } = body as { id: string; action: PutAction; [key: string]: unknown };

  if (!id) return json({ error: 'id is required' }, 400);
  if (!action) return json({ error: 'action is required' }, 400);

  const sql = getDb();

  switch (action) {
    case 'edit': {
      const { content, priority } = body;
      if (content === undefined || priority === undefined) return json({ error: 'content and priority are required for edit' }, 400);
      await sql`
        UPDATE comments SET content = ${content}, priority = ${priority}, updated_at = ${Date.now()} WHERE id = ${id}
      `;
      break;
    }
    case 'resolve': {
      const { resolved, resolvedBy, resolvedAt } = body;
      await sql`
        UPDATE comments SET resolved = ${resolved}, resolved_by = ${resolvedBy || null}, resolved_at = ${resolvedAt || null} WHERE id = ${id}
      `;
      break;
    }
    case 'cyclePriority': {
      const { priority } = body;
      if (!priority) return json({ error: 'priority is required for cyclePriority' }, 400);
      await sql`
        UPDATE comments SET priority = ${priority} WHERE id = ${id}
      `;
      break;
    }
    case 'rename': {
      const { author, oldAuthor, projectSlug } = body;
      if (!author || !oldAuthor || !projectSlug) return json({ error: 'author, oldAuthor, projectSlug are required for rename' }, 400);
      await sql`
        UPDATE comments SET author = ${author} WHERE project_slug = ${projectSlug} AND author = ${oldAuthor}
      `;
      break;
    }
    case 'move': {
      const { pinX, pinY, anchorSelector, anchorDx, anchorDy } = body;
      if (pinX === undefined || pinY === undefined) return json({ error: 'pinX and pinY are required for move' }, 400);
      await sql`
        UPDATE comments SET pin_x = ${pinX}, pin_y = ${pinY}, anchor_selector = ${anchorSelector ?? null}, anchor_dx = ${anchorDx ?? null}, anchor_dy = ${anchorDy ?? null}, updated_at = ${Date.now()} WHERE id = ${id}
      `;
      break;
    }
    default:
      return json({ error: `Unknown action: ${action}` }, 400);
  }

  return json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!verifyToken(request)) return json({ error: 'Unauthorized' }, 403);
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return json({ error: 'id is required' }, 400);

  const sql = getDb();
  await sql`DELETE FROM comments WHERE id = ${id} OR parent_id = ${id}`;

  return json({ ok: true });
}

function toComment(row: Record<string, unknown>): Comment {
  return {
    id: row.id as string,
    author: row.author as string,
    type: (row.type as Comment['type']) || 'comment',
    quote: (row.quote as string) || '',
    quoteContext: {
      beforeText: (row.quote_context_before as string) || '',
      afterText: (row.quote_context_after as string) || '',
    },
    content: (row.content as string) || '',
    priority: (row.priority as Comment['priority']) || 'want',
    parentId: (row.parent_id as string) || null,
    resolved: (row.resolved as boolean) || false,
    resolvedBy: (row.resolved_by as string) || null,
    resolvedAt: row.resolved_at ? Number(row.resolved_at) : null,
    timestamp: Number(row.timestamp),
    updatedAt: row.updated_at ? Number(row.updated_at) : null,
    pageUrl: (row.page_url as string) || '',
    pinX: row.pin_x != null ? Number(row.pin_x) : null,
    pinY: row.pin_y != null ? Number(row.pin_y) : null,
    anchorSelector: (row.anchor_selector as string) || null,
    anchorDx: row.anchor_dx != null ? Number(row.anchor_dx) : null,
    anchorDy: row.anchor_dy != null ? Number(row.anchor_dy) : null,
  };
}
