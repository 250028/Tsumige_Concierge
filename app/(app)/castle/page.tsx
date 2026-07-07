import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

// 消化率に応じた城ステージの定義
const CASTLE_STAGES = [
  {
    minRate: 80,
    emoji: '🏰',
    name: '黄金の大城',
    desc: '見事！積みゲーをほぼ制覇した伝説のゲーマー城。',
    bg: 'from-amber-50 to-yellow-100',
    border: 'border-amber-300',
    color: 'text-amber-700',
  },
  {
    minRate: 50,
    emoji: '🏯',
    name: '立派な城',
    desc: '順調に消化が進んでいる。この調子でクリアを積み上げよう！',
    bg: 'from-purple-50 to-indigo-100',
    border: 'border-purple-300',
    color: 'text-purple-700',
  },
  {
    minRate: 20,
    emoji: '🛖',
    name: 'ぼろい小屋',
    desc: 'まだ小さいが、確実に成長中。クリアを増やして城を大きくしよう。',
    bg: 'from-green-50 to-emerald-100',
    border: 'border-green-300',
    color: 'text-green-700',
  },
  {
    minRate: 0,
    emoji: '🏚️',
    name: '積みゲーの廃墟',
    desc: '積みゲーが山積みで廃墟状態…。まず1本クリアすることから始めよう！',
    bg: 'from-gray-50 to-stone-100',
    border: 'border-gray-300',
    color: 'text-gray-600',
  },
]

function getCastleStage(clearRate: number) {
  return CASTLE_STAGES.find(s => clearRate >= s.minRate)!
}

export default async function CastlePage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const userId = session.userId!

  const games = await prisma.game.findMany({
    where: { userId },
    select: { status: true, clearedAt: true },
  })

  const total    = games.length
  const cleared  = games.filter(g => g.status === 'クリア済み').length
  const playing  = games.filter(g => g.status === 'プレイ中').length
  const stacked  = total - cleared
  const clearRate = total > 0 ? Math.round((cleared / total) * 100) : 0

  // 今月クリアしたゲーム数
  const now = new Date()
  const clearedThisMonth = games.filter(g => {
    if (!g.clearedAt) return false
    return g.clearedAt.getFullYear() === now.getFullYear() && g.clearedAt.getMonth() === now.getMonth()
  }).length

  const stage = getCastleStage(clearRate)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-purple-600">積みゲー城</h1>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-6">
        {/* 城メインカード */}
        <div className={`bg-gradient-to-br ${stage.bg} rounded-2xl border ${stage.border} p-8 text-center`}>
          <div className="text-8xl mb-4">{stage.emoji}</div>
          <p className={`text-xl font-bold ${stage.color} mb-2`}>{stage.name}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{stage.desc}</p>
        </div>

        {/* 消化率プログレスバー */}
        <div className="bg-white rounded-2xl border border-purple-100 p-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold text-gray-700">消化率</p>
            <p className="text-2xl font-bold text-purple-600">{clearRate}%</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-700"
              style={{ width: `${clearRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>0%（廃墟）</span>
            <span>100%（黄金の大城）</span>
          </div>

          {/* 次のステージまでのメッセージ（一番近い次のステージを表示） */}
          {clearRate < 80 && total > 0 && (() => {
            // minRate が現在の消化率より大きいステージのうち、最小のものを選ぶ
            const next = [...CASTLE_STAGES]
              .filter(s => s.minRate > clearRate)
              .sort((a, b) => a.minRate - b.minRate)[0]
            if (!next) return null
            const needed = Math.ceil((next.minRate / 100) * total) - cleared
            return (
              <p className="mt-3 text-xs text-center text-gray-500">
                あと <span className="font-bold text-purple-600">{needed}本</span> クリアすると「{next.name}」に進化！
              </p>
            )
          })()}
        </div>

        {/* 統計グリッド */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">{stacked}</p>
            <p className="text-xs text-gray-500 mt-1">積みゲー残数</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-amber-500">{cleared}</p>
            <p className="text-xs text-gray-500 mt-1">総クリア数</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-purple-500">{playing}</p>
            <p className="text-xs text-gray-500 mt-1">プレイ中</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{clearedThisMonth}</p>
            <p className="text-xs text-gray-500 mt-1">今月のクリア</p>
          </div>
        </div>

        {/* ゲームが0本のとき */}
        {total === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
            積みゲーを登録すると、城が育ち始めます
          </div>
        )}
      </div>
    </div>
  )
}
