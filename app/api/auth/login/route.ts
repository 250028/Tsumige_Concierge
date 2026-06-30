import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { loginId, password } = await req.json()

    // 入力値のバリデーション
    if (!loginId || !password) {
      return NextResponse.json(
        { message: 'ログインIDとパスワードを入力してください' },
        { status: 400 }
      )
    }

    // ログインIDでユーザーを検索
    const user = await prisma.user.findUnique({ where: { loginId } })
    if (!user) {
      // セキュリティのため「どちらが間違い」かは教えない
      return NextResponse.json(
        { message: 'ログインIDまたはパスワードが違います' },
        { status: 401 }
      )
    }

    // パスワードを照合
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { message: 'ログインIDまたはパスワードが違います' },
        { status: 401 }
      )
    }

    // セッションを発行
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    )
    session.userId      = user.id
    session.userName    = user.name
    session.personaType = user.personaType
    await session.save()

    return NextResponse.json({ message: 'ログインしました' })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
