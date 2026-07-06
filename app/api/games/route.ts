import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { GameStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

// ステータスの絞り込みに使える値かどうかをチェックする
function isValidStatus(value: unknown): value is GameStatus {
  return typeof value === 'string' && Object.values(GameStatus).includes(value as GameStatus)
}

// 一覧取得: ログイン中のユーザーが持つゲームを新しい順に返す
export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.userId) {
      return NextResponse.json({ message: 'ログインしてください' }, { status: 401 })
    }

    const statusParam = req.nextUrl.searchParams.get('status')

    const games = await prisma.game.findMany({
      where: {
        userId: session.userId,
        // status クエリが指定されている場合のみ絞り込む
        ...(isValidStatus(statusParam) ? { status: statusParam } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(games)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

// 登録: ログイン中のユーザーに紐づく新しいゲームを作成する
export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.userId) {
      return NextResponse.json({ message: 'ログインしてください' }, { status: 401 })
    }

    const { title, genre, platform, status, purchaseDate, progressNote } = await req.json()

    // タイトルは必須
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ message: 'タイトルを入力してください' }, { status: 400 })
    }

    // ステータスを指定した場合は enum の値かどうかを確認する
    if (status !== undefined && !isValidStatus(status)) {
      return NextResponse.json({ message: 'ステータスの値が不正です' }, { status: 400 })
    }

    const game = await prisma.game.create({
      data: {
        userId: session.userId,
        title: title.trim(),
        genre: genre || null,
        platform: platform || null,
        status: status ?? GameStatus.未開封,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        progressNote: progressNote || null,
      },
    })

    return NextResponse.json(game, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
