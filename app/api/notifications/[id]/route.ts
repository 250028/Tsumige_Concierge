import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

type Params = { params: Promise<{ id: string }> }

// 通知を既読にする
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const { id } = await params
  const notification = await prisma.notification.findUnique({ where: { id: Number(id) } })
  if (!notification || notification.userId !== session.userId) {
    return NextResponse.json({ error: '通知が見つかりません' }, { status: 404 })
  }

  const updated = await prisma.notification.update({
    where: { id: Number(id) },
    data: { isRead: true },
  })

  return NextResponse.json(updated)
}
