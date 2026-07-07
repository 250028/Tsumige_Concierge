'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import ChatPanel from '@/components/ChatPanel'

const NAV_ITEMS = [
  { href: '/',        label: 'ホーム',       icon: '🏠', pcDrawer: false },
  { href: '/list',    label: 'リスト',       icon: '📋', pcDrawer: false },
  { href: '/chat',    label: 'チャット',     icon: '💬', pcDrawer: true  },
  { href: '/castle',  label: '城',           icon: '🏰', pcDrawer: false },
  { href: '/profile', label: 'プロフィール', icon: '👤', pcDrawer: false },
]

export default function AppNav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {/* スマホ用ボトムタブ（チャットは /chat ページへ遷移） */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-10">
        {NAV_ITEMS.map(item => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs ${
                active ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* PC用サイドバー */}
      <aside className="hidden md:flex md:flex-col md:w-[200px] md:shrink-0 border-r border-gray-200 bg-white min-h-screen">
        <div className="px-4 py-4 border-b border-gray-200">
          <p className="font-bold text-purple-600 text-sm">積みゲー・コンシェルジュ</p>
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
