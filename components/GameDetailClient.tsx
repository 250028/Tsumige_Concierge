'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PlayTimer from '@/components/PlayTimer'

const PLATFORMS = ['Switch', 'PS5', 'PS4', 'Xbox', 'PC', 'その他']
const STATUSES = ['未開封', '序盤で放置', '中断中', 'プレイ中', 'クリア済み'] as const

type Game = {
  id: number
  title: string
  genre: string | null
  platform: string | null
  status: (typeof STATUSES)[number]
  purchaseDate: string
  progressNote: string | null
  totalPlayTime: number
}

type Props = {
  game: Game
  activeSessionId: number | null
  activeSessionStartedAt: string | null
}

export default function GameDetailClient({ game, activeSessionId, activeSessionStartedAt }: Props) {
  const router = useRouter()
  const [editing, setEditing]           = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  const [title, setTitle]               = useState(game.title)
  const [genre, setGenre]               = useState(game.genre ?? '')
  const [platform, setPlatform]         = useState(game.platform ?? PLATFORMS[0])
  const [status, setStatus]             = useState<(typeof STATUSES)[number]>(game.status)
  const [purchaseDate, setPurchaseDate] = useState(game.purchaseDate)
  const [progressNote, setProgressNote] = useState(game.progressNote ?? '')

  // 編集内容を保存
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(`/api/games/${game.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title, genre, platform, status, purchaseDate, progressNote }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.message)
      setLoading(false)
      return
    }

    setEditing(false)
    setLoading(false)
    router.refresh()
  }

  // 編集をキャンセルして表示中の値に戻す
  function handleCancel() {
    setTitle(game.title)
    setGenre(game.genre ?? '')
    setPlatform(game.platform ?? PLATFORMS[0])
    setStatus(game.status)
    setPurchaseDate(game.purchaseDate)
    setProgressNote(game.progressNote ?? '')
    setError('')
    setEditing(false)
  }

  // 削除処理
  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/games/${game.id}`, { method: 'DELETE' })

    if (!res.ok) {
      const data = await res.json()
      setError(data.message)
      setLoading(false)
      setConfirmingDelete(false)
      return
    }

    router.push('/list')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-xl font-bold text-purple-600 mb-6">
          {editing ? 'ゲーム編集' : 'ゲーム詳細'}
        </h1>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">ジャンル</label>
              <input
                type="text"
                value={genre}
                onChange={e => setGenre(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
              />
            </div>

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

            <div>
              <label className="block text-sm text-gray-700 mb-1">購入日</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">進捗メモ</label>
              <textarea
                value={progressNote}
                onChange={e => setProgressNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium transition-colors"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">タイトル</p>
              <p className="text-gray-900 font-medium">{game.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ジャンル</p>
              <p className="text-gray-900">{game.genre || '未設定'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">プラットフォーム</p>
              <p className="text-gray-900">{game.platform || '未設定'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ステータス</p>
              <p className="text-gray-900">{game.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">購入日</p>
              <p className="text-gray-900">{game.purchaseDate || '未設定'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">進捗メモ</p>
              <p className="text-gray-900 whitespace-pre-wrap">{game.progressNote || '未設定'}</p>
            </div>

            {/* プレイタイマー */}
            <PlayTimer
              gameId={game.id}
              totalPlayTime={game.totalPlayTime}
              activeSessionId={activeSessionId}
              activeSessionStartedAt={activeSessionStartedAt}
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmingDelete(true)}
                className="flex-1 py-3 rounded-lg border border-red-300 text-red-600 font-medium hover:bg-red-50 transition-colors"
              >
                削除
              </button>
              <button
                onClick={() => setEditing(true)}
                className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
              >
                編集
              </button>
            </div>
          </div>
        )}

        {/* 削除確認モーダル */}
        {confirmingDelete && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <p className="text-gray-900 mb-6">
                本当に削除しますか？この操作は取り消せません。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium transition-colors"
                >
                  {loading ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
