'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { RawgGame } from '@/lib/rawg'

const PLATFORMS = ['Switch', 'PS5', 'PS4', 'Xbox', 'PC', 'その他']
const STATUSES = ['未開封', '序盤で放置', '中断中', 'プレイ中', 'クリア済み'] as const

export default function NewGamePage() {
  const router = useRouter()
  const [title, setTitle]               = useState('')
  const [genre, setGenre]               = useState('')
  const [platform, setPlatform]         = useState(PLATFORMS[0])
  const [status, setStatus]             = useState<(typeof STATUSES)[number]>('未開封')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [progressNote, setProgressNote] = useState('')
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  // RAWG検索用state
  const [searchResults, setSearchResults] = useState<RawgGame[]>([])
  const [searching, setSearching]         = useState(false)
  const [expanded, setExpanded]           = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [rawgId, setRawgId]               = useState<number | null>(null)

  // 手動アップロード用state
  const [uploading, setUploading] = useState(false)

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('cover', file)
      const res = await fetch('/api/uploads/cover', { method: 'POST', body: form })
      const data = await res.json()
      if (data.coverImageUrl) {
        setCoverImageUrl(data.coverImageUrl)
        setRawgId(null)
      }
    } catch {
      setError('画像のアップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  // RAWGでタイトル検索
  async function handleSearch() {
    if (!title.trim()) return
    setSearching(true)
    setSearchResults([])
    setExpanded(false)
    try {
      const res = await fetch(`/api/rawg/search?q=${encodeURIComponent(title)}`)
      const data = await res.json()
      setSearchResults(data.games ?? [])
    } catch {
      setError('ゲームの検索に失敗しました')
    } finally {
      setSearching(false)
    }
  }

  // 「他の候補を見る」で最大20件まで再検索
  async function handleShowMore() {
    setSearching(true)
    try {
      const res = await fetch(`/api/rawg/search?q=${encodeURIComponent(title)}&limit=20`)
      const data = await res.json()
      setSearchResults(data.games ?? [])
      setExpanded(true)
    } catch {
      setError('ゲームの検索に失敗しました')
    } finally {
      setSearching(false)
    }
  }

  // 候補を選択したらフォームに自動入力
  function handleSelectGame(game: RawgGame) {
    setTitle(game.title)
    setGenre(game.genre ?? '')
    setCoverImageUrl(game.coverImageUrl)
    setRawgId(game.rawgId)
    setSearchResults([])
  }

  // 登録処理
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/games', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title, genre, platform, status, purchaseDate, progressNote, coverImageUrl, rawgId }),
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
    <div className="min-h-screen bg-white dark:bg-gray-900 dark:text-gray-100">
      {/* ヘッダー */}
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          ← 一つ前に戻る
        </button>
        <h1 className="text-base font-bold text-purple-600">ゲーム登録</h1>
      </header>

      <div className="w-full max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* タイトル + RAWGで検索 */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); setSearchResults([]); setCoverImageUrl(null); setRawgId(null) }}
                placeholder="ゼルダの伝説"
                required
                className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !title.trim()}
                className="px-3 py-2 rounded-lg bg-purple-100 text-purple-600 text-sm font-medium hover:bg-purple-200 disabled:opacity-40 transition-colors shrink-0"
              >
                {searching ? '検索中…' : '🔍 検索'}
              </button>
            </div>

            {/* 検索結果ドロップダウン */}
            {searchResults.length > 0 && (
              <ul className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-md">
                {searchResults.map(game => (
                  <li key={game.rawgId}>
                    <button
                      type="button"
                      onClick={() => handleSelectGame(game)}
                      className="w-full flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors text-left"
                    >
                      {game.coverImageUrl ? (
                        <Image
                          src={game.coverImageUrl}
                          alt={game.title}
                          width={48}
                          height={28}
                          className="rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-7 rounded bg-gray-200 dark:bg-gray-700 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{game.title}</p>
                        {game.genre && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{game.genre}</p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
                {!expanded && searchResults.length >= 5 && (
                  <li>
                    <button
                      type="button"
                      onClick={handleShowMore}
                      disabled={searching}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-xs text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 disabled:opacity-40 transition-colors text-center"
                    >
                      {searching ? '検索中…' : '他の候補を見る'}
                    </button>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    onClick={() => { setSearchResults([]); setExpanded(false) }}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
                  >
                    候補を閉じる
                  </button>
                </li>
              </ul>
            )}
            {expanded && searchResults.length >= 20 && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                候補が多いため一部のみ表示しています。タイトルをもっと絞り込んでください。
              </p>
            )}

            {/* 選択済みカバー画像プレビュー */}
            {coverImageUrl && searchResults.length === 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-purple-600">
                <Image
                  src={coverImageUrl}
                  alt="カバー画像"
                  width={64}
                  height={36}
                  className="rounded object-cover"
                />
                <span>✅ カバー画像が設定されました</span>
              </div>
            )}

            {/* 手動アップロード */}
            <div className="mt-2">
              <label className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-purple-600 transition-colors">
                <span>{uploading ? 'アップロード中…' : '📁 画像を自分でアップロード'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleCoverUpload}
                />
              </label>
            </div>
          </div>

          {/* ジャンル */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">ジャンル</label>
            <input
              type="text"
              value={genre}
              onChange={e => setGenre(e.target.value)}
              placeholder="アクションRPG"
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* プラットフォーム */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">プラットフォーム</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-purple-500"
            >
              {PLATFORMS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* ステータス */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">ステータス</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as (typeof STATUSES)[number])}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-purple-500"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 購入日 */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">購入日</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* 進捗メモ */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">進捗メモ</label>
            <textarea
              value={progressNote}
              onChange={e => setProgressNote(e.target.value)}
              placeholder="第3の祠まで終了"
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-purple-500"
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
