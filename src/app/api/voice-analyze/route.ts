import { NextRequest, NextResponse } from 'next/server';

// 音声ファイルを base64 で受けるため body サイズ上限を緩める
export const maxDuration = 60;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  if (!token) return true; // 未設定時はスキップ（開発環境向け）
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  return auth.slice(7) === token;
}

interface Section {
  index: number;
  title: string;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Gemini に JSON 配列で返させるためのスキーマ
const RESPONSE_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      section_index: { type: 'INTEGER' },
      comment: { type: 'STRING' },
      priority: { type: 'STRING', enum: ['must', 'better', 'want'] },
    },
    required: ['section_index', 'comment', 'priority'],
  },
};

function buildPrompt(sections: Section[]): string {
  const list = sections.map((s) => `${s.index}: ${s.title}`).join('\n');
  return [
    'あなたは図解レビューのフィードバック解析AIです。',
    'ユーザーが音声で話したフィードバックを聞き取り、図解の各セクションに対応付けてください。',
    '',
    '# 図解のセクション一覧（index: 見出し）',
    list,
    '',
    '# 指示',
    '- 音声を聞き、言及されている指摘・要望・感想を1件ずつ抽出する',
    '- 各指摘が上記のどのセクションに対するものか section_index で示す（曖昧なら最も近いもの）',
    '- comment はユーザーの意図を簡潔にまとめた日本語にする',
    '- priority は次の基準で割り当てる: 修正が必須=must / 改善してほしい=better / 軽微な要望や肯定的な発言=want',
    '- 「ここはOK」「良い」などの肯定的な発言も want として記録する',
    '- 指摘が複数あれば配列で複数返す。何も聞き取れなければ空配列を返す',
  ].join('\n');
}

export async function POST(request: NextRequest) {
  if (!verifyToken(request)) return json({ error: 'Unauthorized' }, 403);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: 'GEMINI_API_KEY が未設定です' }, 500);
  }

  let body: { audioBase64?: string; mimeType?: string; sections?: Section[] };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'リクエストボディが不正です' }, 400);
  }

  const { audioBase64, mimeType, sections } = body;
  if (!audioBase64) return json({ error: '音声データがありません' }, 400);
  if (!Array.isArray(sections) || sections.length === 0) {
    return json({ error: 'セクション情報がありません' }, 400);
  }

  // Gemini は codecs パラメータ付き mimeType を嫌うことがあるためベース型に正規化
  const audioMime = (mimeType || 'audio/webm').split(';')[0];

  const geminiBody = {
    contents: [
      {
        parts: [
          { text: buildPrompt(sections) },
          { inlineData: { mimeType: audioMime, data: audioBase64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(geminiBody),
    });
  } catch {
    return json({ error: 'Gemini への接続に失敗しました' }, 502);
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text().catch(() => '');
    return json({ error: `Gemini エラー (${geminiRes.status})`, detail }, 502);
  }

  const data = await geminiRes.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return json({ error: 'Gemini から有効な応答が得られませんでした' }, 502);
  }

  let results: unknown;
  try {
    results = JSON.parse(text);
  } catch {
    return json({ error: 'Gemini 応答の JSON パースに失敗しました', detail: text }, 502);
  }

  return json({ results });
}
