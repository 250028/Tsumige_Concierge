import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { searchGames } from '@/lib/rawg'

export async function GET(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()
  if (!query) {
    return NextResponse.json({ error: '検索ワードを入力してください' }, { status: 400 })
  }
  const limit = Number(searchParams.get('limit')) || 5

  try {
    const games = await searchGames(query, limit)
    return NextResponse.json({ games })
  } catch (e) {
    console.error('RAWG API エラー:', e)
    return NextResponse.json({ error: 'ゲーム検索に失敗しました' }, { status: 500 })
  }
}
