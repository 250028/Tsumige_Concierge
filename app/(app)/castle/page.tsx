import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import CastleClient from '@/components/CastleClient'

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
    select: { id: true, title: true, platform: true, genre: true, status: true, clearedAt: true },
  })

  const total    = games.length
  const cleared  = games.filter(g => g.status === 'クリア済み').length
  const playing  = games.filter(g => g.status === 'プレイ中').length
  const stacked  = total - cleared
  const clearRate = total > 0 ? Math.round((cleared / total) * 100) : 0

  const now = new Date()
  const clearedThisMonth = games.filter(g => {
    if (!g.clearedAt) return false
    return g.clearedAt.getFullYear() === now.getFullYear() && g.clearedAt.getMonth() === now.getMonth()
  }).length

  // 次のステージまでに必要なクリア数
  const stage = getCastleStage(clearRate)
  const nextStage = clearRate < 80 ? [...CASTLE_STAGES]
    .filter(s => s.minRate > clearRate)
    .sort((a, b) => a.minRate - b.minRate)[0] : null
  const neededToNext = nextStage ? Math.ceil((nextStage.minRate / 100) * total) - cleared : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-purple-600">積みゲー城</h1>
      </header>
      <CastleClient
        games={games.map(g => ({
          ...g,
          clearedAt: g.clearedAt?.toISOString() ?? null,
        }))}
        stage={stage}
        clearRate={clearRate}
        stacked={stacked}
        cleared={cleared}
        playing={playing}
        clearedThisMonth={clearedThisMonth}
        nextStageName={nextStage?.name ?? null}
        neededToNext={neededToNext}
        total={total}
        castleStages={CASTLE_STAGES}
      />
    </div>
  )
}
