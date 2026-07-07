import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { GameStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

function isValidStatus(value: unknown): value is GameStatus {
  return typeof value === 'string' && Object.values(GameStatus).includes(value as GameStatus)
}

type Params = { params: Promise<{ id: string }> }

// 指定した id のゲームを取得し、所有者チェックまで行う共通処理
async function findOwnedGame(id: number, userId: number) {
  const game = await prisma.game.findUnique({ where: { id } })
  if (!game) {
    return { error: NextResponse.json({ message: 'ゲームが見つかりません' }, { status: 404 }) }
  }
  if (game.userId !== userId) {
    return { error: NextResponse.json({ message: 'この操作は許可されていません' }, { status: 403 }) }
  }
  return { game }
}

// 詳細取得
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.userId) {
      return NextResponse.json({ message: 'ログインしてください' }, { status: 401 })
    }

    const { id } = await params
    const result = await findOwnedGame(Number(id), session.userId)
    if (result.error) return result.error

    return NextResponse.json(result.game)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

// 更新
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.userId) {
      return NextResponse.json({ message: 'ログインしてください' }, { status: 401 })
    }

    const { id } = await params
    const result = await findOwnedGame(Number(id), session.userId)
    if (result.error) return result.error

    const { title, genre, platform, status, purchaseDate, progressNote } = await req.json()

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ message: 'タイトルを入力してください' }, { status: 400 })
    }
    if (status !== undefined && !isValidStatus(status)) {
      return NextResponse.json({ message: 'ステータスの値が不正です' }, { status: 400 })
    }

    // ステータスが「クリア済み」に変わった時だけ clearedAt を記録し、それ以外は解除する
    const nextStatus: GameStatus = status ?? result.game.status
    const clearedAt = nextStatus === GameStatus.クリア済み ? new Date() : null

    // 「クリア済み」に初めて変わったときだけポイントを加算（クリア済み→クリア済みは対象外）
    const justCleared =
      nextStatus === GameStatus.クリア済み &&
      result.game!.status !== GameStatus.クリア済み

    const [updated] = await prisma.$transaction([
      prisma.game.update({
        where: { id: Number(id) },
        data: {
          title: title.trim(),
          genre: genre || null,
          platform: platform || null,
          status: nextStatus,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          progressNote: progressNote || null,
          clearedAt,
        },
      }),
      ...(justCleared
        ? [prisma.user.update({
            where: { id: session.userId },
            data: { points: { increment: 100 } },
          })]
        : []),
    ])

    return NextResponse.json({ ...updated, pointsAdded: justCleared ? 100 : 0 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

// 削除
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.userId) {
      return NextResponse.json({ message: 'ログインしてください' }, { status: 401 })
    }

    const { id } = await params
    const result = await findOwnedGame(Number(id), session.userId)
    if (result.error) return result.error

    await prisma.game.delete({ where: { id: Number(id) } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
