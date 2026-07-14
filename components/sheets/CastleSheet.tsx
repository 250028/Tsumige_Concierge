'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CountUp from '@/components/CountUp'

type Game = { status: string }

// 消化率に応じた城の絵文字
function getCastleEmoji(rate: number) {
  if (rate >= 80) return '🏯'
  if (rate >= 50) return '🏰'
  if (rate >= 20) return '🧱'
  return '⛺'
}

type Props = { onClose: () => void }

export default function CastleSheet({ onClose }: Props) {
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

  const total = games.length
  const cleared = games.filter(g => g.status === 'クリア済み').length
  const playing = games.filter(g => g.status === 'プレイ中').length
  const clearRate = total > 0 ? Math.round((cleared / total) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">🏰 積みゲー城</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm pt-10">読み込み中…</p>
        ) : (
          <>
            {/* 城の絵文字と消化率 */}
            <div className="text-center mb-6">
              <div className="text-7xl mb-3">{getCastleEmoji(clearRate)}</div>
              <p className="text-3xl font-bold text-purple-600"><CountUp value={clearRate} suffix="%" /></p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">消化率</p>
            </div>

            {/* 統計カード */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-purple-50 dark:bg-purple-950 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-purple-600"><CountUp value={total} /></p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">積みゲー</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-500"><CountUp value={playing} /></p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">プレイ中</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-500"><CountUp value={cleared} /></p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">クリア済み</p>
              </div>
            </div>

            {/* メッセージ */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
              {clearRate >= 50
                ? '素晴らしい！城はどんどん立派になっています。'
                : 'ゲームをクリアして城を育てよう！'}
            </p>
          </>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 dark:border-gray-700">
        <Link
          href="/castle"
          onClick={onClose}
          className="block w-full text-center py-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 text-sm font-semibold hover:bg-purple-100 dark:hover:bg-purple-900"
        >
          城を詳しく見る →
        </Link>
      </div>
    </div>
  )
}
