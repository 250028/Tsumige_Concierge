import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // users テーブルの件数を取得して接続確認
    const userCount = await prisma.user.count()

    return NextResponse.json({
      status:    'ok',
      message:   '接続できました',
      userCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { status: 'error', message },
      { status: 500 }
    )
  }
}
