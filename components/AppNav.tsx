'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/',        label: 'ホーム',       icon: '🏠' },
  { href: '/list',     label: 'リスト',       icon: '📋' },
  { href: '/chat',     label: 'チャット',     icon: '💬' },
  { href: '/castle',   label: '城',           icon: '🏰' },
  { href: '/profile',  label: 'プロフィール', icon: '👤' },
]

export default function AppNav() {
  const pathname = usePathname()

  return (
    <>
      {/* スマホ用ボトムタブ */}
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
    </>
  )
}
