import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Add it to .env.local');
    process.exit(1);
  }

  const sql = neon(url);

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      author TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'comment',
      quote TEXT NOT NULL DEFAULT '',
      quote_context_before TEXT NOT NULL DEFAULT '',
      quote_context_after TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'want',
      parent_id TEXT,
      resolved BOOLEAN NOT NULL DEFAULT false,
      resolved_by TEXT,
      resolved_at BIGINT,
      timestamp BIGINT NOT NULL,
      updated_at BIGINT,
      page_url TEXT NOT NULL,
      project_slug TEXT NOT NULL
    )
  `;

  // ピンコメント用の座標列（既存テーブルにも安全に追加できるよう冪等）
  await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS pin_x DOUBLE PRECISION`;
  await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS pin_y DOUBLE PRECISION`;

  // 要素アンカー方式（レスポンシブ追従）: 最寄り要素のセレクタ＋その要素からの相対オフセット
  await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS anchor_selector TEXT`;
  await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS anchor_dx DOUBLE PRECISION`;
  await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS anchor_dy DOUBLE PRECISION`;

  await sql`CREATE INDEX IF NOT EXISTS idx_comments_project ON comments (project_slug)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id)`;

  console.log('Migration complete.');
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
