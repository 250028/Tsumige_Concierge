import prisma from '@/lib/prisma'

// 実績ごとの達成判定ロジック
const ACHIEVEMENT_CHECKS: {
  key: string
  check: (userId: number) => Promise<boolean>
}[] = [
  {
    key: 'first_clear',
    check: async (userId) => {
      const count = await prisma.game.count({ where: { userId, status: 'クリア済み' } })
      return count >= 1
    },
  },
  {
    key: 'five_clears',
    check: async (userId) => {
      const count = await prisma.game.count({ where: { userId, status: 'クリア済み' } })
      return count >= 5
    },
  },
  {
    key: 'ten_clears',
    check: async (userId) => {
      const count = await prisma.game.count({ where: { userId, status: 'クリア済み' } })
      return count >= 10
    },
  },
  {
    key: 'castle_king',
    check: async (userId) => {
      const total = await prisma.game.count({ where: { userId } })
      if (total === 0) return false
      const cleared = await prisma.game.count({ where: { userId, status: 'クリア済み' } })
      return Math.round((cleared / total) * 100) >= 80
    },
  },
  {
    key: 'all_clear',
    check: async (userId) => {
      const total = await prisma.game.count({ where: { userId } })
      if (total === 0) return false
      const cleared = await prisma.game.count({ where: { userId, status: 'クリア済み' } })
      return total > 0 && total === cleared
    },
  },
]

/**
 * ユーザーの実績達成状況をチェックし、新たに解除された実績を付与する
 * 返り値: 新しく取得した実績名の配列（例: ['⚔️ 初クリア', '📚 5本クリア']）
 */
export async function checkAndGrantAchievements(userId: number): Promise<string[]> {
  // 取得済みの実績キーを取得
  const earned = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: { select: { conditionKey: true } } },
  })
  const earnedKeys = new Set(earned.map(e => e.achievement.conditionKey))

  // 実績マスター全件取得
  const allAchievements = await prisma.achievement.findMany()
  const achievementMap = new Map(allAchievements.map(a => [a.conditionKey, a]))

  const newlyGranted: string[] = []

  for (const { key, check } of ACHIEVEMENT_CHECKS) {
    if (earnedKeys.has(key)) continue

    const achievement = achievementMap.get(key)
    if (!achievement) continue

    const qualified = await check(userId)
    if (qualified) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      })
      newlyGranted.push(`${achievement.icon} ${achievement.name}`)
    }
  }

  return newlyGranted
}
