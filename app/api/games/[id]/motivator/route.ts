import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import { generateMotivator } from '@/lib/gemini'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const game = await prisma.game.findUnique({ where: { id: Number(id) } })
  if (!game || game.userId !== session.userId) {
    return NextResponse.json({ error: 'ゲームが見つかりません' }, { status: 404 })
  }

  try {
    const motivator = await generateMotivator({
      title: game.title,
      genre: game.genre,
      platform: game.platform,
      status: game.status,
      lastPlayedAt: game.lastPlayedAt,
      progressNote: game.progressNote,
    })
    return NextResponse.json({ motivator })
  } catch (e) {
    console.error('モチベーター生成に失敗:', e)
    return NextResponse.json({ error: 'AI生成に失敗しました' }, { status: 500 })
  }
}
