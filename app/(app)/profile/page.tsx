import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import ProfileForm from '@/components/ProfileForm'

export default async function ProfilePage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const userId = session.userId!

  const [user, games] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        loginId: true,
        avatarUrl: true,
        personaType: true,
        gamingSince: true,
        points: true,
        createdAt: true,
      },
    }),
    prisma.game.findMany({
      where: { userId },
      select: { status: true },
    }),
  ])

  if (!user) return null

  const total    = games.length
  const cleared  = games.filter(g => g.status === 'クリア済み').length
  const playing  = games.filter(g => g.status === 'プレイ中').length
  const clearRate = total > 0 ? Math.round((cleared / total) * 100) : 0
  const gamingYears = user.gamingSince
    ? new Date().getFullYear() - user.gamingSince + 1
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-purple-600">プロフィール</h1>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-6">
        {/* 編集フォーム */}
        <div className="bg-white rounded-2xl border border-purple-100 p-6">
          <ProfileForm
            initialName={user.name}
            initialGamingSince={user.gamingSince}
            initialPersona={user.personaType}
            initialAvatarUrl={user.avatarUrl}
          />
        </div>

        {/* 統計カード */}
        <div className="bg-white rounded-2xl border border-purple-100 p-6">
          <p className="text-sm font-bold text-gray-700 mb-4">ゲーマー統計</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{total}</p>
              <p className="text-xs text-gray-500 mt-1">積みゲー総数</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{cleared}</p>
              <p className="text-xs text-gray-500 mt-1">クリア済み</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{playing}</p>
              <p className="text-xs text-gray-500 mt-1">プレイ中</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{clearRate}%</p>
              <p className="text-xs text-gray-500 mt-1">消化率</p>
            </div>
          </div>
          {gamingYears && (
            <p className="text-center text-xs text-gray-400 mt-4">
              ゲーマー歴 {gamingYears} 年のベテラン
            </p>
          )}
        </div>

        {/* アカウント情報（読み取り専用） */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm font-bold text-gray-700 mb-3">アカウント情報</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">ログインID</dt>
              <dd className="font-medium text-gray-800">{user.loginId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">登録日</dt>
              <dd className="font-medium text-gray-800">
                {user.createdAt.toLocaleDateString('ja-JP')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">累計ポイント</dt>
              <dd className="font-medium text-amber-600">{user.points} pt</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
