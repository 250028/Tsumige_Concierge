'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Game = {
  id: number
  title: string
  status: string
  platform: string | null
  coverImageUrl: string | null
}

// ステータスに対応するバッジの色
const STATUS_COLOR: Record<string, string> = {
  未開封: 'bg-gray-100 text-gray-500',
  序盤で放置: 'bg-yellow-100 text-yellow-700',
  中断中: 'bg-orange-100 text-orange-700',
  プレイ中: 'bg-blue-100 text-blue-700',
  クリア済み: 'bg-green-100 text-green-700',
}

type Props = { onClose: () => void }

export default function ListSheet({ onClose }: Props) {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/games')
      .then(r => r.json())
      .then(data => {
        setGames(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">📋 積みゲーリスト</p>
        <span className="text-xs text-gray-400 dark:text-gray-500">{games.length} 本</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm pt-10">読み込み中…</p>
        ) : games.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm pt-10">ゲームが登録されていません</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {games.map(game => (
              <li key={game.id}>
                <Link
                  href={`/games/${game.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600"
                >
                  {/* カバー画像 or プレースホルダー */}
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center shrink-0 overflow-hidden">
                    {game.coverImageUrl ? (
                      <img src={game.coverImageUrl} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">🎮</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{game.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{game.platform ?? 'プラットフォーム未設定'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[game.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {game.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 一覧ページへのリンク */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700">
        <Link
          href="/list"
          onClick={onClose}
          className="block w-full text-center py-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 text-sm font-semibold hover:bg-purple-100 dark:hover:bg-purple-900"
        >
          リスト全体を見る →
        </Link>
      </div>
    </div>
  )
}
