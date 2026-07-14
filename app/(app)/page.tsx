import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import { generateRecommendReason } from '@/lib/gemini'
import RandomSelectButton from '@/components/RandomSelectButton'
import RecommendCard from '@/components/RecommendCard'

export default async function Home() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const userId = session.userId!

  const games = await prisma.game.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })

  const total    = games.length
  const playing  = games.filter(g => g.status === 'プレイ中').length
  const cleared  = games.filter(g => g.status === 'クリア済み').length
  const clearRate = total > 0 ? Math.round((cleared / total) * 100) : 0

  // 「今日の1本」：最後にプレイした日時が古い順で選出し、AIでおすすめ理由を生成
  const heroGame = games
    .filter(g => g.status !== 'クリア済み')
    .sort((a, b) => (a.lastPlayedAt?.getTime() ?? 0) - (b.lastPlayedAt?.getTime() ?? 0))[0]

  // AI生成に失敗しても画面が壊れないようにフォールバック
  let recommendReason = 'AIによるおすすめ理由は準備中です。今は最後にプレイした日が古い1本を表示しています。'
  if (heroGame) {
    try {
      // 同じゲーム・同じステータスなら1時間はAPIを呼ばずキャッシュを返す
      const getCachedReason = unstable_cache(
        () => generateRecommendReason({
          title: heroGame.title,
          genre: heroGame.genre,
          platform: heroGame.platform,
          status: heroGame.status,
          lastPlayedAt: heroGame.lastPlayedAt,
          progressNote: heroGame.progressNote,
        }),
        [`recommend-${heroGame.id}-${heroGame.status}`],
        { revalidate: 3600 }
      )
      recommendReason = await getCachedReason()
    } catch (e) {
      console.error('おすすめ理由の生成に失敗:', e)
    }
  }

  const recentGames = games.slice(0, 3)

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 統計バッジ */}
      <div className="px-4 pt-4 flex gap-2">
        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-sm font-semibold">
          積み {total}
        </span>
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-600 text-sm font-semibold">
          済 {cleared}
        </span>
      </div>

      {/* 統計グリッド（PCのみ） */}
      <div className="hidden md:grid grid-cols-4 gap-3 px-4 pt-4">
        <div className="bg-white rounded-xl border border-purple-100 p-3">
          <p className="text-xs text-gray-500">積みゲー総数</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-purple-100 p-3">
          <p className="text-xs text-gray-500">プレイ中</p>
          <p className="text-2xl font-bold">{playing}</p>
        </div>
        <div className="bg-white rounded-xl border border-purple-100 p-3">
          <p className="text-xs text-gray-500">クリア済み</p>
          <p className="text-2xl font-bold">{cleared}</p>
        </div>
        <div className="bg-white rounded-xl border border-purple-100 p-3">
          <p className="text-xs text-gray-500">消化率</p>
          <p className="text-2xl font-bold">{clearRate}%</p>
        </div>
      </div>

      {/* 今日の1本 */}
      <div className="px-4 pt-6">
        <p className="text-xs font-bold text-gray-500 tracking-wide mb-2">🎯 今日の1本</p>
        {heroGame ? (
          <RecommendCard
            gameId={heroGame.id}
            gameTitle={heroGame.title}
            initialReason={recommendReason}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center text-gray-400">
            積みゲーを登録すると、ここにおすすめが表示されます
          </div>
        )}
      </div>

      {/* おまかせセレクト */}
      <div className="px-4 pt-6">
        <p className="text-xs font-bold text-gray-500 tracking-wide mb-2">🎲 おまかせで選ぶ</p>
        <div className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">今日何やるか迷ったら</p>
          <RandomSelectButton />
        </div>
      </div>

      {/* AIチャットストリップ */}
      <div className="px-4 pt-6">
        <p className="text-xs font-bold text-gray-500 tracking-wide mb-2">💬 コンシェルジュに話す</p>
        <Link
          href="/chat"
          className="block bg-white rounded-2xl border border-purple-100 p-4 hover:border-purple-300 transition-colors"
        >
          <p className="text-sm text-gray-500 mb-3">AIコンシェルジュに気分や状況を話しかけてみよう</p>
          <div className="w-full px-4 py-2 rounded-full bg-gray-100 text-gray-400 text-sm">
            「スカッとしたい」「2時間ある」など…
          </div>
        </Link>
      </div>

      {/* 最近の積みゲー */}
      <div className="px-4 pt-6 pb-6">
        <p className="text-xs font-bold text-gray-500 tracking-wide mb-2">📋 最近の積みゲー</p>
        {recentGames.length === 0 ? (
          <p className="text-center text-gray-400 py-6">まだ登録がありません</p>
        ) : (
          <ul className="space-y-2">
            {recentGames.map(game => (
              <li key={game.id}>
                <Link
                  href={`/games/${game.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 hover:border-purple-300 transition-colors"
                >
                  <div className="relative w-9 h-9 shrink-0 rounded-lg overflow-hidden bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                    {game.coverImageUrl ? (
                      <Image
                        src={game.coverImageUrl}
                        alt={game.title}
                        fill
                        className="object-cover"
                        unoptimized={game.coverImageUrl.startsWith('/')}
                      />
                    ) : (
                      game.title.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{game.title}</p>
                    <p className="text-xs text-gray-500">{game.genre ?? '未設定'} ・ {game.platform ?? '未設定'}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-500">{game.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="text-center pt-2">
          <Link href="/list" className="text-sm text-purple-600 font-medium">
            すべて見る →
          </Link>
        </div>
      </div>
    </div>
  )
}
