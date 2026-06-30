import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { loginId, name, email, password } = await req.json()

    // 入力値のバリデーション
    if (!loginId || !name || !email || !password) {
      return NextResponse.json(
        { message: 'すべての項目を入力してください' },
        { status: 400 }
      )
    }
    if (loginId.length < 3) {
      return NextResponse.json(
        { message: 'ログインIDは3文字以上で入力してください' },
        { status: 400 }
      )
    }
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'パスワードは6文字以上で入力してください' },
        { status: 400 }
      )
    }

    // ログインIDの重複チェック
    const existingLoginId = await prisma.user.findUnique({ where: { loginId } })
    if (existingLoginId) {
      return NextResponse.json(
        { message: 'このログインIDはすでに使われています' },
        { status: 409 }
      )
    }

    // メールアドレスの重複チェック
    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json(
        { message: 'このメールアドレスはすでに登録されています' },
        { status: 409 }
      )
    }

    // パスワードをハッシュ化して保存
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { loginId, name, email, password: hashedPassword },
    })

    // セッションを発行してログイン状態にする
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    )
    session.userId      = user.id
    session.userName    = user.name
    session.personaType = user.personaType
    await session.save()

    return NextResponse.json({ message: '登録しました' }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
