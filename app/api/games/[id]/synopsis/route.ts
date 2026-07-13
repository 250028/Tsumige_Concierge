import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import { generateSynopsis } from '@/lib/gemini'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.userId) {
      return NextResponse.json({ message: 'ログインしてください' }, { status: 401 })
    }

    const { id } = await params
    const game = await prisma.game.findUnique({ where: { id: Number(id) } })

    if (!game || game.userId !== session.userId) {
      return NextResponse.json({ message: 'ゲームが見つかりません' }, { status: 404 })
    }

    const synopsis = await generateSynopsis({
      title:        game.title,
      genre:        game.genre,
      platform:     game.platform,
      status:       game.status,
      lastPlayedAt: game.lastPlayedAt,
      progressNote: game.progressNote,
    })

    return NextResponse.json({ synopsis })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
