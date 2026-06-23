# AIプロンプト記録2

## 学籍番号
250028

## 氏名
蒲山 由梨花

## 使ったAIツール
Claude

---

## 1. 技術スタックの相談で使ったプロンプト

```
技術スタックについて、細かく決めたい
Next.jsは絶対使いたい
TypeScriptを使おうと思っている
CSSはTailwindの方がいい？
DBはMySQL
他に決めることはある？
```

### AIの出力の要点
- Next.js (App Router) + TypeScript + Tailwind CSS v4 の組み合わせを提案された
- 未決定だったのはORMの選択のみと指摘された
- PrismaとDrizzleの2択を提示された

### 自分が加えた変更・判断
- ORMはPrismaに決定した（理由：授業でMySQLを学んでいるので地続きでわかりやすい、日本語情報が豊富）

---

## 2. ORMの仕組みを理解するために使ったプロンプト

```
ORMの仕組みが分からない
```

### AIの出力の要点
- ORMとは「TypeScriptのメソッドでDBを操作できる橋渡し役」と説明された
- SQLを直接書く場合とORMを使う場合のコードを並べて比較してもらった
  - データ取得：`prisma.game.findMany({ where: { userId, status } })`
  - データ登録：`prisma.game.create({ data: { title, platform, ... } })`
- Prismaでは `schema.prisma` にテーブル構造を書いて `npx prisma migrate dev` を実行するだけでMySQLにテーブルが自動生成されると理解した

### 自分が加えた変更・判断
- 説明を聞いてPrismaの採用を確定した
- 積みゲーコンシェルジュでの具体的な使いどころを確認した
  - `prisma.game.findMany` → 積みゲー一覧取得
  - `prisma.game.create` → ゲーム登録
  - `prisma.game.update` → ステータス更新
  - `prisma.game.delete` → 削除

---

## 3. モック画面の移植についての相談

```
モック画面をhtmlとCSSはBootstrapで作成したけど、
本格的にアプリ作成するときにはNext.jsとTailwind CSSで作りたい。
ほぼモック画面と同じようになる？
```

### AIの出力の要点
- 見た目の再現度はほぼ100%可能と回答された
- BootstrapとTailwindは役割が同じ（CSSフレームワーク）なので外見の差はほとんど出ない
- 変わるのは書き方と構造：
  - Bootstrapのクラス → Tailwindの細かいクラスの組み合わせに変わる
    - 例：`btn btn-primary` → `bg-blue-500 text-white px-4 py-2 rounded`
  - 1つのHTMLファイルで `display: none` でタブ切り替えしていたものが、Next.jsではURLベースのページ遷移になる
  - `index.html` → `app/page.tsx`（ホーム）、`app/list/page.tsx`（リスト）のようにファイルが分かれる
- 見た目ではなく「データが本物になる」のが最大の変化

### 自分が加えた変更・判断
- モックの設計はそのまま活かせると確認できたので、Next.jsでの実装時もモックのレイアウトを参考にする

---

## 4. AIを使ってみて気づいたこと

- ORMのように「何となく聞いたことがある言葉」でも、コードを並べて比較してもらうと具体的にイメージできた
- 「Prismaを使うとこう書ける」という積みゲーアプリ固有の例で説明してもらうと理解が早かった
- 技術選定の相談では「なぜその技術か」の理由まで一緒に整理できた。design.mdの技術スタック欄の採用理由がそのまま書けた
- Bootstrap → Tailwindの移植は、単純に「クラス名を変える」だけでなく「ファイル構造ごと変わる」という点が重要だとわかった

---

## 5. 確定した技術スタック（この会話で決まったこと）

| 層 | 技術 |
|---|---|
| フロントエンド | Next.js (App Router) + TypeScript |
| CSS | Tailwind CSS v4 |
| バックエンド | Next.js API Routes（同一プロジェクト） |
| ORM | Prisma |
| データベース | MySQL |
| AI | Gemini API |
| 開発環境 | Node.js + npm/pnpm・VSCode・GitHub |
