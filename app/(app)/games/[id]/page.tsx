import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import GameDetailClient from '@/components/GameDetailClient'

type Props = {
  params: Promise<{ id: string }>
}

export default async function GameDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  const [game, activeSession] = await Promise.all([
    prisma.game.findUnique({ where: { id: Number(id) } }),
    prisma.playSession.findFirst({
      where: { gameId: Number(id), userId: session.userId!, stoppedAt: null },
      select: { id: true, startedAt: true },
    }),
  ])

  // 存在しない、または他人のゲームなら 404
  if (!game || game.userId !== session.userId) {
    notFound()
  }

  return (
    <GameDetailClient
      game={{
        id: game.id,
        title: game.title,
        genre: game.genre,
        platform: game.platform,
        status: game.status,
        purchaseDate: game.purchaseDate ? game.purchaseDate.toISOString().slice(0, 10) : '',
        progressNote: game.progressNote,
        totalPlayTime: game.totalPlayTime,
        coverImageUrl: game.coverImageUrl,
      }}
      activeSessionId={activeSession?.id ?? null}
      activeSessionStartedAt={activeSession?.startedAt.toISOString() ?? null}
    />
  )
}
