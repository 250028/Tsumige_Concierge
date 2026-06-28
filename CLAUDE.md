# 積みゲー・コンシェルジュ

あなたの罪悪感をワクワクに変える、積みゲー消化応援サポーター。
ゲーマーが「今日何やろう？」を解決するためのAI搭載Webアプリ。

---

## 技術スタック

| 層 | 技術 |
|---|---|
| フロントエンド | Next.js (App Router) + TypeScript |
| CSS | Tailwind CSS v4 |
| バックエンド | Next.js API Routes（同一プロジェクト） |
| ORM | Prisma |
| データベース | MySQL（Laragon使用） |
| AI | Gemini API |
| 外部API | RAWG API（ゲーム基本情報・カバー画像取得） |
| 開発環境 | Node.js + npm / VSCode / GitHub |

---

## 環境情報

- OS: Windows + WSL2（Ubuntu 26）
- DBホスト: `localhost`、ポート: `3306`、DB名: `tsumige_db`
- Laragon で MySQL・Apache を管理

---

## ディレクトリ構成

```
tsumige-concierge/
├── app/
│   ├── page.tsx              # ホーム画面
│   ├── list/page.tsx         # 積みゲーリスト一覧
│   ├── games/
│   │   ├── new/page.tsx      # ゲーム登録
│   │   └── [id]/page.tsx     # ゲーム詳細・編集
│   ├── chat/page.tsx         # AIチャット
│   ├── castle/page.tsx       # 積みゲー城
│   ├── profile/page.tsx      # プロフィール
│   ├── settings/page.tsx     # 設定
│   └── api/                  # API Routes
├── components/               # 共通コンポーネント
├── lib/
│   ├── prisma.ts             # Prismaクライアント
│   └── gemini.ts             # Gemini API クライアント
├── prisma/
│   └── schema.prisma         # テーブル定義
├── mock/                     # HTMLモック（参考用）
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
└── public/
    └── uploads/avatars/      # プロフィール画像
```

---

## データベース設計

### `users` テーブル
| カラム | 型 | 説明 |
|---|---|---|
| id | INT (PK) | ユーザーID |
| name | VARCHAR(100) | ユーザー名 |
| email | VARCHAR(255) | メールアドレス |
| password | VARCHAR(255) | ハッシュ化パスワード |
| avatar_url | VARCHAR(255) | プロフィール画像パス |
| persona_type | ENUM | butler / gamer / fairy |
| points | INT | 累計ポイント |
| created_at | DATETIME | 登録日時 |

### `games` テーブル（中心テーブル）
| カラム | 型 | 説明 |
|---|---|---|
| id | INT (PK) | ゲームID |
| user_id | INT (FK) | 所有ユーザー |
| title | VARCHAR(255) | ゲームタイトル |
| genre | VARCHAR(100) | ジャンル（RAWG or 手動） |
| platform | VARCHAR(50) | Switch / PS5 / PC など |
| status | ENUM | 未開封/序盤で放置/中断中/プレイ中/クリア済み |
| cover_image_url | VARCHAR(255) | カバー画像URL |
| rawg_id | INT | RAWG APIのゲームID |
| progress_note | TEXT | 進捗メモ |
| purchase_date | DATE | 購入日 |
| total_play_time | INT | 累計プレイ時間（分） |
| last_played_at | DATETIME | 最終プレイ日時 |
| created_at | DATETIME | 登録日時 |
| updated_at | DATETIME | 更新日時 |

### `chat_logs` テーブル
| カラム | 型 | 説明 |
|---|---|---|
| id | INT (PK) | ログID |
| user_id | INT (FK) | ユーザー |
| role | ENUM | user / assistant |
| message | TEXT | メッセージ内容 |
| created_at | DATETIME | 送信日時 |

### `play_sessions` テーブル
| カラム | 型 | 説明 |
|---|---|---|
| id | INT (PK) | セッションID |
| user_id | INT (FK) | ユーザー |
| game_id | INT (FK) | ゲーム |
| started_at | DATETIME | スタート日時 |
| stopped_at | DATETIME | ストップ日時 |
| duration_minutes | INT | プレイ時間（分・自動計算） |
| progress_note | TEXT | プレイ後メモ |

---

## 画面一覧

| # | 画面名 | パス | モック済み |
|---|---|---|:---:|
| 1 | ホーム | `/` | ✅ |
| 2 | 積みゲーリスト一覧 | `/list` | ✅ |
| 3 | ゲーム登録 | `/games/new` | — |
| 4 | ゲーム詳細・編集 | `/games/[id]` | — |
| 5 | AIチャット | `/chat` | ✅ |
| 6 | 積みゲー城 | `/castle` | ✅ |
| 7 | プロフィール | `/profile` | ✅ |
| 8 | 設定 | `/settings` | — |
| 9 | ログイン / 新規登録 | `/login` | — |

---

## レスポンシブ方針

| 画面幅 | ナビ | レイアウト |
|---|---|---|
| ～767px（スマホ） | ボトムタブ（5項目） | 1カラム縦スクロール |
| 768px〜（PC） | 左サイドバー | サイドバー(200px) + メイン + チャットパネル(280px) |

- スマホ優先で実装し `@media (min-width: 768px)` でPC用を上書き
- AIチャットはPC版では右からドロワーパネルとしてスライドイン

---

## API設計方針

### RAWG API（ゲーム情報取得）
- ゲーム登録時にタイトルで検索 → ジャンル・カバー画像・rawg_idを自動補完
- ジャンルの日本語化は自前マッピングで対応（Gemini API呼び出しコスト節約）
- RAWGがヒットしない場合は手動入力・画像アップロードにフォールバック

### Gemini API（AIコンシェルジュ）
- あらすじ要約、操作方法説明、気分マッチング提案、ペルソナチャット
- ハルシネーション対策：不確かな情報は「情報が不確かです」と明示させるプロンプトを使用
- プロンプトは `lib/gemini.ts` に集約して管理

---

## 環境構築の手順（初回）

以下の順番で進めること。

```
① npx create-next-app でプロジェクト作成（.gitignoreが自動生成される）
② .env.local を作成してAPIキーを記入
③ .gitignore に .env.local が含まれているか必ず確認
④ GitHubにpush（.env.localが除外されていることを確認）
⑤ Laragon起動 → MySQL接続確認
```

⚠️ `.env.local` をGitHubにpushしてしまった場合はAPIキーを即再発行すること。

---

## 関連ドキュメント

詳細な設計・企画・スケジュールは以下を参照。

- `docs/企画書1_250028.md` - 企画書
- `docs/design.md` - 設計書（画面・DB・レスポンシブ方針）
- `docs/モック画面設計.md` - モック画面設計
- `docs/prompts.md` - AIプロンプト記録①
- `docs/prompts2.md` - AIプロンプト記録②

---

## スケジュール（授業）

| 週 | 日程 | 内容 |
|---|---|---|
| 3週目 | 6/29・30 | CRUD（一覧・登録・詳細） |
| 4週目 | 7/6・7 | CRUD（更新・削除）・認証 |
| 夏休み | ～8/30 | AI機能・ゲーミフィケーション・U-22 |
| 6週目 | 8/31・9/1 | 機能追加・テスト |
| 7週目 | 9/7・8 | テスト・デプロイ・発表準備 |
| 試験 | 9/14・15 | 個人制作試験・作品発表 |

---

## タイムゾーン設定

プレイタイマーの時刻ズレを防ぐため、MySQLのタイムゾーンをAsia/Tokyoに統一する。

### Laragonの設定（my.ini に追記）
```ini
[mysqld]
default-time-zone = 'Asia/Tokyo'
```

### DATABASE_URLにも明示する
```env
DATABASE_URL="mysql://root:@localhost:3306/tsumige_db?timezone=+09:00"
```

---

## 環境変数（.env.local）

`.env.local` をプロジェクトルートに作成して以下を設定する。

```env
# Gemini API
GEMINI_API_KEY=

# RAWG API
RAWG_API_KEY=

# iron-session用シークレット（32文字以上のランダム文字列）
SESSION_SECRET=

# MySQL接続情報
DATABASE_URL="mysql://root:@localhost:3306/tsumige_db"
```

⚠️ `.env.local` は絶対にGitにコミットしない。
`.gitignore` に `.env.local` が含まれていることを必ず確認すること。

---

## 認証方針

- **自前実装**（NextAuth.jsは使わない）
- パスワードは `bcryptjs` でハッシュ化してDBに保存
- セッション管理は `iron-session` を使用
- PHPの `password_hash()` / `password_verify()` と同じ考え方

```bash
npm install bcryptjs iron-session
```

### 認証フロー
```
新規登録：パスワード入力 → bcryptでハッシュ化 → DBに保存
ログイン：パスワード入力 → ハッシュと照合 → OKならセッション発行
ページ保護：セッションがなければ /login にリダイレクト
```

---

## 実装優先順位

### Must（必須・合格ライン）
1. ユーザー認証（登録・ログイン・ログアウト）
2. 積みゲーマイリストのCRUD
3. ゲームステータス管理
4. AIコンシェルジュチャット（Gemini API）
5. 「今日の1本」おすすめ表示

### Should（できれば実装）
- おまかせランダムセレクト
- あらすじ・モチベーター機能
- 操作方法一覧表示
- AIペルソナ切り替え（執事 / ゲーマー仲間 / ゲームの妖精）
- ゲーミフィケーション（ポイント・積みゲー城の外観変化）
- RAWG APIによるゲーム情報自動補完

---

## デザイン

- カラー: 紫系（#7C3AED）をprimary、ゴールド（#D97706）をアクセントに
- モックは `mock/index.html` を参照（Bootstrap 5 + Bootstrap Icons で作成済み）
- 本実装はモックのレイアウトをそのまま活かしてTailwindで再現する

---

## 開発の進め方

- 実装前に必ず方針を確認してから進める
- RAWGがない状態でも動くように設計し、後から段階的に追加する
- 最初のゴール：「Laragon起動 → MySQL接続 → データ1件取得」を確認してから本実装へ
