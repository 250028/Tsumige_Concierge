-- =====================================================================
--  積みゲー・コンシェルジュ — データベース定義 (DDL)
--  データベース種別 : MySQL 8.0+
--  文字コード      : utf8mb4 / utf8mb4_unicode_ci
-- =====================================================================
--
--  [修正履歴]
--  v2 (2026-06-29)
--    - users          : gaming_since を追加（プロフィールの「ゲーマー歴 X年」用）
--    - games          : estimated_playtime を追加（ヒーローカードの「残り約Xh」用）
--    - games          : cleared_at を追加（プロフィール統計の「今月クリア N本」を正確に集計するため）
--    - play_sessions  : created_at と started_at の役割の違いをコメントで明記
--    - games.total_play_time : play_sessions との同期が必要な点をコメントで明記
--  v3 (2026-06-29)
--    - インデックス追加（検索・フィルター・ソートの高速化）
--    - 動作確認用サンプルデータ（テストユーザー・ゲーム6本・チャット履歴）を追加
--
-- =====================================================================

-- データベース作成（まだ存在しない場合のみ）
CREATE DATABASE IF NOT EXISTS tsumige_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tsumige_db;


-- =====================================================================
--  1. users — ユーザー情報
-- =====================================================================
--  ・avatar_url         : /uploads/avatars/ に保存したパスを格納
--  ・persona_type       : AIコンシェルジュのペルソナ種別（執事/ゲーマー仲間/妖精）
--  ・points             : ゲームクリアごとに加算される累計ポイント
--  ・notification_enabled : 通知のON/OFFフラグ（プロフィール画面の設定）
--  ・gaming_since [追加] : ゲームを始めた年（YEAR型）
--                          プロフィールの「ゲーマー歴 X年」= YEAR(NOW()) - gaming_since で計算
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
  id                   INT          NOT NULL AUTO_INCREMENT,
  name                 VARCHAR(100) NOT NULL,
  email                VARCHAR(255) NOT NULL,
  password             VARCHAR(255) NOT NULL,           -- bcryptjs でハッシュ化して保存
  avatar_url           VARCHAR(255)     NULL DEFAULT NULL,
  persona_type         ENUM('butler','gamer','fairy')
                                    NOT NULL DEFAULT 'butler',
  points               INT          NOT NULL DEFAULT 0,
  notification_enabled TINYINT(1)   NOT NULL DEFAULT 1, -- 1=ON, 0=OFF
  gaming_since         YEAR             NULL DEFAULT NULL, -- 例) 2014 → ゲーマー歴10年
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='ユーザー情報';


-- =====================================================================
--  2. games — 積みゲーマイリスト（中心テーブル）
-- =====================================================================
--  ・cover_image_url   : RAWG API から自動取得。未ヒット時はユーザーのアップロードパス
--  ・rawg_id           : RAWG API のゲームID（手動登録時は NULL）
--  ・estimated_playtime[追加] : RAWG API の playtime フィールドを時間単位で保存
--                          「残り約Xh」= estimated_playtime - (total_play_time / 60)
--  ・total_play_time   : 分単位の累計プレイ時間
--                        ⚠️ play_sessions.duration_minutes の合計値（二重管理）
--                           プレイセッション保存・更新・削除のたびにAPI側で必ず同期すること
--  ・cleared_at [追加] : ゲームのステータスが「クリア済み」になった日時
--                        status を「クリア済み」にセットするAPIで同時に NOW() を書き込む
--                        「今月クリア N本」= cleared_at が今月のレコードをカウント
--                        ステータスをクリア済み以外に戻した場合は NULL にリセットする
--  ・status            : モックのフィルターチップと対応
-- =====================================================================
CREATE TABLE IF NOT EXISTS games (
  id                 INT          NOT NULL AUTO_INCREMENT,
  user_id            INT          NOT NULL,
  title              VARCHAR(255) NOT NULL,
  genre              VARCHAR(100)     NULL DEFAULT NULL,
  platform           VARCHAR(50)      NULL DEFAULT NULL,  -- Switch / PS5 / PC など
  status             ENUM('未開封','序盤で放置','中断中','プレイ中','クリア済み')
                                   NOT NULL DEFAULT '未開封',
  cover_image_url    VARCHAR(255)     NULL DEFAULT NULL,
  rawg_id            INT              NULL DEFAULT NULL,
  estimated_playtime INT              NULL DEFAULT NULL,  -- 単位: 時間（RAWG API の playtime）
  progress_note      TEXT             NULL DEFAULT NULL,  -- 「第3の祠まで終了」など
  purchase_date      DATE             NULL DEFAULT NULL,
  total_play_time    INT          NOT NULL DEFAULT 0,     -- 単位: 分（play_sessions と同期必須）
  last_played_at     DATETIME         NULL DEFAULT NULL,
  cleared_at         DATETIME         NULL DEFAULT NULL,  -- クリア済みにした日時（今月クリア集計用）
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  FOREIGN KEY fk_games_user (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='積みゲーマイリスト';


-- =====================================================================
--  3. chat_logs — AIチャット履歴
-- =====================================================================
--  ・role : 'user' = ユーザー発言 / 'assistant' = AIの返答
--  ・チャット履歴は後から編集しないため updated_at は不要
-- =====================================================================
CREATE TABLE IF NOT EXISTS chat_logs (
  id         INT      NOT NULL AUTO_INCREMENT,
  user_id    INT      NOT NULL,
  role       ENUM('user','assistant') NOT NULL,
  message    TEXT     NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  FOREIGN KEY fk_chat_logs_user (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='AIチャット履歴';


-- =====================================================================
--  4. play_sessions — プレイセッション記録
-- =====================================================================
--  ・started_at       : 「今すぐプレイ」ボタンを押した日時
--                       DBに保存することでブラウザを閉じても
--                       「現在時刻 − started_at」で経過時間を再計算可能
--  ・stopped_at       : ストップボタンを押した日時（プレイ中は NULL）
--  ・duration_minutes : stopped_at − started_at を分単位で自動計算して保存
--  ・created_at       : DBにレコードが挿入された日時
--                       ⚠️ started_at と almost 同じだが役割が異なる
--                          started_at = ゲームを「始めた」業務時刻（UI上の操作）
--                          created_at = APIがDBにレコードを「作成した」システム時刻
-- =====================================================================
CREATE TABLE IF NOT EXISTS play_sessions (
  id               INT      NOT NULL AUTO_INCREMENT,
  user_id          INT      NOT NULL,
  game_id          INT      NOT NULL,
  started_at       DATETIME NOT NULL,
  stopped_at       DATETIME     NULL DEFAULT NULL,
  duration_minutes INT          NULL DEFAULT NULL,  -- 停止後に自動計算
  progress_note    TEXT         NULL DEFAULT NULL,  -- 「どこまでやった？」の入力内容
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  FOREIGN KEY fk_play_sessions_user (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  FOREIGN KEY fk_play_sessions_game (game_id)
    REFERENCES games(id)
    ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='プレイセッション記録';


-- =====================================================================
--  5. achievements — 実績マスターデータ
-- =====================================================================
--  ・モックの積みゲー城タブに表示される実績グリッドに対応
--  ・condition_key はアプリ側で達成判定に使う識別子
-- =====================================================================
CREATE TABLE IF NOT EXISTS achievements (
  id            INT          NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  icon          VARCHAR(10)  NOT NULL,               -- 絵文字（⚔️ 📚 🎯 など）
  description   VARCHAR(255) NOT NULL,
  condition_key VARCHAR(50)  NOT NULL,               -- アプリ側判定キー

  PRIMARY KEY (id),
  UNIQUE KEY uq_achievements_condition_key (condition_key)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='実績マスターデータ';


-- =====================================================================
--  6. user_achievements — ユーザーの実績取得記録
-- =====================================================================
--  ・user_id + achievement_id の組み合わせは重複しない（1人1実績1回）
--  ・achieved_at で「いつ獲得したか」を表示できる
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id             INT      NOT NULL AUTO_INCREMENT,
  user_id        INT      NOT NULL,
  achievement_id INT      NOT NULL,
  achieved_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_user_achievement (user_id, achievement_id),
  FOREIGN KEY fk_user_achievements_user (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  FOREIGN KEY fk_user_achievements_achievement (achievement_id)
    REFERENCES achievements(id)
    ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='ユーザーの実績取得記録';


-- =====================================================================
--  インデックス
-- =====================================================================
--  InnoDB は FOREIGN KEY に自動でインデックスを付ける。
--  ここでは「FK 以外でよく使う検索・フィルター・ソート」のカラムに追加する。
--
--  games テーブル
--    ・status      : リスト画面のフィルターチップで WHERE status = '...' を多用する
--    ・cleared_at  : プロフィールの「今月クリア N本」で WHERE cleared_at BETWEEN ... を使う
--    ・last_played_at : ホーム画面の「最近の積みゲー」で ORDER BY last_played_at DESC を使う
--
--  chat_logs テーブル
--    ・created_at  : チャット履歴を時系列で取得するとき ORDER BY created_at ASC を使う
-- =====================================================================
CREATE INDEX idx_games_status         ON games     (status);
CREATE INDEX idx_games_cleared_at     ON games     (cleared_at);
CREATE INDEX idx_games_last_played_at ON games     (last_played_at);
CREATE INDEX idx_chat_logs_created_at ON chat_logs (created_at);


-- =====================================================================
--  初期データ — 実績マスター（モックの積みゲー城タブより）
-- =====================================================================
INSERT INTO achievements (name, icon, description, condition_key) VALUES
  ('初クリア',   '⚔️', '初めてゲームをクリアした',             'first_clear'),
  ('5本クリア',  '📚', '累計5本のゲームをクリアした',           'five_clears'),
  ('連続3日',    '🎯', '3日連続でプレイセッションを記録した',   'streak_3days'),
  ('10本クリア', '🔥', '累計10本のゲームをクリアした',          'ten_clears'),
  ('城の王',     '👑', 'クリア率が80%を超えた',                 'castle_king'),
  ('全クリア',   '💎', '登録した全ゲームをクリアした',           'all_clear');


-- =====================================================================
--  サンプルデータ（動作確認用）
-- =====================================================================
--  ⚠️ 本番環境では実行しないこと。開発・テスト専用。
--  テストユーザーのパスワードは「password123」を bcryptjs でハッシュ化した値。
-- =====================================================================

-- テストユーザー
INSERT INTO users (name, email, password, persona_type, points, gaming_since) VALUES
  ('由梨花', 'test@example.com',
   '$2b$10$xOPMk5aQcQg1EEnBTdpjHe7JaCxPa2Tq0EtWHDo2RJPXg5X5Bpf7i',
   'butler', 480, 2014);

-- 積みゲーリスト（モックの6本）
INSERT INTO games (user_id, title, genre, platform, status, estimated_playtime, purchase_date) VALUES
  (1, 'ゼルダの伝説 ティアーズ オブ ザ キングダム', 'アドベンチャー', 'Switch', '序盤で放置', 60, '2023-05-12'),
  (1, 'モンスターハンター ワイルズ',               'アクションRPG',  'PS5',    '未開封',     50, '2025-02-28'),
  (1, 'ペルソナ5 ロイヤル',                        'JRPG',           'Switch', '中断中',    100, '2022-10-21'),
  (1, 'スプラトゥーン3',                           'シューター',      'Switch', 'プレイ中',   NULL,'2022-09-09'),
  (1, 'あつまれ どうぶつの森',                     'シミュレーション','Switch', '序盤で放置',  NULL,'2020-03-20'),
  (1, 'Elden Ring',                                'アクションRPG',  'PS5',    '未開封',     60, '2022-02-25');

-- チャット履歴（モックの会話）
INSERT INTO chat_logs (user_id, role, message) VALUES
  (1, 'assistant', 'ご帰還なさいませ。本日はどのようなゲーム体験をご所望でしょうか？'),
  (1, 'user',      '2時間あります。スカッとしたい'),
  (1, 'assistant', '承知いたしました。「スプラトゥーン3」のナワバリバトルが最適かと存じます！');


-- =====================================================================
--  テーブルリレーション まとめ（参考）
-- =====================================================================
--
--  users (1) ──< games (多)             ユーザーは複数の積みゲーを持つ
--  users (1) ──< chat_logs (多)         ユーザーは複数のチャット履歴を持つ
--  users (1) ──< play_sessions (多)     ユーザーは複数のプレイ記録を持つ
--  games (1) ──< play_sessions (多)     1本のゲームに複数のプレイ記録がつく
--  users (1) ──< user_achievements (多) ユーザーは複数の実績を持つ
--  achievements (1) ──< user_achievements (多)
--
-- =====================================================================
--
--  画面 ↔ カラム 対応まとめ
-- =====================================================================
--
--  [ホーム画面]
--  ヒーローカードタイトル         → games.title
--  AI推薦理由                     → Gemini APIがリアルタイム生成（保存しない）
--  プラットフォームタグ           → games.platform
--  ジャンルタグ                   → games.genre
--  「残り約Xh」タグ               → games.estimated_playtime - (games.total_play_time / 60)
--  ステータスタグ                 → games.status
--  積み/済バッジ（ヘッダー）      → games テーブルをカウント集計
--
--  [リスト画面]
--  ゲームカード                   → games の各カラム
--  ステータスフィルター           → games.status
--  購入日                         → games.purchase_date
--
--  [チャット画面]
--  メッセージ一覧                 → chat_logs テーブル
--  ペルソナ選択                   → users.persona_type（変更時に更新）
--
--  [積みゲー城画面]
--  城のHP（%）                    → クリア済み本数 / 総本数 * 100（集計、保存しない）
--  実績グリッド                   → achievements + user_achievements
--
--  [プロフィール画面]
--  名前                           → users.name
--  アバター                       → users.avatar_url
--  ゲーマー歴 X年                 → YEAR(NOW()) - users.gaming_since
--  登録日                         → users.created_at
--  ポイント                       → users.points
--  積みゲー総数                   → games テーブルをカウント集計
--  クリア済み                     → games.status = 'クリア済み' をカウント
--  プレイ中                       → games.status = 'プレイ中' をカウント
--  消化率                         → クリア数 / 総数 * 100（集計、保存しない）
--  今月クリア                     → games.cleared_at が今月のレコードをカウント
--  AIペルソナ設定                 → users.persona_type
--  通知設定                       → users.notification_enabled
--
-- =====================================================================
