import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

// 通知設定の更新
export async function PATCH(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const { notificationEnabled } = await req.json()

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: { notificationEnabled: Boolean(notificationEnabled) },
    select: { notificationEnabled: true },
  })

  return NextResponse.json(updated)
}

// パスワード変更
export async function PUT(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: '現在のパスワードと新しいパスワードを入力してください' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: '新しいパスワードは8文字以上にしてください' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) {
    return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
  }

  // 現在のパスワードを照合
  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: session.userId },
    data: { password: hashed },
  })

  return NextResponse.json({ message: 'パスワードを変更しました' })
}
