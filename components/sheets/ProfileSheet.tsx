'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Profile = {
  name: string
  avatarUrl: string | null
  points: number
  gamingSince: number | null
}

type Props = { onClose: () => void }

export default function ProfileSheet({ onClose }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const gamingYears = profile?.gamingSince
    ? new Date().getFullYear() - profile.gamingSince
    : null

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="font-bold text-gray-700 text-sm">👤 プロフィール</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-gray-400 text-sm pt-10">読み込み中…</p>
        ) : !profile ? (
          <p className="text-center text-gray-400 text-sm pt-10">プロフィールを取得できませんでした</p>
        ) : (
          <>
            {/* アバターと名前 */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-purple-100 mx-auto mb-3 overflow-hidden flex items-center justify-center">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>
              <p className="text-lg font-bold text-gray-800">{profile.name}</p>
              {gamingYears !== null && (
                <p className="text-xs text-gray-400 mt-0.5">ゲーマー歴 {gamingYears} 年</p>
              )}
            </div>

            {/* ポイント */}
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-500">{profile.points.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">累計ポイント</p>
            </div>
          </>
        )}
      </div>

      <div className="p-3 border-t border-gray-100">
        <Link
          href="/profile"
          onClick={onClose}
          className="block w-full text-center py-2 rounded-xl bg-purple-50 text-purple-600 text-sm font-semibold hover:bg-purple-100"
        >
          プロフィールを編集 →
        </Link>
      </div>
    </div>
  )
}
