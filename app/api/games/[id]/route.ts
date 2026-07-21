import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { GameStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import { checkAndGrantAchievements } from '@/lib/achievements'
import { notifyAchievements, notifyPoints } from '@/lib/notifications'

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

    // 「クリア済み」に変わった（未クリア→クリア済み）タイミングかどうか
    const enteringCleared =
      nextStatus === GameStatus.クリア済み &&
      result.game!.status !== GameStatus.クリア済み

    // ポイントは初回クリア時のみ付与し、再クリアでは付与しない（pointsGrantedAt で判定）
    const justCleared = enteringCleared && !result.game!.pointsGrantedAt
    // すでにポイント付与済みのゲームを再クリアした場合（UIに小さく案内するためのフラグ）
    const alreadyPointsGranted = enteringCleared && !!result.game!.pointsGrantedAt

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
          ...(justCleared ? { pointsGrantedAt: new Date() } : {}),
        },
      }),
      ...(justCleared
        ? [prisma.user.update({
            where: { id: session.userId },
            data: { points: { increment: 100 } },
          })]
        : []),
    ])

    // クリア時に実績チェック（新規解除分の実績名を返す）
    const newAchievements = justCleared
      ? await checkAndGrantAchievements(session.userId)
      : []

    if (justCleared) {
      await notifyPoints(session.userId, updated.id, updated.title, 100)
    }
    if (newAchievements.length > 0) {
      await notifyAchievements(session.userId, newAchievements)
    }

    return NextResponse.json({
      ...updated,
      pointsAdded: justCleared ? 100 : 0,
      newAchievements,
      alreadyPointsGranted,
    })
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
