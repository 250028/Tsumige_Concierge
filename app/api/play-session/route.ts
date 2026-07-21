import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import { checkAndGrantAchievements } from '@/lib/achievements'
import { notifyAchievements } from '@/lib/notifications'

// プレイセッションを開始する
export async function POST(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const { gameId } = await req.json()
  if (!gameId) {
    return NextResponse.json({ error: 'gameId が必要です' }, { status: 400 })
  }

  // 自分のゲームか確認
  const game = await prisma.game.findUnique({ where: { id: Number(gameId) } })
  if (!game || game.userId !== session.userId) {
    return NextResponse.json({ error: 'ゲームが見つかりません' }, { status: 404 })
  }

  // 既に進行中のセッションがあれば、それを返す（二重起動防止）
  const existing = await prisma.playSession.findFirst({
    where: { gameId: Number(gameId), userId: session.userId, stoppedAt: null },
  })
  if (existing) {
    return NextResponse.json({ id: existing.id, startedAt: existing.startedAt })
  }

  const playSession = await prisma.playSession.create({
    data: {
      userId: session.userId,
      gameId: Number(gameId),
      startedAt: new Date(),
    },
  })

  // ステータスを「プレイ中」に更新（未開封・放置の場合のみ）
  if (['未開封', '序盤で放置', '中断中'].includes(game.status)) {
    await prisma.game.update({
      where: { id: Number(gameId) },
      data: { status: 'プレイ中', lastPlayedAt: new Date() },
    })
  }

  // プレイセッションを記録したタイミングで「連続3日」実績をチェック
  const newAchievements = await checkAndGrantAchievements(session.userId)
  if (newAchievements.length > 0) {
    await notifyAchievements(session.userId, newAchievements)
  }

  return NextResponse.json({ id: playSession.id, startedAt: playSession.startedAt, newAchievements })
}
