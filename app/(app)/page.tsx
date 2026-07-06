import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import LogoutButton from '@/components/LogoutButton'

export default async function Home() {
  // サーバーコンポーネントでセッションからユーザー情報を取得
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-purple-600">
          積みゲー・コンシェルジュ
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {session.userName} さん
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* メインコンテンツ（仮） */}
      <main className="p-8 text-center text-gray-400">
        ホーム画面（準備中）
      </main>
    </div>
  )
}
