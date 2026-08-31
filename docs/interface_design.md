# I/F設計書（API仕様一覧）

関連ドキュメント: [design.md](design.md)（画面設計）/ [design_crud.md](design_crud.md)（積みゲーCRUDの詳細設計）/ [database_definition.md](database_definition.md)（DB定義）

積みゲーCRUD（`/api/games`系）の詳細は[design_crud.md](design_crud.md)にまとまっているため、本書ではそれ以外も含めた全APIルートを一覧化する。

---

## 0. 共通仕様

- **認証**: `lib/session.ts`（`iron-session`）でCookieセッションを確認する。`session.userId` が無ければ `401 { error: '未ログインです' }`（一部エンドポイントは `{ message: ... }`）を返す。
- **所有者チェック**: ゲーム・通知・プレイセッションなど「特定ユーザーの持ち物」を扱うAPIは、対象レコードの `userId` がセッションの `userId` と一致しない場合に `404`（存在自体を教えない設計。CRUD系のみ `403` を使用）を返す。
- **エラーレスポンス形式**: `{ error: string }` または `{ message: string }`（エンドポイントにより表記ゆれあり。統一は今後の課題）。
- **AI生成系（Gemini）**: 失敗時は `500` で `{ error: 'AI生成に失敗しました' }` 等を返す。ハルシネーション対策として `lib/gemini.ts` のプロンプト側で「不確かな情報は明示する」よう指示している。

---

## 1. 認証系

ベースパス: `/api/auth`。すべて未ログイン状態でも呼び出し可能。

### 1.1 ログイン `POST /api/auth/login`

| 項目 | 内容 |
|---|---|
| リクエストボディ | `loginId`(必須), `password`(必須) |
| 処理 | `loginId` でユーザー検索 → `bcrypt.compare` でパスワード照合 → 一致すればセッション発行（`userId`/`userName`/`personaType`を保存） |
| レスポンス 200 | `{ message: 'ログインしました' }` |
| レスポンス 400 | 未入力（`{ message: 'ログインIDとパスワードを入力してください' }`） |
| レスポンス 401 | ID/パスワード不一致（どちらが誤りかは教えない） |
| レスポンス 500 | サーバーエラー |

### 1.2 新規登録 `POST /api/auth/register`

| 項目 | 内容 |
|---|---|
| リクエストボディ | `loginId`(必須, 3文字以上), `name`(必須), `email`(必須), `password`(必須, 6文字以上) |
| バリデーション | 未入力・文字数不足で `400`。`loginId`/`email` の重複でそれぞれ `409` |
| 処理 | `bcrypt.hash` でパスワードをハッシュ化して `User` 作成 → 登録と同時にセッション発行（自動ログイン） |
| レスポンス 201 | `{ message: '登録しました' }` |

### 1.3 ログアウト `POST /api/auth/logout`

| 項目 | 内容 |
|---|---|
| 処理 | `session.destroy()` でセッションCookieを破棄 |
| レスポンス 200 | `{ message: 'ログアウトしました' }` |

---

## 2. 積みゲーCRUD `/api/games`

詳細は[design_crud.md 2章](design_crud.md#2-apiルート設計)を参照。概要のみ記載する。

| メソッド | パス | 概要 |
|---|---|---|
| GET | `/api/games` | 一覧取得（`status`クエリで絞り込み） |
| POST | `/api/games` | 新規登録（`title`必須） |
| GET | `/api/games/[id]` | 詳細取得 |
| PUT | `/api/games/[id]` | 更新（`status`が`クリア済み`になった瞬間に`clearedAt`をセット） |
| DELETE | `/api/games/[id]` | 削除（`PlaySession`もカスケード削除） |

---

## 3. ゲーム詳細のAIコンシェルジュ機能

いずれも `GET /api/games/[id]/xxx`。認証必須、対象ゲームの所有者チェックあり（他人のゲームIDを指定すると`404`）。

### 3.1 あらすじ生成 `GET /api/games/[id]/synopsis`

| 項目 | 内容 |
|---|---|
| 処理 | `game.rawgId` があればRAWGの説明文（`lib/rawg.ts` の `getGameDescription`）を優先使用。無ければGeminiで生成（`generateSynopsis`） |
| レスポンス 200 | `{ synopsis: string }` |

### 3.2 モチベーター生成 `GET /api/games/[id]/motivator`

| 項目 | 内容 |
|---|---|
| 処理 | ゲームのタイトル・ジャンル・ステータス等をGeminiに渡し、ステータスに応じた後押しメッセージを生成（`generateMotivator`） |
| レスポンス 200 | `{ motivator: string }` |
| レスポンス 500 | `{ error: 'AI生成に失敗しました' }` |

### 3.3 操作ガイド生成 `GET /api/games/[id]/control-guide`

| 項目 | 内容 |
|---|---|
| 処理 | ゲーム情報をGeminiに渡し、始め方・操作方法の箇条書きを生成（`generateControlGuide`） |
| レスポンス 200 | `{ guide: string }` |

---

## 4. 画像アップロード

拡張子は `jpg`/`jpeg`/`png`/`gif`/`webp` のみ許可（MIMEタイプ検証・ファイルサイズ上限は未実装）。

### 4.1 プロフィール画像 `POST /api/profile/avatar`

| 項目 | 内容 |
|---|---|
| リクエスト | `multipart/form-data`、フィールド名 `avatar` |
| 処理 | `public/uploads/avatars/{userId}_{timestamp}.{ext}` に保存し、`User.avatarUrl` を更新 |
| レスポンス 200 | `{ avatarUrl: string }` |

### 4.2 ゲームカバー画像（詳細画面から変更） `POST /api/games/[id]/cover`

| 項目 | 内容 |
|---|---|
| リクエスト | `multipart/form-data`、フィールド名 `cover` |
| 処理 | 所有者チェック後、`public/uploads/covers/game_{id}_{timestamp}.{ext}` に保存し `Game.coverImageUrl` を更新 |
| レスポンス 200 | `{ coverImageUrl: string }` |

### 4.3 ゲームカバー画像（登録画面からのアップロード） `POST /api/uploads/cover`

| 項目 | 内容 |
|---|---|
| リクエスト | `multipart/form-data`、フィールド名 `cover` |
| 処理 | 登録前（`gameId`未確定）のアップロード用。`public/uploads/covers/{userId}_{timestamp}.{ext}` に保存するのみでDB更新は行わない（登録フォーム側でURLを保持し、`POST /api/games`時に一緒に送信する） |
| レスポンス 200 | `{ coverImageUrl: string }` |

---

## 5. プレイセッション（タイマー）

### 5.1 開始 `POST /api/play-session`

| 項目 | 内容 |
|---|---|
| リクエストボディ | `gameId`(必須) |
| 処理 | 所有者チェック→進行中セッションが既にあればそれを返す（二重起動防止）→無ければ新規作成。ステータスが「未開封/序盤で放置/中断中」なら自動で「プレイ中」に変更。開始をトリガーに実績判定（`checkAndGrantAchievements`）も実行し、新規実績があれば通知を作成 |
| レスポンス 200 | `{ id, startedAt, newAchievements: string[] }` |

### 5.2 停止 `PATCH /api/play-session/[id]`

| 項目 | 内容 |
|---|---|
| リクエストボディ | `progressNote`(任意) |
| 処理 | `durationMinutes = Math.round((停止時刻 - 開始時刻) / 60000)` で分単位に丸めて記録。**1分未満のプレイは0分になり累計に反映されない**（仕様上の丸め挙動）。`Game.totalPlayTime` に加算し `lastPlayedAt` を更新 |
| レスポンス 200 | `{ durationMinutes }` |
| レスポンス 400 | 既に停止済みのセッションを再度停止しようとした場合 |
| レスポンス 404 | セッションが存在しない／他人のセッション |

---

## 6. AIコンシェルジュ（チャット・おすすめ）

### 6.1 チャット `POST /api/chat`

| 項目 | 内容 |
|---|---|
| リクエストボディ | `message`(必須, string), `persona`(`butler`\|`gamer`\|`fairy`。不正値は`butler`にフォールバック) |
| 処理 | ユーザーの全ゲーム情報（タイトル・ジャンル・ステータス等）をコンテキストとしてGeminiに渡し、ペルソナに応じた返答を生成（`generateChatReply`） |
| レスポンス 200 | `{ reply: string }` |

### 6.2 今日の1本・再生成 `GET /api/recommend`

| 項目 | 内容 |
|---|---|
| クエリパラメータ | `gameId`(必須) |
| 処理 | 所有者チェック後、Geminiでそのゲームをおすすめする理由文を生成（`generateRecommendReason`）。キャッシュせず毎回生成する（「別の理由」ボタン用） |
| レスポンス 200 | `{ reason: string }` |

### 6.3 おまかせランダムセレクト `GET /api/random`

| 項目 | 内容 |
|---|---|
| 処理 | ステータスが「クリア済み」以外のゲームIDを全件取得し、サーバー側の乱数で1件選出。**AI（Gemini）は呼び出さない** |
| レスポンス 200 | `{ id: number }` |
| レスポンス 404 | 対象ゲームが0件 |

---

## 7. 通知

### 7.1 一覧取得・自動生成 `GET /api/notifications`

| 項目 | 内容 |
|---|---|
| 処理 | 呼び出しのたびに `generateAutoNotifications`（長期未プレイのリマインドなど）を実行してから、直近20件と未読件数を返す |
| レスポンス 200 | `{ notifications: Notification[], unreadCount: number }` |

### 7.2 全件既読化 `PATCH /api/notifications`

| 項目 | 内容 |
|---|---|
| 処理 | 自分の未読通知をすべて `isRead: true` に更新 |
| レスポンス 200 | `{ message: 'すべて既読にしました' }` |

### 7.3 個別既読化 `PATCH /api/notifications/[id]`

| 項目 | 内容 |
|---|---|
| 処理 | 所有者チェック後、対象通知を既読化 |
| レスポンス 200 | 更新後の `Notification` |
| レスポンス 404 | 存在しない／他人の通知 |

---

## 8. プロフィール・設定

### 8.1 プロフィール取得 `GET /api/profile`

| レスポンス 200 | `id, name, loginId, avatarUrl, personaType, gamingSince, points, createdAt` |

### 8.2 プロフィール更新 `PATCH /api/profile`

| 項目 | 内容 |
|---|---|
| リクエストボディ | `name`(任意), `gamingSince`(任意, 数値), `personaType`(任意, `butler`\|`gamer`\|`fairy`) |
| 処理 | 送られてきた項目のみ部分更新（不正な`personaType`は無視される） |
| レスポンス 200 | 更新後の `name, gamingSince, personaType` |

### 8.3 通知設定・メールアドレス変更 `PATCH /api/settings`

| 項目 | 内容 |
|---|---|
| リクエストボディ | `notificationEnabled`(任意, boolean), `email`(任意) |
| バリデーション | `email` は空文字不可・他ユーザーとの重複不可（`409`） |
| レスポンス 200 | 更新後の `notificationEnabled, email` |

### 8.4 パスワード変更 `PUT /api/settings`

| 項目 | 内容 |
|---|---|
| リクエストボディ | `currentPassword`(必須), `newPassword`(必須, 8文字以上) |
| 処理 | 現在のパスワードを`bcrypt.compare`で照合 → 一致すれば新パスワードをハッシュ化して更新 |
| レスポンス 200 | `{ message: 'パスワードを変更しました' }` |
| レスポンス 400 | 未入力／文字数不足／現在のパスワード不一致 |

---

## 9. 外部API連携

### 9.1 RAWGゲーム検索 `GET /api/rawg/search`

| 項目 | 内容 |
|---|---|
| クエリパラメータ | `q`(必須, 検索ワード。日本語タイトルは`lib/rawg.ts`側で英語タイトルに変換してから検索), `limit`(任意, デフォルト5, 「他の候補を見る」で最大20まで拡張) |
| レスポンス 200 | `{ games: RawgGame[] }`（タイトル・ジャンル・カバー画像URL・rawgId等） |
| レスポンス 500 | RAWG API側のエラー |

---

## 10. その他

### 10.1 ヘルスチェック `GET /api/health`

| 項目 | 内容 |
|---|---|
| 処理 | `User`テーブルの件数を取得してDB接続を確認するだけの疎通確認用エンドポイント |
| レスポンス 200 | `{ status: 'ok', message: '接続できました', userCount }` |
| レスポンス 500 | DB接続エラー |

---

## 11. 今後の課題

- エラーレスポンスのキーが `error` と `message` で混在している。統一するかは要検討
- 画像アップロードはMIMEタイプ検証・ファイルサイズ上限が未実装（拡張子チェックのみ）
