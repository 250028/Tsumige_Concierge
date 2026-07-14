import Link from 'next/link'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import ProfileForm from '@/components/ProfileForm'
import CountUp from '@/components/CountUp'

// ポイント数に応じたランク定義
const RANKS = [
  { minPoints: 500, label: 'レジェンドゲーマー', color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950',  border: 'border-amber-200 dark:border-amber-800',  icon: '👑' },
  { minPoints: 200, label: '積みゲーハンター',   color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-200 dark:border-purple-800', icon: '🏆' },
  { minPoints:  50, label: 'ゲーム消化人',       color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950',   border: 'border-blue-200 dark:border-blue-800',   icon: '🎮' },
  { minPoints:   0, label: '積みゲー見習い',     color: 'text-gray-600',   bg: 'bg-gray-50 dark:bg-gray-800',   border: 'border-gray-200 dark:border-gray-700',   icon: '📦' },
]

function getRank(points: number) {
  return RANKS.find(r => points >= r.minPoints)!
}

export default async function ProfilePage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const userId = session.userId!

  const [user, games, allAchievements, userAchievements] = await Promise.all([
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
    prisma.achievement.findMany({ orderBy: { id: 'asc' } }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, achievedAt: true },
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

  const rank = getRank(user.points)
  const earnedIds = new Map(userAchievements.map(ua => [ua.achievementId, ua.achievedAt]))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 pb-24">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-lg font-bold text-purple-600">プロフィール</h1>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-6">
        {/* 編集フォーム */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 p-6">
          <ProfileForm
            initialName={user.name}
            initialGamingSince={user.gamingSince}
            initialPersona={user.personaType}
            initialAvatarUrl={user.avatarUrl}
          />
        </div>

        {/* 統計カード */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 p-6">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">ゲーマー統計</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 dark:bg-purple-950 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-600"><CountUp value={total} /></p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">積みゲー総数</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-600"><CountUp value={cleared} /></p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">クリア済み</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600"><CountUp value={playing} /></p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">プレイ中</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-600"><CountUp value={clearRate} suffix="%" /></p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">消化率</p>
            </div>
          </div>
          {gamingYears && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
              ゲーマー歴 {gamingYears} 年のベテラン
            </p>
          )}
        </div>

        {/* ランクカード */}
        <div className={`${rank.bg} rounded-2xl border ${rank.border} p-5 flex items-center gap-4`}>
          <div className="text-4xl">{rank.icon}</div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">現在のランク</p>
            <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-amber-400 bg-clip-text text-transparent">{rank.label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">累計 <CountUp value={user.points} /> pt</p>
          </div>
          <div className="ml-auto text-right">
            {RANKS.find(r => r.minPoints > user.points) && (
              <>
                <p className="text-xs text-gray-400 dark:text-gray-500">次のランクまで</p>
                <p className={`text-sm font-bold ${rank.color}`}>
                  {(RANKS.find(r => r.minPoints > user.points)!.minPoints - user.points)} pt
                </p>
              </>
            )}
          </div>
        </div>

        {/* 実績バッジ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 p-6">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">実績</p>
          <div className="grid grid-cols-3 gap-3">
            {allAchievements.map(achievement => {
              const earnedAt = earnedIds.get(achievement.id)
              const isEarned = !!earnedAt
              return (
                <div
                  key={achievement.id}
                  className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md
                    ${isEarned
                      ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-50'
                    }`}
                >
                  <span className="text-2xl mb-1">{isEarned ? achievement.icon : '🔒'}</span>
                  <p className={`text-xs font-bold leading-tight ${isEarned ? 'text-amber-700 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isEarned ? achievement.name : '???'}
                  </p>
                  {isEarned && earnedAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(earnedAt).toLocaleDateString('ja-JP')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* アカウント情報（読み取り専用） */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">アカウント情報</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">ログインID</dt>
              <dd className="font-medium text-gray-800 dark:text-gray-100">{user.loginId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">登録日</dt>
              <dd className="font-medium text-gray-800 dark:text-gray-100">
                {user.createdAt.toLocaleDateString('ja-JP')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">累計ポイント</dt>
              <dd className="font-medium text-amber-600">{user.points} pt</dd>
            </div>
          </dl>
        </div>

        {/* 設定リンク（スマホのみ表示・PCはサイドバーに設定あり） */}
        <div className="md:hidden">
          <Link
            href="/settings"
            className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⚙️</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">設定</span>
            </div>
            <span className="text-gray-400 dark:text-gray-500 text-sm">›</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
