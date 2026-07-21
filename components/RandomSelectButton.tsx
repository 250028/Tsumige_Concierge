'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RandomSelectButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRandom() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/random')
      const data = await res.json()
      if (data.id) {
        router.push(`/games/${data.id}`)
      } else {
        setError(data.error ?? 'ランダム選択に失敗しました')
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleRandom}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading ? '選択中…' : '🎲 おまかせ'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
