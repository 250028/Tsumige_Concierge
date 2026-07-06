import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import AppNav from '@/components/AppNav'
import LogoutButton from '@/components/LogoutButton'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  return (
    <div className="md:flex">
      <AppNav />

      <div className="flex-1 min-w-0">
        {/* 共通ヘッダー */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">{session.userName} さん</span>
          <LogoutButton />
        </header>

        {/* スマホはボトムタブの高さ分だけ下に余白を確保 */}
        <main className="pb-16 md:pb-0">{children}</main>
      </div>
    </div>
  )
}
