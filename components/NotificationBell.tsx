'use client'

import { useEffect, useRef, useState } from 'react'

type NotificationType = 'neglected' | 'streakWarning' | 'achievement' | 'points'

type Notification = {
  id: number
  type: NotificationType
  message: string
  gameId: number | null
  isRead: boolean
  createdAt: string
}

const TYPE_ICONS: Record<NotificationType, string> = {
  neglected: '📦',
  streakWarning: '🔥',
  achievement: '🏆',
  points: '🎉',
}

// 通知日時を「〇分前」のような相対表示に変換する
function formatRelativeTime(dateStr: string): string {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}時間前`
  return `${Math.floor(diffHour / 24)}日前`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // ドロップダウンの外側をクリックしたら閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleMarkRead(id: number) {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)))
    setUnreadCount(prev => Math.max(0, prev - 1))
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
  }

  async function handleMarkAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    await fetch('/api/notifications', { method: 'PATCH' })
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="通知"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-80 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">通知</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-purple-600 hover:underline">
                すべて既読にする
              </button>
            )}
          </div>

          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">読み込み中…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">通知はありません</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map(n => (
                <li
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  className={`px-4 py-3 text-sm flex gap-2 cursor-pointer transition-colors ${
                    n.isRead
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-gray-800 dark:text-gray-100 bg-purple-50/50 dark:bg-purple-950/30'
                  }`}
                >
                  <span className="text-base leading-none">{TYPE_ICONS[n.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="leading-snug">{n.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
