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
    // 本来は本番(https)のみ true にしたいが、現状は HTTPS 未対応のIP直アクセスのため false に固定
    // TODO: nginx に SSL(HTTPS)を設定したら process.env.NODE_ENV === 'production' に戻す
    secure: false,
    maxAge: 60 * 60 * 24 * 7, // 7日間
  },
}
