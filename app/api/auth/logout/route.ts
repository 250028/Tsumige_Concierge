import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

export async function POST() {
  // セッションを破棄してクッキーを削除する
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  )
  session.destroy()

  return NextResponse.json({ message: 'ログアウトしました' })
}
