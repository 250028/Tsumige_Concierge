import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  // クリア済み以外のゲームをすべて取得してサーバー側でランダム選出
  const games = await prisma.game.findMany({
    where: {
      userId: session.userId,
      status: { not: 'クリア済み' },
    },
    select: { id: true },
  })

  if (games.length === 0) {
    return NextResponse.json({ error: 'ゲームが登録されていません' }, { status: 404 })
  }

  const picked = games[Math.floor(Math.random() * games.length)]
  return NextResponse.json({ id: picked.id })
}
