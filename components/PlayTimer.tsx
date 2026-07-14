'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  gameId: number
  totalPlayTime: number           // DBに保存済みの累計プレイ時間（分）
  activeSessionId: number | null  // 進行中セッションのID（なければnull）
  activeSessionStartedAt: string | null  // 進行中セッションの開始日時（ISO文字列）
}

// 分 → "X時間Y分" or "Y分" の文字列に変換
function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分`
  return `${Math.floor(minutes / 60)}時間${minutes % 60}分`
}

// 秒 → "HH:MM:SS" の文字列に変換
function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

export default function PlayTimer({ gameId, totalPlayTime, activeSessionId, activeSessionStartedAt }: Props) {
  const router = useRouter()

  // 現在進行中のセッション情報
  const [sessionId, setSessionId] = useState<number | null>(activeSessionId)
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(
    activeSessionStartedAt ? new Date(activeSessionStartedAt) : null
  )

  // 現在のセッション経過秒数
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [loading, setLoading] = useState(false)
  const [memo, setMemo] = useState('')
  const [toast, setToast] = useState('')

  // タイマーの進行管理
  // effectボディ内での同期的setStateはカスケードレンダーを引き起こすため、
  // setIntervalのコールバック内でsessionStartedAtから都度計算する
  useEffect(() => {
    if (!sessionStartedAt) return

    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartedAt.getTime()) / 1000))
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [sessionStartedAt])

  // プレイ開始
  async function handleStart() {
    setLoading(true)
    try {
      const res = await fetch('/api/play-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      })
      const data = await res.json()
      if (data.id) {
        setSessionId(data.id)
        setSessionStartedAt(new Date(data.startedAt))
      }

      // プレイ開始をきっかけに実績が解除されたらトースト表示
      const achievements: string[] = data.newAchievements ?? []
      if (achievements.length > 0) {
        setToast(`🎉 実績解除：${achievements.join('・')}`)
        setTimeout(() => setToast(''), 5000)
      }
    } catch {
      alert('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // プレイ停止（メモも一緒に保存）
  async function handleStop() {
    if (!sessionId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/play-session/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressNote: memo || undefined }),
      })
      if (res.ok) {
        setSessionId(null)
        setSessionStartedAt(null)
        setMemo('')
        router.refresh() // 累計プレイ時間をサーバーから再取得
      }
    } catch {
      alert('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const isRunning = sessionId !== null
  // 今のセッション分も含めた累計（停止後はサーバーから再取得されるので elapsed は0になる）
  const currentSessionMinutes = Math.floor(elapsed / 60)
  const displayTotal = totalPlayTime + currentSessionMinutes

  return (
    <div className="border border-purple-100 dark:border-purple-800 rounded-xl p-4 bg-purple-50 dark:bg-purple-950 space-y-3">
      {/* 実績解除トースト */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white px-6 py-3 rounded-full shadow-lg text-sm font-bold animate-bounce">
          {toast}
        </div>
      )}

      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">プレイタイマー</p>

      {/* 累計プレイ時間 */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">累計プレイ時間</p>
        <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
          {displayTotal > 0 ? formatMinutes(displayTotal) : '未記録'}
        </p>
      </div>

      {/* 現在のセッション計測 */}
      {isRunning && (
        <div className="text-center bg-white dark:bg-gray-800 rounded-lg py-3 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">プレイ中</p>
          <p className="text-3xl font-mono font-bold text-purple-600">
            {formatSeconds(elapsed)}
          </p>
        </div>
      )}

      {/* プレイ中：メモ入力 + 停止ボタン */}
      {isRunning ? (
        <div className="space-y-2">
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="今日の進捗メモ（任意）"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <button
            onClick={handleStop}
            disabled={loading}
            className="w-full py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? '停止中…' : '⏹ プレイを停止'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? '起動中…' : '▶ プレイ開始'}
        </button>
      )}
    </div>
  )
}
