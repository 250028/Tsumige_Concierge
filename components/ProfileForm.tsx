'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

type Persona = 'butler' | 'gamer' | 'fairy'

const PERSONA_LABELS: Record<Persona, string> = {
  butler: '🎩 執事',
  gamer: '🎮 ゲーマー仲間',
  fairy: '🧚 ゲームの妖精',
}

type Props = {
  initialName: string
  initialGamingSince: number | null
  initialPersona: Persona
  initialAvatarUrl: string | null
}

export default function ProfileForm({ initialName, initialGamingSince, initialPersona, initialAvatarUrl }: Props) {
  const [name, setName] = useState(initialName)
  const [gamingSince, setGamingSince] = useState(initialGamingSince?.toString() ?? '')
  const [persona, setPersona] = useState<Persona>(initialPersona)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // アバター画像をアップロードする
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const form = new FormData()
    form.append('avatar', file)

    try {
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
      const data = await res.json()
      if (data.avatarUrl) {
        setAvatarUrl(data.avatarUrl)
        setMessage('アバターを更新しました')
      } else {
        setMessage(data.error ?? 'アップロードに失敗しました')
      }
    } catch {
      setMessage('通信エラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  // プロフィール情報を保存する
  async function handleSave() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gamingSince: gamingSince ? Number(gamingSince) : null,
          personaType: persona,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('プロフィールを保存しました')
      } else {
        setMessage(data.error ?? '保存に失敗しました')
      }
    } catch {
      setMessage('通信エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* アバター */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative w-24 h-24 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-950 border-2 border-purple-300 dark:border-purple-700 hover:border-purple-500 transition-colors"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="アバター" fill className="object-cover" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-4xl">👤</span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
              アップロード中…
            </div>
          )}
        </button>
        <p className="text-xs text-gray-400 dark:text-gray-500">タップして画像を変更</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* ユーザー名 */}
      <div>
        <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">ユーザー名</label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={100}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>

      {/* ゲーマー歴（開始年） */}
      <div>
        <label htmlFor="profile-gaming-since" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">ゲームを始めた年</label>
        <input
          id="profile-gaming-since"
          type="number"
          value={gamingSince}
          onChange={e => setGamingSince(e.target.value)}
          min={1970}
          max={new Date().getFullYear()}
          placeholder="例: 2010"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        {gamingSince && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            ゲーマー歴 {new Date().getFullYear() - Number(gamingSince) + 1} 年
          </p>
        )}
      </div>

      {/* ペルソナ選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">AIコンシェルジュのペルソナ</label>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(PERSONA_LABELS) as Persona[]).map(p => (
            <button
              key={p}
              onClick={() => setPersona(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                persona === p
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900'
              }`}
            >
              {PERSONA_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
      >
        {saving ? '保存中…' : '保存する'}
      </button>

      {/* メッセージ */}
      {message && (
        <p className={`text-center text-sm ${message.includes('失敗') || message.includes('エラー') ? 'text-red-500' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
