---
name: setup-fb-tool
description: 図解コメントツールのセットアップを対話的にガイドするスキル。「FBツールをセットアップして」「フィードバック機能を設定して」「FBツールを使えるようにして」「セットアップして」と依頼された際に使用する。
---

# Setup FB Tool

図解に対するフィードバック機能を使えるようにする初期セットアップ。Vercel（ホスティング）とNeon Postgres（データベース）の設定を対話的にガイドし、図解テンプレートにwidgetスクリプトを埋め込む。

**実行するのは1回だけ。** セットアップ完了後は、図解を作ってSurgeにデプロイするだけで自動的にフィードバック機能が付く。

## 前提確認

### Node.js

```bash
node --version
```

バージョン番号が表示された → 次に進む。
`command not found` → `references/node-install-guide.md` の手順でインストールを案内する。

### Vercel CLI

```bash
vercel --version
```

バージョン番号が表示された → 次に進む。
`command not found` → 以下を実行:

```bash
npm install -g vercel
```

## ワークフロー

### Step 1: 依存関係のインストール

```bash
npm install
```

### Step 2: Vercelにログイン

```bash
vercel login
```

ブラウザが開く。以下を伝える:

> ブラウザでVercelのログイン画面が開きます。
> アカウントを持っていない場合は「Sign Up」から無料アカウントを作成してください。
> メールアドレスまたはGitHubアカウントで登録できます。
> ログインが完了したら、ターミナルに戻ってください。

### Step 3: APIトークンの生成

APIを保護するためのトークンを生成し、Vercelの環境変数に設定する。

```bash
openssl rand -hex 16
```

表示された文字列がトークン。これを2つの環境変数として Vercel に設定する:

```bash
echo "生成したトークン" | vercel env add API_TOKEN production
echo "生成したトークン" | vercel env add NEXT_PUBLIC_API_TOKEN production
```

`echo` の「生成したトークン」は実際に `openssl` で生成した値に置き換える。`vercel env add` が対話式プロンプトを出さずに値を受け取るよう、パイプで渡す。

同じトークンをルート直下の `fb-api-token.txt` に保存する（1行、トークンのみ）。

**Windows（PowerShell）の場合:**

```powershell
[System.Guid]::NewGuid().ToString("N")
```

表示された値を使って:

```powershell
echo "生成したトークン" | vercel env add API_TOKEN production
echo "生成したトークン" | vercel env add NEXT_PUBLIC_API_TOKEN production
```

同様に `fb-api-token.txt` に保存する。

### Step 4: Vercelにデプロイ

```bash
vercel --yes --prod
```

デプロイが完了すると以下の2つのURLが出力される。両方を控えておく:

- **Inspect URL**: `https://vercel.com/{slug}/{project}/...` 形式（Step 5 で使う）
- **Production URL**: `https://xxx.vercel.app` 形式（最終的なツールURL）

### Step 5: データベースの追加

Step 4 の Inspect URL からデプロイID部分（末尾のランダム文字列）を削り、`/stores` を付けて Storage ページの直接URLを組み立てる。

例: Inspect URL が `https://vercel.com/test-his-projects/diagram-feedback-tool/FUPmRJe2cpEzXZGz` なら
→ `https://vercel.com/test-his-projects/diagram-feedback-tool/stores`

ユーザーにブラウザでの操作を案内する。以下の `{StorageページURL}` を組み立てたURLに置き換えて伝える:

> データベースを追加します。ブラウザで以下のURLを開いてください。
>
> {StorageページURL}
>
> ページが開いたら、以下の操作をしてください。
>
> 1. 「Create Database」をクリック
> 2. 「Neon Postgres」を選択
> 3. プランは「Free」を選択（無料、クレジットカード不要）
> 4. Resource Nameを `fb-tool-db` に変更
> 5. 「Create」をクリック
> 6. 次の画面で:
>    - 「Search Projects」からプロジェクトを選択
>    - 「Custom Prefix」の欄を `DATABASE` に変更
>    - 「Connect」をクリック
>
> 完了したら教えてください。

### Step 6: 環境変数の取得とマイグレーション

```bash
vercel env pull .env.local
```

テーブルを作成:

```bash
npx tsx scripts/migrate.ts
```

`Migration complete.` と表示されれば成功。

### Step 7: 再デプロイ

```bash
vercel --prod
```

### Step 8: URLを保存する

Step 4またはStep 7で表示されたVercelのURL（`https://xxx.vercel.app` 形式）を、ルート直下の `fb-tool-url.txt` に書き出す。URLのみを1行で保存する。

### Step 9: 完了報告

`fb-tool-url.txt` と `fb-api-token.txt` の存在を確認し、以下を伝える:

```
セットアップ完了

あなたの FB ツール URL:
https://xxx.vercel.app

APIはトークンで保護されています。
図解のデプロイ時にトークンが自動で埋め込まれるため、追加の操作は不要です。

以降「図解を作って」と伝えるだけで、FB 機能付きの図解が公開されます。

フィードバック画面を直接開く場合:
https://xxx.vercel.app?url=公開ページのURL
```

## エラー対応

エラーメッセージをそのまま見せず、何が起きていて何をすれば解決するかを平易に説明する。

- **`vercel: command not found`** → `npm install -g vercel` を実行
- **`DATABASE_URL is not set`** → Step 5のデータベース追加が完了しているか確認。完了していれば `vercel env pull .env.local` を再実行
- **マイグレーション失敗** → `.env.local` に `DATABASE_URL` が含まれているか確認

## 依存

- `package.json` — FBツールの依存関係
- `scripts/migrate.ts` — DBマイグレーションスクリプト
- `references/node-install-guide.md` — Node.jsインストール手順
