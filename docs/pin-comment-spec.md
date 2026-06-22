# ピンコメント機能 仕様書

## 経緯と設計判断の記録

### 背景

commenting-visual-explainers は、AI が生成した図解 HTML にフィードバック機能を埋め込むツール。
既存機能は「テキストをドラッグ選択 → 引用付きコメント」のみだった。

### 課題

- 図解を共有する際、受け手に「ここはまだ詰める予定」等の期待値調整を伝えたい
- テキスト選択は「正確にドラッグする手間」が本質的な摩擦になっている
- 毎回修正して出力し直すのもコスト高

### 検討プロセス（Grill Me で詰めた内容）

最初は「矩形エリア選択」（起点クリック→終点クリックで四角を描く）を検討した。
全設計を詰めた結果、技術的には実現可能だったが、**本質的な課題は「選択する手間の削減」**であると判明。

矩形選択でも2クリック必要で、根本的に「ワンアクションでコメントできる」ほうが課題に刺さる。
そこで矩形選択は見送り、Figma のコメント機能のような**ワンクリック＋ピン**方式に方向転換した。

### 見送った機能

| 機能 | 見送り理由 |
|------|-----------|
| 矩形エリア選択 | 2クリック必要で「手間削減」の本質に合わない。画期的かまだ見えない |
| ヒートマップ的な色分け | ピン方式に変わったため不要（ピンの色で十分） |
| サイドバー統合 | MVP では不要。ピンのツールチップで完結 |
| DB 永続化 | MVP は localStorage のみで操作感を先に検証 |

---

## 現在の実装状態（MVP）

### アーキテクチャ

```
commenting-visual-explainers/
├── src/widget/
│   ├── index.ts       ← エントリ。全モジュールの初期化・イベント接続
│   ├── state.ts       ← PinComment インターフェース + WidgetState
│   ├── pin.ts         ← ピンモード制御・描画・localStorage 保存（★新規）
│   ├── selection.ts   ← テキスト選択（既存・変更なし）
│   ├── highlight.ts   ← テキストハイライト（既存・変更なし）
│   ├── styles.ts      ← CSS 注入（ピンモード用CSS追加済み）
│   ├── render/
│   │   ├── toggle.ts  ← トグルボタン（ピンアイコン追加済み）
│   │   ├── popup.ts   ← テキストコメント用ポップアップ（既存・変更なし）
│   │   ├── sidebar.ts ← サイドバー（既存・変更なし）
│   │   └── ...
│   └── ...
├── public/
│   └── widget.js      ← esbuild でバンドルされた成果物（IIFE）
└── package.json       ← build:widget スクリプト
```

### データモデル

```typescript
interface PinComment {
  id: string;        // generateId() で生成
  x: number;         // コンテナ（<main>）左端からの % (0-100)
  y: number;         // コンテナ上端からの px（スクロール込み絶対位置）
  content: string;   // コメント本文
  priority: Priority; // 'must' | 'better' | 'want'
  author: string;    // ユーザー名（localStorage から取得）
  timestamp: number; // Date.now()
}
```

### 永続化

- **キー**: `fb-pin-comments-{slug}`（slug = URL をサニタイズしたもの）
- **ストレージ**: localStorage
- **将来**: 既存の Neon Postgres API に統合予定（comments テーブルに `type='pin'` + `pin_x`, `pin_y` 列追加）

### 操作フロー

```
① 右端トグルボタンの「ピン」アイコンをクリック
   → ピンモード ON（カーソル十字、アイコン青背景）

② ページ上の好きな場所をワンクリック
   → クリック位置にポップアップが表示

③ コメント入力 + 優先度選択（Must / Better / Want）
   → 送信（ボタン or Cmd+Enter）

④ クリック位置に番号付きピンが表示される
   → 色は優先度に対応（赤=Must、黄=Better、緑=Want）

⑤ ピンモードは維持（連続でピンを打てる）
   → ESC でモード解除

⑥ 閲覧者がページを開く
   → localStorage に保存済みのピンが自動復元
   → ピンにホバーするとコメント内容が吹き出しで表示
   → 吹き出し内の × ボタンで削除可能
```

### 座標計算

- X座標: コンテナ幅に対する **%** で保存（レスポンシブ対応）
- Y座標: コンテナ上端からの **px** で保存
- 基準コンテナ: `document.querySelector('main')` || `document.body`
- ピンの CSS: `position:absolute; left:{x}%; top:{y}px; transform:translate(-50%,-100%)`

### 既存機能との共存

- テキスト選択コメント（既存）はそのまま動作
- ピンモード中はテキスト選択が抑制される（click イベントを `capture:true` + `preventDefault` で横取り）
- ピンモード OFF ならテキスト選択が通常通り機能

---

## ローカル開発・確認手順

### ビルド

```bash
cd "/Users/ryuji_i/Library/Mobile Documents/com~apple~CloudDocs/開発・コード/gitar/commenting-visual-explainers"
npm run build:widget
# → public/widget.js (約42KB) が生成される
```

### ローカル確認用サーバー

```bash
# widget.js を配信（port 8766）
cd "/Users/ryuji_i/Library/Mobile Documents/com~apple~CloudDocs/開発・コード/gitar/commenting-visual-explainers/public"
python3 -m http.server 8766

# サンプル図解を配信（port 8765）
cd /Users/ryuji_i/src/drill/majiai-drill/mockups/2026-06-22_feedback-widget-preview
python3 -m http.server 8765

# ブラウザで開く
open http://localhost:8765/
```

### サンプル図解 HTML の構成

`mockups/2026-06-22_feedback-widget-preview/index.html` は以下の構造:
- Tailwind CSS CDN + Noto Sans JP
- `<main>` 内にサンプルコンテンツ（HTTPリクエストの流れ 4ステップ）
- 末尾で `<script src="http://localhost:8766/widget.js" data-token="local-dev"></script>` を読み込み

---

## 将来のロードマップ

### Phase 2: DB 永続化

- comments テーブルに列追加: `pin_x FLOAT`, `pin_y FLOAT`
- `type` を `'comment' | 'strikethrough' | 'pin'` に拡張
- pin.ts の `savePinComments()` を API 呼び出しに差し替え
- `loadPinComments()` を `api('GET', ...)` に差し替え

### Phase 3: サイドバー統合

- ピンコメントをサイドバーの一覧に混在表示
- カードにピンアイコン + 番号を表示
- カードクリック → 該当ピンにスクロール＋ハイライト

### Phase 4: デプロイ統合

- `deploy-diagram.sh` でデプロイする図解に、ピンコメント機能が自動で含まれる
- Vercel 版 widget.js を配信（`<script src="https://commenting-visual-explainers-smoky-seven.vercel.app/widget.js" data-token="...">`）

### Phase 5: UX 磨き込み

- ショートカットキー（P でピンモード ON/OFF）
- スマホ閲覧時のピン表示最適化（タップで吹き出し）
- ピンのドラッグ移動
- ピンコメントの編集
- 解決済み/未解決のフィルタ

---

## 変更したファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/widget/state.ts` | `PinComment` インターフェース追加、`WidgetState` にピン関連フィールド追加 |
| `src/widget/pin.ts` | **新規作成**。ピンモード制御・クリック処理・localStorage・ピン描画・ポップアップ |
| `src/widget/index.ts` | pin.ts のインポート・イベント接続・init への組み込み |
| `src/widget/render/toggle.ts` | ピンアイコン追加・モード状態の色表示・クリックハンドラ分岐 |
| `src/widget/styles.ts` | `.fb-pin-*` 系 CSS 追加（ピンマーカー・ツールチップ・ポップアップ・カーソル） |
| `mockups/.../index.html` | widget.js の読み込み先を localhost:8766 に変更 |

### 削除したファイル

| ファイル | 理由 |
|---------|------|
| `src/widget/area.ts` | 矩形選択方式を見送ったため不要 |

---

## 技術的メモ

### なぜ Y座標を px で保存するか

図解 HTML は `max-w-3xl`（768px）で横幅が固定されるため、X座標は % で安定する。
一方、Y座標はコンテンツ量で高さが決まるため、% で保存すると内容変更時にズレる。
px ならコンテンツ上端からの固定距離として安定する（コンテンツの順序が変わらない限り）。

### イベント制御の仕組み

ピンモード中の click は `addEventListener('click', handler, true)`（capture phase）で登録し、
`e.preventDefault()` + `e.stopPropagation()` でページ内のリンクや他のクリックイベントを無効化。
FB ウィジェット自身の要素（`#fb-toggle`, `#fb-sidebar` 等）はセレクタで除外している。

### esbuild バンドル

`npm run build:widget` = `esbuild src/widget/index.ts --bundle --format=iife --outfile=public/widget.js --minify`
外部依存なし（全て vanilla TS）。成果物は IIFE（即時実行関数式）で、`<script>` タグ1つで動く。
