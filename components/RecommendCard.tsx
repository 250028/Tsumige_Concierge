'use client'

import { useState } from 'react'
import Link from 'next/link'

type Props = {
  gameId: number
  gameTitle: string
  initialReason: string
}

export default function RecommendCard({ gameId, gameTitle, initialReason }: Props) {
  const [reason, setReason] = useState(initialReason)
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    setLoading(true)
    try {
      const res = await fetch(`/api/recommend?gameId=${gameId}`)
      const data = await res.json()
      if (data.reason) setReason(data.reason)
    } catch {
      // 失敗しても既存の理由を維持
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-white">✨ コンシェルジュより</p>
        <button
          onClick={handleRefresh}
          disabled={loading}
          title="別の理由を生成"
          className="text-xs text-white/70 hover:text-white disabled:opacity-40 transition-colors"
        >
          {loading ? '生成中…' : '🔄 別の理由'}
        </button>
      </div>
      <Link href={`/games/${gameId}`} className="block hover:opacity-80 transition-opacity">
        <h2 className="text-lg font-bold text-white mb-1">{gameTitle}</h2>
        <p className="text-sm text-white/90 leading-relaxed">{reason}</p>
      </Link>
    </div>
  )
}
