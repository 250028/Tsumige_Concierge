import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import { generateRecommendReason } from '@/lib/gemini'

// キャッシュなしで毎回新鮮なおすすめ理由を生成する（再生成ボタン用）
export async function GET(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const gameId = Number(searchParams.get('gameId'))
  if (!gameId) {
    return NextResponse.json({ error: 'gameId が必要です' }, { status: 400 })
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } })
  if (!game || game.userId !== session.userId) {
    return NextResponse.json({ error: 'ゲームが見つかりません' }, { status: 404 })
  }

  try {
    const reason = await generateRecommendReason({
      title: game.title,
      genre: game.genre,
      platform: game.platform,
      status: game.status,
      lastPlayedAt: game.lastPlayedAt,
      progressNote: game.progressNote,
    })
    return NextResponse.json({ reason })
  } catch (e) {
    console.error('おすすめ理由の再生成に失敗:', e)
    return NextResponse.json({ error: 'AI生成に失敗しました' }, { status: 500 })
  }
}
