import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 })
  }

  const game = await prisma.game.findUnique({ where: { id: Number(id) } })
  if (!game || game.userId !== session.userId) {
    return NextResponse.json({ error: 'ゲームが見つかりません' }, { status: 404 })
  }

  const formData = await req.formData()
  const file = formData.get('cover') as File | null
  if (!file) {
    return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext ?? '')) {
    return NextResponse.json({ error: '画像ファイル（jpg/png/gif/webp）のみアップロード可能です' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const filename = `game_${id}_${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'covers')

  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  const coverImageUrl = `/uploads/covers/${filename}`

  await prisma.game.update({
    where: { id: Number(id) },
    data: { coverImageUrl },
  })

  return NextResponse.json({ coverImageUrl })
}
