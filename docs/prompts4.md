# AIプロンプト記録4
2026-06-30


## 使った技術スタック
Next.js(App Router) × TypeScript × Prisma 7 × MySQL 8.4（Laragon）

## 使ったAIツール
Claude Code

---

## 1. schema.sql を MySQL に反映した方法（Step0）

`npx prisma migrate dev --name init` コマンドを使って Prisma 経由でテーブルを作成した。

Prisma 7 の仕様変更により、以下のファイルも作成・設定が必要だった：

- `prisma/schema.prisma` — テーブル定義（モデル）
- `prisma.config.ts` — DB接続URL の設定（Prisma 7 から schema.prisma には書けなくなった）
- `.env` — Prisma CLI 用の環境変数
- `.env.local` — Next.js アプリ用の環境変数

初期データ（実績マスター・テストユーザー・ゲーム6本・チャット履歴）は `prisma/seed.ts` を作成して `npx prisma db seed` で投入した。

---

## 2. 接続設定ファイル作成で使ったプロンプト（Step1）

```
# 前提
Next.js + Prisma でデータベースを構築したいです。
作成したいテーブルの定義 schema.sql の内容をもとにしてください。
# 依頼
上記の内容から、schema.prisma のモデル定義を作成してください。
```

```
# 前提
Next.js(TypeScript)から MySQL に接続するための設定をしたいです。
ORM には Prisma を使う予定です。
# 依頼
.env に書く DATABASE_URL の形式と、
Prisma の接続設定ファイルの作り方を教えてください。
```

---

## 3. 接続確認コード作成で使ったプロンプト（Step2）

```
# 前提
先ほど設定した .env を使って、Next.js から
Prisma で MySQL に接続できるか確認したいです。
# 依頼
接続確認用のスクリプト(または API ルート)を作成してください。
# 条件
- 接続できたら「接続できました」と表示・出力してください
- try-catch でエラー内容を表示してください
- 実行して結果が確認できる形にしてください
```

作成された API ルート：`app/api/health/route.ts`

結果：
```json
{"status":"ok","message":"接続できました","userCount":1}
```

---

## 4. エラーが出た場合：相談したプロンプトと解決方法

### エラー①：Prisma 7 で schema.prisma に url が書けない

**エラー内容**
```
The datasource property `url` is no longer supported in schema files.
```

**原因**
Prisma 7 から `schema.prisma` の `datasource` ブロックに `url = env("DATABASE_URL")` が書けなくなった。

**解決方法**
`prisma.config.ts` をプロジェクトルートに作成して接続 URL をそこに移動した。

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "npx tsx prisma/seed.ts" },
  datasource: { url: env("DATABASE_URL") },
});
```

---

### エラー②：PrismaClient の初期化エラー

**エラー内容**
```
PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions
```

**原因**
Prisma 7 では `new PrismaClient()` に引数なしで呼ぶとエラーになる。ドライバーアダプターが必要。

**解決方法**
`@prisma/adapter-mariadb` パッケージをインストールして、アダプター経由で接続するように変更した。

```bash
npm install @prisma/adapter-mariadb mariadb
```

```ts
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb({
  host: 'localhost', user: 'root', password: undefined, database: 'tsumige_db'
})
const prisma = new PrismaClient({ adapter })
```

---

### エラー③：MySQL 8.4 の認証プラグインエラー

**エラー内容**
```
Plugin 'mysql_native_password' is not loaded
```

**原因**
MySQL 8.4 で `mysql_native_password` 認証プラグインがデフォルト無効になった。

**解決方法**
① `C:\laragon\bin\mysql\mysql-8.4.3-winx64\my.ini` に以下を追記して MySQL を再起動

```ini
[mysqld]
mysql_native_password=ON
```

② root ユーザーの認証プラグインを変更

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
```

---

### エラー④：`PrismaMariaDb` の使い方の誤り

**エラー内容**
```
Access denied for user '（Windowsユーザー名）'@'localhost'
```

**原因**
`PrismaMariaDb` にプール（`createPool` の戻り値）を渡していたが、正しくは接続オプションのオブジェクトを直接渡す必要があった。

**解決方法**
README を確認して正しい使い方に修正した。

```ts
// ❌ 間違い
const pool = mariadb.createPool({ ... })
const adapter = new PrismaMariaDb(pool)

// ✅ 正解
const adapter = new PrismaMariaDb({ host, user, password, database })
```

---

## 6. チャレンジ

### ① エラーを再現して解決

`.env` の DATABASE_URL を意図的に壊してエラーを確認した。

| 壊し方 | エラー内容 | 意味 |
|---|---|---|
| パスワードを `wrongpassword` に変更 | Access denied for user 'root' | 認証失敗。パスワードが違う |
| DB名を `wrong_db` に変更 | Unknown database 'wrong_db' | 指定したDB名が存在しない |
| ホストを `localhostt` に変更 | 接続タイムアウト | そのホストに到達できない |
| ポートを `9999` に変更 | 接続できない | そのポートで MySQL が動いていない |

確認後は元の値 `mysql://root:@localhost:3306/tsumige_db` に戻した。

**学んだこと**：エラーメッセージは「何が間違っているか」を正確に教えてくれる。`Access denied` はパスワード、`Unknown database` はDB名、タイムアウトはホスト・ポートの問題と読み分けられる。

---

### ② 複数の接続方法を比較

Next.js × MySQL の接続方法は主に3つある。

| 方法 | 書き方のイメージ | 特徴 |
|---|---|---|
| **mysql2**（生SQL） | `connection.query("SELECT * FROM games")` | SQLをそのまま書く。自由度は高いが手間がかかる |
| **Prisma**（今回） | `prisma.game.findMany()` | TypeScript で書ける。型補完・マイグレーション管理が便利 |
| **Drizzle ORM** | `db.select().from(games)` | Prisma より軽量。書き方が SQL に近い |

今回 Prisma を選んだ理由：
- `schema.prisma` にテーブル定義を書くと TypeScript の型が自動生成される
- `prisma migrate dev` でマイグレーション管理ができる
- `prisma.user.count()` のように英語に近い感覚で書けて読みやすい

---

### ③ 接続処理の理解（lib/prisma.ts を自分の言葉で説明）

```ts
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
```
→ Prisma を動かすために必要な部品を読み込む。`PrismaMariaDb` は「MySQL との通訳役（ドライバー）」、`PrismaClient` は「SQLを書かずにDBを操作できる道具」。

```ts
declare global {
  var __prisma: PrismaClient | undefined
}
```
→ TypeScript は知らない変数があるとエラーを出す。`globalThis.__prisma` という変数をこれから使うので、事前に「こういう変数があるよ」と宣言している。

```ts
function createPrismaClient() {
  const dbUrl   = new URL(process.env.DATABASE_URL!)
  const adapter = new PrismaMariaDb({
    host:     dbUrl.hostname,  
    port:     ...,             
    user:     dbUrl.username,  
    password: ...,             
    database: ...,             
  })
  return new PrismaClient({ adapter })
}
```
→ `.env` の `DATABASE_URL` を `new URL()` で分解して、`host`・`port`・`user`・`database` に分けてアダプターに渡す。PHP の `new PDO("mysql:host=localhost;dbname=...", $user, $pass)` と同じイメージ。

```ts
const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
```
→ `??` は「左が null または undefined なら右を使う」という演算子。一度作った接続を `globalThis`（アプリ全体で共有できる場所）に保存しておき、2回目以降は使い回す（シングルトン）。これをしないと Next.js のホットリロード（ファイル保存のたびの再読み込み）のたびに接続が増えすぎて「Too many connections」エラーになる。

---

## 5. AIを使ってみて気づいたこと

**うまくいった指示**
- 「前提・依頼・条件」の3段構成でプロンプトを書くと、必要なものが揃った回答が返ってきた
- 「確認してください」と具体的な確認項目を箇条書きで渡すと、1つずつ確認して結果をまとめてくれた
- エラーメッセージをそのまま貼り付けると原因と解決策をセットで教えてくれた

**気づいたこと・注意点**
- Prisma 7 は新しいバージョンで、ネットの解説記事（Prisma 5 以前）と設定方法が異なる部分が多かった。AIも最初は古い情報で回答することがあった
- エラーが複数回続いたときも「なぜそうなるか」の説明を一緒にしてくれたので、解決後に理解が深まった
- 「次は何をすればいい？」という曖昧な質問でも、プロジェクトの状況を把握した上でスケジュールに合った提案をしてくれた
