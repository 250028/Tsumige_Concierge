'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import ChatPanel from '@/components/ChatPanel'
import ListSheet from '@/components/sheets/ListSheet'
import CastleSheet from '@/components/sheets/CastleSheet'
import ProfileSheet from '@/components/sheets/ProfileSheet'

type SheetId = 'list' | 'chat' | 'castle' | 'profile'

const NAV_ITEMS: { href: string; label: string; icon: string; sheet: SheetId | null; pcDrawer: boolean }[] = [
  { href: '/',        label: 'ホーム',       icon: '🏠', sheet: null,      pcDrawer: false },
  { href: '/list',    label: 'リスト',       icon: '📋', sheet: 'list',    pcDrawer: false },
  { href: '/chat',    label: 'チャット',     icon: '💬', sheet: 'chat',    pcDrawer: true  },
  { href: '/castle',  label: '城',           icon: '🏰', sheet: 'castle',  pcDrawer: false },
  { href: '/profile', label: 'プロフィール', icon: '👤', sheet: 'profile', pcDrawer: false },
]

export default function AppNav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeSheet, setActiveSheet] = useState<SheetId | null>(null)

  function toggleSheet(sheet: SheetId) {
    setActiveSheet(prev => prev === sheet ? null : sheet)
  }

  return (
    <>
      {/* スマホ用ボトムタブ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-10">
        {NAV_ITEMS.map(item => {
          const active = activeSheet === item.sheet && item.sheet !== null
            || (item.sheet === null && (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)))

          // ホームだけページ遷移
          if (item.sheet === null) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setActiveSheet(null)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs ${
                  active ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          }

          // その他はボトムシートを開く
          return (
            <button
              key={item.href}
              onClick={() => toggleSheet(item.sheet!)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs ${
                active ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* ボトムシート：オーバーレイ */}
      {activeSheet && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-20"
          onClick={() => setActiveSheet(null)}
        />
      )}

      {/* ボトムシート：パネル本体 */}
      <div
        className={`md:hidden fixed bottom-0 inset-x-0 bg-white rounded-t-2xl z-30 flex flex-col transition-transform duration-300 ease-in-out ${
          activeSheet ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
        }`}
        style={{ height: '75vh', paddingBottom: '4rem' /* ボトムタブ分の余白 */ }}
      >
        {/* ドラッグハンドル */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        {/* 各シートのコンテンツ */}
        <div className="flex-1 overflow-hidden">
          {activeSheet === 'chat'    && <ChatPanel onClose={() => setActiveSheet(null)} />}
          {activeSheet === 'list'    && <ListSheet onClose={() => setActiveSheet(null)} />}
          {activeSheet === 'castle'  && <CastleSheet onClose={() => setActiveSheet(null)} />}
          {activeSheet === 'profile' && <ProfileSheet onClose={() => setActiveSheet(null)} />}
        </div>
      </div>

      {/* PC用サイドバー */}
      <aside className="hidden md:flex md:flex-col md:w-[200px] md:shrink-0 border-r border-gray-200 bg-white min-h-screen">
        <div className="px-4 py-4 border-b border-gray-200">
          <Link href="/" className="font-bold text-purple-600 text-sm hover:opacity-70 transition-opacity">
            積みゲー・コンシェルジュ
          </Link>
        </div>
        <nav className="flex flex-col p-2 gap-1 flex-1">
          {NAV_ITEMS.map(item => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

            // PC版チャットボタンはドロワーを開く
            if (item.pcDrawer) {
              return (
                <button
                  key={item.href}
                  onClick={() => setDrawerOpen(true)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left ${
                    drawerOpen ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  active ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        {/* 設定リンク（サイドバー下部） */}
        <div className="p-2 border-t border-gray-100">
          <Link
            href="/settings"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              pathname === '/settings' ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span>⚙️</span>
            設定
          </Link>
        </div>
      </aside>

      {/* PC用チャットドロワー（右からスライドイン） */}
      <>
        {/* オーバーレイ（ドロワー外クリックで閉じる） */}
        {drawerOpen && (
          <div
            className="hidden md:block fixed inset-0 z-40"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* ドロワー本体 */}
        <div
          className={`hidden md:flex flex-col fixed top-0 right-0 h-screen w-[300px] bg-white border-l border-gray-200 shadow-xl z-50 transition-transform duration-300 ease-in-out ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <ChatPanel onClose={() => setDrawerOpen(false)} />
        </div>
      </>
    </>
  )
}
