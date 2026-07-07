import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import { PersonaType } from '@prisma/client'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      loginId: true,
      avatarUrl: true,
      personaType: true,
      gamingSince: true,
      points: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const { name, gamingSince, personaType } = await req.json()

  const validPersonas: PersonaType[] = ['butler', 'gamer', 'fairy']

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: {
      ...(name && typeof name === 'string' ? { name: name.trim() } : {}),
      ...(gamingSince !== undefined ? { gamingSince: gamingSince ? Number(gamingSince) : null } : {}),
      ...(personaType && validPersonas.includes(personaType) ? { personaType } : {}),
    },
    select: { name: true, gamingSince: true, personaType: true },
  })

  return NextResponse.json(updated)
}
