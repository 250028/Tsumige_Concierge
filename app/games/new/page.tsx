'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PLATFORMS = ['Switch', 'PS5', 'PS4', 'Xbox', 'PC', 'その他']
const STATUSES = ['未開封', '序盤で放置', '中断中', 'プレイ中', 'クリア済み'] as const

export default function NewGamePage() {
  const router = useRouter()
  const [title, setTitle]               = useState('')
  const [genre, setGenre]                 = useState('')
  const [platform, setPlatform]           = useState(PLATFORMS[0])
  const [status, setStatus]               = useState<(typeof STATUSES)[number]>('未開封')
  const [purchaseDate, setPurchaseDate]   = useState('')
  const [progressNote, setProgressNote]   = useState('')
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)

  // 登録処理
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/games', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title, genre, platform, status, purchaseDate, progressNote }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.message)
      setLoading(false)
      return
    }

    router.push('/list')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-xl font-bold text-purple-600 mb-6">ゲーム登録</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* タイトル（必須） */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ゼルダの伝説"
              required
              className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* ジャンル */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">ジャンル</label>
            <input
              type="text"
              value={genre}
              onChange={e => setGenre(e.target.value)}
              placeholder="アクションRPG"
              className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* プラットフォーム */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">プラットフォーム</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
            >
              {PLATFORMS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* ステータス */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">ステータス</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as (typeof STATUSES)[number])}
              className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 購入日 */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">購入日</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* 進捗メモ */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">進捗メモ</label>
            <textarea
              value={progressNote}
              onChange={e => setProgressNote(e.target.value)}
              placeholder="第3の祠まで終了"
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* エラーメッセージ */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  )
}
