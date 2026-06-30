# AIプロンプト記録5
2026-06-30

## 使った技術スタック
Next.js(App Router) × TypeScript × Prisma 7 × MySQL 8.4 × iron-session × bcryptjs

## 使ったAIツール
Claude Code

---

## 1. 認証機能の実装

### 使ったプロンプト

```
認証やりたいです
```

### AIの提案内容

以下の実装方針を提案・承認後に実装した。

| ファイル | 役割 |
|---|---|
| `lib/session.ts` | iron-session の設定（クッキー名・有効期限） |
| `app/api/auth/register/route.ts` | 新規登録 API |
| `app/api/auth/login/route.ts` | ログイン API |
| `app/api/auth/logout/route.ts` | ログアウト API |
| `app/login/page.tsx` | ログイン・新規登録画面（タブ切り替え） |
| `proxy.ts` | 未ログイン時に /login へリダイレクト |
| `components/LogoutButton.tsx` | ログアウトボタン（クライアントコンポーネント） |

### 認証フロー

```
新規登録: パスワード入力 → bcryptjs でハッシュ化 → DB保存 → セッション発行
ログイン:  ログインID入力 → ハッシュと照合 → OK なら iron-session でセッション発行
保護:     proxy.ts がセッションを確認 → なければ /login へリダイレクト
ログアウト: セッションを破棄 → /login へリダイレクト
```

---

## 2. ログイン画面のデザイン修正

### 使ったプロンプト

```
背景は白、ログインはメールアドレスではなくて、ログインIDにしてください
```

**変更内容**
- 背景色：`bg-gray-950`（黒）→ `bg-white`（白）
- ラベル：`メールアドレス` → `ログインID`
- 入力タイプ：`type="email"` → `type="text"`

---

## 3. ログインIDを別フィールドとして追加

### 使ったプロンプト

```
メールアドレスではなくて、ログインIDを別途設定してログインにしたい
```

### 変更内容

`users` テーブルに `loginId` カラムを追加。

```
登録フォーム: ログインID・名前・メールアドレス・パスワード
ログインフォーム: ログインID・パスワード（メールアドレス不要）
```

**マイグレーションの流れ**
1. `schema.prisma` に `loginId String @unique @db.VarChar(50)` を追加
2. 既存データを削除してから `npx prisma db push` で反映
3. `npx prisma db seed` でテストデータを再投入

**テストアカウント**
```
ログインID: yurika
パスワード:  test111
```

---

## 4. ビルドエラーの修正

### エラー内容

```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

**原因**
Next.js 16 から `middleware.ts` → `proxy.ts` に改名され、エクスポート関数名も `middleware` → `proxy` に変更になった。

**解決方法**
- `middleware.ts` → `proxy.ts` にファイル名を変更
- `export async function middleware` → `export async function proxy` に変更

---

## 5. エラーが出た場合：相談したプロンプトと解決方法

### エラー①：loginId カラム追加のマイグレーション失敗

**エラー内容**
```
Added the required column `loginId` to the `users` table without a default value.
There are 1 rows in this table, it is not possible to execute this step.
```

**原因**
テストユーザーが1件存在する状態で NOT NULL カラムを追加しようとしたため。

**解決方法**
既存データを削除してからマイグレーションを実行した。

```sql
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE user_achievements;
TRUNCATE TABLE chat_logs;
TRUNCATE TABLE play_sessions;
TRUNCATE TABLE games;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS=1;
```

その後 `npx prisma db push --accept-data-loss` で反映、`npx prisma db seed` でデータを再投入。

---

## 6. 学んだこと・気づいたこと

**サーバーコンポーネントとクライアントコンポーネントの使い分け**

```
app/page.tsx（サーバーコンポーネント）
  → セッション情報をサーバー側で取得できる
  → onClick などのイベントは書けない

components/LogoutButton.tsx（クライアントコンポーネント）
  → 'use client' を先頭に書く
  → onClick などのイベントが使える
  → DBやセッションに直接アクセスできない
```

ログアウトボタンのように「クリックで何かする」処理はクライアントコンポーネントに分離する必要がある。

**ブランチ運用**

```
main          完成した機能だけ置く
feature/auth  認証機能の開発ブランチ（→ PR → main にマージ）
feature/crud  次のCRUD開発ブランチ（予定）
```

**CI（GitHub Actions）について**

PR を main に送ると自動で以下が走る：
- TypeScript 型チェック（tsc）
- Lint（ESLint）
- ビルド確認（npm run build）

Jest によるテスト自動化は機能実装完了後（6週目 8/31〜）に追加予定。
