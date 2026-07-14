'use client'

import { useState } from 'react'
import Link from 'next/link'

type Game = {
  id: number
  title: string
  platform: string | null
  genre: string | null
  status: string
  clearedAt: string | null
}

type Stage = {
  minRate: number
  emoji: string
  name: string
  desc: string
  bg: string
  border: string
  color: string
}

type ModalKey = 'stacked' | 'cleared' | 'playing' | 'clearedThisMonth' | null

type Props = {
  games: Game[]
  stage: Stage
  castleStages: Stage[]
  clearRate: number
  stacked: number
  cleared: number
  playing: number
  clearedThisMonth: number
  nextStageName: string | null
  neededToNext: number
  total: number
}

const MODAL_CONFIG: Record<
  Exclude<ModalKey, null>,
  { title: string; filter: (g: Game) => boolean }
> = {
  stacked: {
    title: '積みゲー残数',
    filter: g => g.status !== 'クリア済み',
  },
  cleared: {
    title: '総クリア数',
    filter: g => g.status === 'クリア済み',
  },
  playing: {
    title: 'プレイ中',
    filter: g => g.status === 'プレイ中',
  },
  clearedThisMonth: {
    title: '今月のクリア',
    filter: g => {
      if (!g.clearedAt) return false
      const d = new Date(g.clearedAt)
      const now = new Date()
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    },
  },
}

export default function CastleClient({
  games, stage, castleStages, clearRate,
  stacked, cleared, playing, clearedThisMonth,
  nextStageName, neededToNext, total,
}: Props) {
  const [modal, setModal] = useState<ModalKey>(null)

  const modalGames = modal ? games.filter(MODAL_CONFIG[modal].filter) : []
  const modalTitle = modal ? MODAL_CONFIG[modal].title : ''

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto space-y-6">
      {/* 城メインカード */}
      <div className={`bg-gradient-to-br ${stage.bg} rounded-2xl border ${stage.border} p-8 text-center`}>
        <div className="text-8xl mb-4">{stage.emoji}</div>
        <p className="text-xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-amber-400 bg-clip-text text-transparent">{stage.name}</p>
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
        {nextStageName && total > 0 && (
          <p className="mt-3 text-xs text-center text-gray-500">
            あと <span className="font-bold text-purple-600">{neededToNext}本</span> クリアすると「{nextStageName}」に進化！
          </p>
        )}
      </div>

      {/* 統計グリッド（タップでモーダル） */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'stacked' as ModalKey,          count: stacked,          label: '積みゲー残数',   color: 'text-gray-800' },
          { key: 'cleared' as ModalKey,           count: cleared,          label: '総クリア数',     color: 'text-amber-500' },
          { key: 'playing' as ModalKey,           count: playing,          label: 'プレイ中',       color: 'text-purple-500' },
          { key: 'clearedThisMonth' as ModalKey,  count: clearedThisMonth, label: '今月のクリア',   color: 'text-green-500' },
        ].map(({ key, count, label, color }) => (
          <button
            key={key}
            onClick={() => setModal(key)}
            className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:border-purple-300 hover:bg-purple-50 hover:-translate-y-1 hover:shadow-md transition-all duration-200 active:scale-95"
          >
            <p className={`text-3xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
            <p className="text-xs text-gray-300 mt-1">タップで一覧 ›</p>
          </button>
        ))}
      </div>

      {/* ステージロードマップ（4段階を横並びで表示） */}
      <div className="bg-white rounded-2xl border border-purple-100 p-5">
        <p className="text-sm font-bold text-gray-700 mb-4">城の成長段階</p>
        <div className="flex items-center justify-between gap-1">
          {[...castleStages].reverse().map((s, i, arr) => {
            const isCurrent = s.name === stage.name
            const isPast    = stage.minRate > s.minRate
            return (
              <div key={s.name} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all
                    ${isCurrent ? 'ring-4 ring-purple-400 bg-purple-50 scale-110' : isPast ? 'bg-amber-50' : 'bg-gray-100 opacity-40'}`}>
                    {s.emoji}
                  </div>
                  <p className={`text-xs mt-1 text-center leading-tight truncate w-full
                    ${isCurrent ? 'text-purple-600 font-bold' : isPast ? 'text-amber-600' : 'text-gray-400'}`}>
                    {s.name}
                  </p>
                  <p className="text-xs text-gray-300">{s.minRate}%〜</p>
                </div>
                {i < arr.length - 1 && (
                  <div className={`h-0.5 w-4 shrink-0 mx-1 rounded-full
                    ${isPast ? 'bg-amber-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {total === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
          積みゲーを登録すると、城が育ち始めます
        </div>
      )}

      {/* モーダル */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl w-full max-w-lg max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/40">
              <p className="font-bold text-gray-800">{modalTitle}（{modalGames.length}本）</p>
              <button
                onClick={() => setModal(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* ゲーム一覧 */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {modalGames.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">該当するゲームがありません</p>
              ) : (
                modalGames.map(game => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    onClick={() => setModal(null)}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 hover:bg-purple-50 transition-colors"
                  >
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                      {game.title.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{game.title}</p>
                      <p className="text-xs text-gray-400">{game.genre ?? '未設定'} ・ {game.platform ?? '未設定'}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">{game.status}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
