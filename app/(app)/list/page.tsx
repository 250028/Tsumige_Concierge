import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import Link from 'next/link'
import Image from 'next/image'
import { GameStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import RandomSelectButton from '@/components/RandomSelectButton'

const STATUSES: GameStatus[] = ['未開封', '序盤で放置', '中断中', 'プレイ中', 'クリア済み']

// ステータスごとのバッジ色
const STATUS_COLORS: Record<GameStatus, string> = {
  未開封:     'bg-gray-200 text-gray-700',
  序盤で放置: 'bg-yellow-100 text-yellow-700',
  中断中:     'bg-orange-100 text-orange-700',
  プレイ中:   'bg-purple-100 text-purple-700',
  クリア済み: 'bg-amber-100 text-amber-700',
}

type Props = {
  searchParams: Promise<{ status?: string }>
}

export default async function GameListPage({ searchParams }: Props) {
  const { status } = await searchParams

  // セッションからログイン中のユーザーIDを取得
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  // status が正しい値の場合のみ絞り込み条件に使う
  const activeStatus = STATUSES.includes(status as GameStatus) ? (status as GameStatus) : undefined

  const games = await prisma.game.findMany({
    where: {
      userId: session.userId!,
      ...(activeStatus ? { status: activeStatus } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-purple-600">積みゲーリスト</h1>
        <div className="flex gap-2">
          <RandomSelectButton />
          <Link
            href="/games/new"
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
          >
            ＋ 登録
          </Link>
        </div>
      </header>

      {/* フィルターチップ */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        <Link
          href="/list"
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
            !activeStatus ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-300'
          }`}
        >
          すべて
        </Link>
        {STATUSES.map(s => (
          <Link
            key={s}
            href={`/list?status=${encodeURIComponent(s)}`}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              activeStatus === s ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* ゲーム一覧 */}
      <main className="px-4">
        {games.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <p className="mb-4">積みゲーはまだ登録されていません</p>
            <Link href="/games/new" className="text-purple-600 font-medium">
              最初の1本を登録する →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {games.map(game => (
              <li key={game.id}>
                <Link
                  href={`/games/${game.id}`}
                  className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3 hover:border-purple-300 transition-colors"
                >
                  {/* カバー画像（なければ頭文字アイコン） */}
                  <div className="relative w-16 h-12 shrink-0 rounded-lg overflow-hidden bg-purple-100 flex items-center justify-center">
                    {game.coverImageUrl ? (
                      <Image
                        src={game.coverImageUrl}
                        alt={game.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-purple-600 font-bold">{game.title.charAt(0)}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{game.title}</p>
                    <p className="text-xs text-gray-500">{game.platform ?? '未設定'}</p>
                    {game.progressNote && (
                      <p className="text-xs text-gray-400 truncate">{game.progressNote}</p>
                    )}
                  </div>

                  <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[game.status]}`}>
                    {game.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
