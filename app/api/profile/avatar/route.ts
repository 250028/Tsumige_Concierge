import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

export async function POST(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('avatar') as File | null
  if (!file) {
    return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })
  }

  // 画像ファイルのみ許可
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext ?? '')) {
    return NextResponse.json({ error: '画像ファイル（jpg/png/gif/webp）のみアップロード可能です' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // ファイル名: userId_タイムスタンプ.拡張子
  const filename = `${session.userId}_${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')

  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  const avatarUrl = `/uploads/avatars/${filename}`

  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarUrl },
  })

  return NextResponse.json({ avatarUrl })
}
