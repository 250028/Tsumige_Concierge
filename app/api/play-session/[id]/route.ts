import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

type Props = { params: Promise<{ id: string }> }

// プレイセッションを停止する
export async function PATCH(req: Request, { params }: Props) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const { id } = await params
  const { progressNote } = await req.json().catch(() => ({}))

  const playSession = await prisma.playSession.findUnique({ where: { id: Number(id) } })
  if (!playSession || playSession.userId !== session.userId) {
    return NextResponse.json({ error: 'セッションが見つかりません' }, { status: 404 })
  }
  if (playSession.stoppedAt) {
    return NextResponse.json({ error: '既に停止済みです' }, { status: 400 })
  }

  const stoppedAt = new Date()
  const durationMinutes = Math.round(
    (stoppedAt.getTime() - playSession.startedAt.getTime()) / 60000
  )

  // セッションを停止して経過時間を記録
  await prisma.playSession.update({
    where: { id: Number(id) },
    data: {
      stoppedAt,
      durationMinutes,
      ...(progressNote ? { progressNote } : {}),
    },
  })

  // ゲームの累計プレイ時間と最終プレイ日時を更新
  await prisma.game.update({
    where: { id: playSession.gameId },
    data: {
      totalPlayTime: { increment: durationMinutes },
      lastPlayedAt: stoppedAt,
    },
  })

  return NextResponse.json({ durationMinutes })
}
