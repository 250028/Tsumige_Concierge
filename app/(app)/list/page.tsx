import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import Link from 'next/link'
import Image from 'next/image'
import { GameStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import RandomSelectButton from '@/components/RandomSelectButton'
import EmptyState from '@/components/EmptyState'

const STATUSES: GameStatus[] = ['未開封', '序盤で放置', '中断中', 'プレイ中', 'クリア済み']

// ステータスごとのバッジ色
const STATUS_COLORS: Record<GameStatus, string> = {
  未開封:     'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
  序盤で放置: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400',
  中断中:     'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400',
  プレイ中:   'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
  クリア済み: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400',
}

type Props = {
  searchParams: Promise<{ status?: string; view?: string }>
}

export default async function GameListPage({ searchParams }: Props) {
  const { status, view } = await searchParams

  // セッションからログイン中のユーザーIDを取得
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  // status が正しい値の場合のみ絞り込み条件に使う
  const activeStatus = STATUSES.includes(status as GameStatus) ? (status as GameStatus) : undefined
  // デフォルトはグリッド表示。view=list のときだけリスト表示にする
  const isGridView = view !== 'list'

  // 表示切り替え後も現在のフィルター条件（status）を維持するためのクエリ文字列
  const statusQuery = activeStatus ? `status=${encodeURIComponent(activeStatus)}` : ''
  const listViewHref = `/list?${[statusQuery, 'view=list'].filter(Boolean).join('&')}`
  const gridViewHref = statusQuery ? `/list?${statusQuery}` : '/list'

  const games = await prisma.game.findMany({
    where: {
      userId: session.userId!,
      ...(activeStatus ? { status: activeStatus } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 pb-24">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-purple-600">積みゲーリスト</h1>
        <div className="flex gap-2">
          {/* リスト⇄グリッド表示切り替え */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-sm">
            <Link
              href={listViewHref}
              aria-label="リスト表示"
              className={`px-3 py-2 transition-colors ${!isGridView ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
            >
              ☰
            </Link>
            <Link
              href={gridViewHref}
              aria-label="グリッド表示"
              className={`px-3 py-2 transition-colors ${isGridView ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
            >
              ▦
            </Link>
          </div>
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
          href={isGridView ? '/list' : '/list?view=list'}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
            !activeStatus ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
          }`}
        >
          すべて
        </Link>
        {STATUSES.map(s => (
          <Link
            key={s}
            href={`/list?status=${encodeURIComponent(s)}${isGridView ? '' : '&view=list'}`}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              activeStatus === s ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* ゲーム一覧 */}
      <main className="px-4">
        {games.length === 0 ? (
          <div>
            <EmptyState message="積みゲーはまだ登録されていません" />
            <div className="text-center -mt-4">
              <Link href="/games/new" className="text-purple-600 font-medium">
                最初の1本を登録する →
              </Link>
            </div>
          </div>
        ) : isGridView ? (
          // Steam風フルブリードグリッド：枠なし・カバー画像中心
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {games.map(game => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group block transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-purple-100 dark:bg-purple-950 group-hover:shadow-md">
                  {game.coverImageUrl ? (
                    <Image
                      src={game.coverImageUrl}
                      alt={game.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized={game.coverImageUrl.startsWith('/')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-purple-600 dark:text-purple-300">
                      {game.title.charAt(0)}
                    </div>
                  )}
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[game.status]}`}>
                    {game.status}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{game.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{game.platform ?? '未設定'}</p>
              </Link>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {games.map(game => (
              <li key={game.id}>
                <Link
                  href={`/games/${game.id}`}
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:border-purple-300 hover:-translate-y-1 hover:shadow-md transition-all duration-200"
                >
                  {/* カバー画像（なければ頭文字アイコン） */}
                  <div className="relative w-16 h-12 shrink-0 rounded-lg overflow-hidden bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                    {game.coverImageUrl ? (
                      <Image
                        src={game.coverImageUrl}
                        alt={game.title}
                        fill
                        className="object-cover"
                        unoptimized={game.coverImageUrl.startsWith('/')}
                      />
                    ) : (
                      <span className="text-purple-600 dark:text-purple-300 font-bold">{game.title.charAt(0)}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{game.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{game.platform ?? '未設定'}</p>
                    {game.progressNote && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{game.progressNote}</p>
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
