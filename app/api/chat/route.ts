import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import { generateChatReply } from '@/lib/gemini'

export async function POST(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const { message, persona } = await req.json()
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'メッセージが不正です' }, { status: 400 })
  }

  const games = await prisma.game.findMany({
    where: { userId: session.userId },
    select: {
      title: true,
      genre: true,
      platform: true,
      status: true,
      lastPlayedAt: true,
      progressNote: true,
    },
  })

  const validPersona = ['butler', 'gamer', 'fairy'].includes(persona) ? persona : 'butler'

  try {
    const reply = await generateChatReply(message, games, validPersona)
    return NextResponse.json({ reply })
  } catch (e) {
    console.error('Gemini API エラー:', e)
    return NextResponse.json({ error: 'AI返答の生成に失敗しました' }, { status: 500 })
  }
}
