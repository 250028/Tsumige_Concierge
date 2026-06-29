# AIプロンプト記録3
2026-06-29

## 使ったAIツール
Claude Code

---

## 1. 今日やることの確認

```
今日やること
- 画面遷移の作成
- 技術スタックの決定
- システム構成
- データベース設計

docs/やmock/を確認して、完了していないことを確認して。
```

### AIの出力の要点
- docs/ と mock/ を読み込み、完了状況を整理してくれた
- 画面遷移・技術スタック・システム構成・データベース設計はすべて **docs に記録済みで完了** と確認された
- モックは5画面が実装済み（ゲーム登録・詳細編集・ログインの3画面は未作成）
- **Next.js プロジェクト自体がまだ作られていない**ことが判明した
- 「設計はすべて揃っているので今日から実装フェーズ」と整理された

### 自分が加えた変更・判断
- 今日はまずデータベース設計から着手することにした

---

## 2. schema.sql の作成

```
# 依頼
- メイン画面 HTMLを元にテーブル設計
- schema.sql で DDL を作成
- ダウンロードできるように

# 条件
- ファイル名: schema.sql
- データベース種別: MySQL
- PrimaryKey: AUTO_INCREMENT
- 文字列: varchar
- 長い文章: text
- 作成日・更新日: created_at, updated_at
- 文字コード: utf8mb4
- 外部キー制約: FOREIGN KEY, ON DELETE CASCADE
```

### AIの出力の要点
- mock/index.html を読み込んで画面の表示項目を洗い出してくれた
- 設計書（design.md）の4テーブルに加えて、モックの**積みゲー城タブの実績グリッド**から `achievements` と `user_achievements` の2テーブルを追加提案してくれた
- プロフィール画面の「通知 ON/OFF」から `users.notification_enabled` カラムも追加された
- 合計6テーブル + 実績マスターの初期データ（6件）を含む schema.sql が生成された

**作成されたテーブル**
| # | テーブル | 役割 |
|---|---|---|
| 1 | `users` | ユーザー情報 |
| 2 | `games` | 積みゲーマイリスト |
| 3 | `chat_logs` | AIチャット履歴 |
| 4 | `play_sessions` | プレイタイマー記録 |
| 5 | `achievements` | 実績マスター |
| 6 | `user_achievements` | 実績取得記録 |

### 自分が加えた変更・判断
- 特になし（提案をそのまま採用）

---

## 3. schema.sql のチェック依頼

```
# 依頼
- schema.sql をチェック
- 画面設計・データベース定義書の整合性をチェック
- mock/との整合性も確認

# チェックしてほしいこと
- 画面に表示されている項目が、すべてテーブルのどこかに保存できるか
- テーブルにあるが、画面では使われていない不要なカラムがないか
- 画面の操作（登録・編集・削除など）に対して、
  テーブル構造で困りそうな点がないか

問題があれば、修正案を提示
```

### AIの出力の要点
- docs・mock・schema.sql を3方向で照合して、**3つの問題（致命的）と2つの問題（軽微）** を発見してくれた

**致命的な問題（データが保存できない）**

| # | 問題 | 修正内容 |
|---|---|---|
| 1 | プロフィールの「ゲーマー歴 X年」が保存できない | `users.gaming_since YEAR` を追加 |
| 2 | ヒーローカードの「残り約Xh」が計算できない | `games.estimated_playtime INT` を追加（RAWG API の `playtime`） |
| 3 | プロフィールの「今月クリア N本」が不正確になる | `games.cleared_at DATETIME` を追加 |

**軽微な問題（将来困る可能性）**

| # | 問題 | 対処 |
|---|---|---|
| 4 | `play_sessions.created_at` と `started_at` が事実上同じ | コメントで役割の違いを明記 |
| 5 | `games.total_play_time` が `play_sessions` と二重管理 | API側で同期必須とコメントに明記 |

- 不要なカラムはなかった
- 修正済みの schema.sql に更新された

### 自分が加えた変更・判断
- 3つの修正案をすべて採用した
- 特に `cleared_at` の運用ルール（クリア済みにしたときだけ `NOW()` を書き込み、戻したら `NULL` にリセット）を理解した

---

## 4. データベース定義書の作成

```
# 前提
- 作成した schema.sql を元にする

# 依頼
- データベース定義書として Markdown 形式にまとめる
- ダウンロードできるように

# 含めてほしい内容
- アプリ名
- テーブル一覧（テーブル名と役割の説明）
- 各テーブルのカラム定義（カラム名・型・制約・内容を表で）
- テーブル間の関係（外部キーがある場合はその説明）

# 形式
- ファイル名: database_definition.md
- 表は Markdown のテーブル形式
- 見出し: ##
```

### AIの出力の要点
- `docs/database_definition.md` を新規作成してくれた
- 各テーブルのカラム定義を Markdown テーブルで整理（カラム名・型・NULL可否・デフォルト・制約・内容）
- ASCII のER図と外部キー一覧表も含まれた
- 末尾に**画面 ↔ カラム 対応表**を追加してくれた（どの画面の何がどのカラムから来るかを一覧化）

**「計算して求める値」と「DBに保存する値」の区別**
| 種別 | 例 |
|---|---|
| DBに保存 | `gaming_since`、`cleared_at`、`estimated_playtime` |
| 都度計算（保存しない） | ゲーマー歴・残り時間・消化率・城のHP |

### 自分が加えた変更・判断
- 特になし（提案をそのまま採用）

---

## 5. Next.js プロジェクトのセットアップ（Step 1・2）

```
まずはデータベース設計かな（→ 完了後）
Step2までをお願い
```

### AIの出力の要点
- `npx create-next-app@latest` を実行しようとしたが、フォルダ名 `Tsumige_Concierge` に**大文字が含まれるため npm の命名規則に引っかかりエラー**になった
- フォルダ名を `tsumige_concierge`（小文字）に変更することで解決した
- また既存ファイル（CLAUDE.md・mock/・schema.sql など）があるため、同フォルダ内への直接作成もエラーになった
- 一時フォルダ `nextapp` を作成 → ファイルを親フォルダに移動 → 一時フォルダ削除 という手順で解決した
- **副作用：** 移動時に `create-next-app` が生成した `CLAUDE.md`（`@AGENTS.md` の1行だけ）が `-Force` オプションで既存の CLAUDE.md を上書きしてしまった。会話履歴から復元した

**Step 1 で生成されたファイル**

| ファイル | 役割 |
|---|---|
| `app/` | Next.js App Router のページ群 |
| `tsconfig.json` | TypeScript 設定 |
| `.gitignore` | Git 除外設定（`.env.local` が含まれていることを確認） |
| `next.config.ts` | Next.js 設定ファイル |
| `tailwind.config.*` | Tailwind CSS 設定 |

**Step 2 でインストールしたパッケージ**

| パッケージ | バージョン | 用途 |
|---|---|---|
| `prisma` | 7.8.0 | DB マイグレーション・スキーマ管理 |
| `@prisma/client` | 7.8.0 | アプリからDBを操作するクライアント |
| `bcryptjs` | 3.0.3 | パスワードのハッシュ化 |
| `iron-session` | 8.0.4 | セッション管理 |
| `@types/bcryptjs` | 2.4.6 | bcryptjs の型定義 |

### 自分が加えた変更・判断
- フォルダ名を小文字に変更した（`Tsumige_Concierge` → `tsumige_concierge`）
- CLAUDE.md が上書きされたため、会話履歴から元の内容を復元してもらった

---

## 6. schema.sql の発展（インデックス・サンプルデータ・Prismaシングルトン）

```
資料に「その他のアイデア・発展」として以下が書いてあったのでできそうなことお願い
- インデックス
- 初期データ
- 命名規則
- 正規化
- Database クラス
```

### AIの出力の要点

**インデックス追加（`schema.sql` に追記）**

```sql
CREATE INDEX idx_games_status         ON games     (status);
CREATE INDEX idx_games_cleared_at     ON games     (cleared_at);
CREATE INDEX idx_games_last_played_at ON games     (last_played_at);
CREATE INDEX idx_chat_logs_created_at ON chat_logs (created_at);
```

- インデックスは「本の索引」と同じ仕組み。ないと全件スキャン、あると一気にジャンプできる
- FOREIGN KEY カラム（`user_id` など）は InnoDB が**自動でインデックスを作成**するため不要
- 追加が必要なのは「FK 以外でよく検索・フィルター・ソートするカラム」だけ

**サンプルデータ追加（`schema.sql` に追記）**
- テストユーザー（由梨花）を1件 INSERT
- モックで使っていたゲーム6本（ゼルダTotK / モンハンワイルズ / ペルソナ5 / スプラ3 / あつ森 / Elden Ring）を INSERT
- チャット履歴（モックの会話）を3件 INSERT

**命名規則（確認のみ・変更なし）**
- テーブル名は複数形（`users` / `games` / `chat_logs`）→ ✅ すでに準拠
- カラム名は snake_case（`user_id` / `created_at` / `persona_type`）→ ✅ すでに準拠

**正規化（確認のみ・変更なし）**
- 現設計は第3正規形（重複なし）を守れている
- `games.total_play_time`（`play_sessions` の集計値を保存）だけ速度優先の意図的な非正規化。コメントに明記済み

**Database クラス → `lib/prisma.ts` を新規作成**
- PHP の `Database::getInstance()` に相当するシングルトン
- Next.js は開発中にファイル変更のたびモジュールを再読み込みする。そのたびに `new PrismaClient()` が走ると DB 接続が増えすぎて「Too many connections」エラーになる
- グローバル変数にインスタンスを保持し、存在すれば再利用することで防ぐ

```ts
// アプリ内での使い方（API Route など）
import prisma from '@/lib/prisma'
const games = await prisma.game.findMany({ where: { userId: 1 } })
```

### 自分が加えた変更・判断
- 特になし（提案をそのまま採用）

---

## 今日の成果物

| ファイル | 内容 |
|---|---|
| `schema.sql` | MySQL DDL（6テーブル + インデックス + 実績・サンプルデータ）|
| `docs/database_definition.md` | データベース定義書（Markdown） |
| `lib/prisma.ts` | Prisma シングルトンクライアント |
| `docs/prompts3.md` | このファイル（AI活用記録） |

---

## 今日気づいたこと・学んだこと
### 月曜日
- モックを作っていても、実際にSQL化してみると**保存先のないデータ**が見つかる。画面 ↔ カラムの対応表を先に作っておくと抜け漏れが防げる
- `updated_at` はあらゆる更新で変わってしまうため、**特定のイベント（クリアした日時など）は専用カラムで追う**必要がある
- 計算して求める値（消化率・城のHP）は**DBに保存しない**のが原則。保存するとデータがズレたとき整合性の確保が大変になる
- `total_play_time` のような**集計値を保存するカラム**は便利だが、参照元（play_sessions）と常に同期させる責任が生まれる
- インデックスは「よく検索するカラム」に付けるもの。FK カラムは InnoDB が自動で作るので自分で書く必要はない
- `create-next-app` はフォルダ名を npm パッケージ名として使うため、**大文字・アンダースコアが使えない**（フォルダ名は小文字・ハイフン推奨）
- ファイルを `-Force` で移動・上書きするときは**既存の重要ファイルが消えないか事前に確認**する必要がある

---

## 次回やること
### 火曜日
- Laragon 起動 → MySQL 接続確認
- Prisma の設定（`npx prisma init` → `schema.prisma` を書く）
- `npx prisma db push` でテーブル作成
- 最初の目標：「データ1件取得できる API を作って動作確認」
