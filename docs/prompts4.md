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

## 5. AIを使ってみて気づいたこと

**うまくいった指示**
- 「前提・依頼・条件」の3段構成でプロンプトを書くと、必要なものが揃った回答が返ってきた
- 「確認してください」と具体的な確認項目を箇条書きで渡すと、1つずつ確認して結果をまとめてくれた
- エラーメッセージをそのまま貼り付けると原因と解決策をセットで教えてくれた

**気づいたこと・注意点**
- Prisma 7 は新しいバージョンで、ネットの解説記事（Prisma 5 以前）と設定方法が異なる部分が多かった。AIも最初は古い情報で回答することがあった
- エラーが複数回続いたときも「なぜそうなるか」の説明を一緒にしてくれたので、解決後に理解が深まった
- 「次は何をすればいい？」という曖昧な質問でも、プロジェクトの状況を把握した上でスケジュールに合った提案をしてくれた
