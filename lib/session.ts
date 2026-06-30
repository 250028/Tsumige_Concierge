import { SessionOptions } from 'iron-session'

// セッションに保存するデータの型定義
export type SessionData = {
  userId:      number
  userName:    string
  personaType: string
}

// iron-session の設定
export const sessionOptions: SessionOptions = {
  // パスワード：32文字以上のランダム文字列（.env.local の SESSION_SECRET）
  password:    process.env.SESSION_SECRET as string,
  cookieName:  'tsumige_session',
  cookieOptions: {
    // 本番環境では https のみ送信。開発環境は false
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7日間
  },
}
