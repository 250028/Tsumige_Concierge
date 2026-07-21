'use client'

import { useState } from 'react'

type Props = {
  loginId: string
  email: string
  notificationEnabled: boolean
}

export default function SettingsForm({ loginId, email: initialEmail, notificationEnabled: initialNotif }: Props) {
  const [notif, setNotif] = useState(initialNotif)
  const [email, setEmail] = useState(initialEmail)
  const [savingEmail, setSavingEmail] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingNotif, setSavingNotif] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  function showMessage(text: string, error = false) {
    setMessage(text)
    setIsError(error)
    setTimeout(() => setMessage(''), 3000)
  }

  // 通知設定を即時保存（トグル操作）
  async function handleNotifToggle() {
    const next = !notif
    setNotif(next)
    setSavingNotif(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationEnabled: next }),
      })
    } catch {
      setNotif(!next) // 失敗したら元に戻す
      showMessage('通知設定の保存に失敗しました', true)
    } finally {
      setSavingNotif(false)
    }
  }

  // メールアドレス変更
  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    setSavingEmail(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        showMessage(data.error, true)
      } else {
        setEmail(data.email)
        showMessage('メールアドレスを変更しました')
      }
    } catch {
      showMessage('通信エラーが発生しました', true)
    } finally {
      setSavingEmail(false)
    }
  }

  // パスワード変更
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showMessage('新しいパスワードが一致しません', true)
      return
    }
    setSavingPw(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        showMessage(data.error, true)
      } else {
        showMessage('パスワードを変更しました')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      showMessage('通信エラーが発生しました', true)
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* メッセージ */}
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm text-center font-medium ${
          isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {message}
        </div>
      )}

      {/* アカウント情報（読み取り専用） */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">アカウント情報</p>
        <div className="text-sm">
          <p className="text-gray-500 dark:text-gray-400 mb-1">ログインID</p>
          <p className="font-medium text-gray-800 dark:text-gray-100">{loginId}</p>
        </div>
      </div>

      {/* メールアドレス変更 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">メールアドレス変更</p>
        <form onSubmit={handleEmailChange} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <button
            type="submit"
            disabled={savingEmail || email === initialEmail || !email.trim()}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {savingEmail ? '変更中…' : 'メールアドレスを変更する'}
          </button>
        </form>
      </div>

      {/* 通知設定 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">通知設定</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200">プッシュ通知</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">積みゲーに関するお知らせを受け取る</p>
          </div>
          <button
            onClick={handleNotifToggle}
            disabled={savingNotif}
            className={`relative w-12 h-6 shrink-0 rounded-full transition-colors duration-200 ${
              notif ? 'bg-purple-600' : 'bg-gray-300'
            } disabled:opacity-50`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
              notif ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* パスワード変更 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">パスワード変更</p>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">現在のパスワード</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">新しいパスワード（8文字以上）</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">新しいパスワード（確認）</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <button
            type="submit"
            disabled={savingPw || !currentPassword || !newPassword || !confirmPassword}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {savingPw ? '変更中…' : 'パスワードを変更する'}
          </button>
        </form>
      </div>
    </div>
  )
}
