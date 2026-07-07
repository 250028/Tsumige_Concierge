import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import prisma from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const userId = session.userId!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loginId: true, name: true, notificationEnabled: true },
  })

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-purple-600">設定</h1>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-6">
        <SettingsForm
          loginId={user.loginId}
          notificationEnabled={user.notificationEnabled}
        />
      </div>
    </div>
  )
}
