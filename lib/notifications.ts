import prisma from '@/lib/prisma'

const NEGLECTED_DAYS = 7 // この日数以上プレイが無いと「長期未プレイ」とみなす

// JST（日本時間）基準の日付文字列（YYYY-MM-DD）を取得する
function toJstDateString(date: Date): string {
  return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
}

// 日付文字列に日数を加算する（タイムゾーンに依存しないUTC計算）
function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// 長期未プレイの積みゲームをリマインドする通知を生成する
async function generateNeglectedNotifications(userId: number) {
  const threshold = new Date(Date.now() - NEGLECTED_DAYS * 24 * 60 * 60 * 1000)

  const candidates = await prisma.game.findMany({
    where: {
      userId,
      status: { not: 'クリア済み' },
      OR: [
        { lastPlayedAt: { lt: threshold } },
        { lastPlayedAt: null, createdAt: { lt: threshold } },
      ],
    },
    select: { id: true, title: true },
  })

  for (const game of candidates) {
    // 直近7日以内に同じゲームへのリマインドを送っていれば重複作成しない
    const recent = await prisma.notification.findFirst({
      where: { userId, gameId: game.id, type: 'neglected', createdAt: { gte: threshold } },
    })
    if (recent) continue

    await prisma.notification.create({
      data: {
        userId,
        gameId: game.id,
        type: 'neglected',
        message: `「${game.title}」をしばらくプレイしていません。そろそろ再開してみませんか？`,
      },
    })
  }
}

// 連続プレイ記録が今日途切れそうな場合に通知を生成する（1日1件まで）
async function generateStreakWarningNotification(userId: number) {
  const todayStr = toJstDateString(new Date())

  // 今日すでに同じ種類の通知を送っていれば作らない
  const latest = await prisma.notification.findFirst({
    where: { userId, type: 'streakWarning' },
    orderBy: { createdAt: 'desc' },
  })
  if (latest && toJstDateString(latest.createdAt) === todayStr) return

  const sessions = await prisma.playSession.findMany({
    where: { userId },
    select: { startedAt: true },
  })
  const days = new Set(sessions.map(s => toJstDateString(s.startedAt)))

  if (days.has(todayStr)) return // 今日すでにプレイ済みなら警告不要

  // 昨日から遡って連続プレイ日数を数える
  let streak = 0
  let cursor = addDays(todayStr, -1)
  while (days.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }

  if (streak >= 2) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'streakWarning',
        message: `連続${streak}日のプレイ記録が今日途切れそうです！今日もプレイして記録を伸ばしましょう`,
      },
    })
  }
}

// 通知一覧を取得する前に、自動生成系の通知（長期未プレイ・連続記録警告）をチェックする
export async function generateAutoNotifications(userId: number) {
  await generateNeglectedNotifications(userId)
  await generateStreakWarningNotification(userId)
}

// 実績解除時に通知を作成する
export async function notifyAchievements(userId: number, achievementLabels: string[]) {
  for (const label of achievementLabels) {
    await prisma.notification.create({
      data: { userId, type: 'achievement', message: `実績「${label}」を解除しました！` },
    })
  }
}

// ポイント獲得時に通知を作成する
export async function notifyPoints(userId: number, gameId: number, gameTitle: string, points: number) {
  await prisma.notification.create({
    data: {
      userId,
      gameId,
      type: 'points',
      message: `「${gameTitle}」クリアで${points}ポイント獲得しました！`,
    },
  })
}
