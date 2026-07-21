import { checkAndGrantAchievements } from '@/lib/achievements'
import prisma from '@/lib/prisma'

// lib/prisma をモック化し、実際のDBに接続せずロジックだけをテストする
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    game: { count: jest.fn() },
    playSession: { findMany: jest.fn() },
    userAchievement: { findMany: jest.fn(), create: jest.fn() },
    achievement: { findMany: jest.fn() },
  },
}))

const mockedPrisma = prisma as unknown as {
  game: { count: jest.Mock }
  playSession: { findMany: jest.Mock }
  userAchievement: { findMany: jest.Mock; create: jest.Mock }
  achievement: { findMany: jest.Mock }
}

// achievements テーブルのマスターデータを模したモック
const ACHIEVEMENT_MASTER = [
  { id: 1, name: '初クリア', icon: '⚔️', conditionKey: 'first_clear' },
  { id: 2, name: '5本クリア', icon: '📚', conditionKey: 'five_clears' },
  { id: 3, name: '10本クリア', icon: '🎯', conditionKey: 'ten_clears' },
  { id: 4, name: '連続3日', icon: '🔥', conditionKey: 'streak_3days' },
  { id: 5, name: '積みゲー城王', icon: '👑', conditionKey: 'castle_king' },
  { id: 6, name: 'コンプリート', icon: '🏆', conditionKey: 'all_clear' },
]

// game.count は「status: クリア済み」を含むクエリはクリア数、含まないクエリは総数として振る舞う
function mockGameCounts(clearedCount: number, totalCount: number) {
  mockedPrisma.game.count.mockImplementation(({ where }: { where: { status?: string } }) => {
    return Promise.resolve(where.status === 'クリア済み' ? clearedCount : totalCount)
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockedPrisma.achievement.findMany.mockResolvedValue(ACHIEVEMENT_MASTER)
})

describe('checkAndGrantAchievements', () => {
  it('初クリアで「初クリア」だけが新規付与される', async () => {
    mockedPrisma.userAchievement.findMany.mockResolvedValue([])
    mockGameCounts(1, 5) // クリア1本・総数5本（他の実績条件は満たさない数）
    mockedPrisma.playSession.findMany.mockResolvedValue([])

    const result = await checkAndGrantAchievements(1)

    expect(result).toEqual(['⚔️ 初クリア'])
    expect(mockedPrisma.userAchievement.create).toHaveBeenCalledTimes(1)
    expect(mockedPrisma.userAchievement.create).toHaveBeenCalledWith({
      data: { userId: 1, achievementId: 1 },
    })
  })

  it('既に取得済みの実績は再判定されず、重複付与されない', async () => {
    mockedPrisma.userAchievement.findMany.mockResolvedValue([
      { achievement: { conditionKey: 'first_clear' } },
    ])
    mockGameCounts(1, 5)
    mockedPrisma.playSession.findMany.mockResolvedValue([])

    const result = await checkAndGrantAchievements(1)

    expect(result).toEqual([])
    expect(mockedPrisma.userAchievement.create).not.toHaveBeenCalled()
  })

  it('連続3日プレイで「連続3日」が新規付与される', async () => {
    mockedPrisma.userAchievement.findMany.mockResolvedValue([])
    mockGameCounts(0, 0) // ゲーム自体が0件なので他の実績条件はすべて成立しない

    // JST基準で連続した3日分のプレイセッション
    mockedPrisma.playSession.findMany.mockResolvedValue([
      { startedAt: new Date('2026-07-19T10:00:00+09:00') },
      { startedAt: new Date('2026-07-20T10:00:00+09:00') },
      { startedAt: new Date('2026-07-21T10:00:00+09:00') },
    ])

    const result = await checkAndGrantAchievements(1)

    expect(result).toEqual(['🔥 連続3日'])
  })

  it('条件を満たす実績が無ければ何も付与されない', async () => {
    mockedPrisma.userAchievement.findMany.mockResolvedValue([])
    mockGameCounts(0, 0)
    mockedPrisma.playSession.findMany.mockResolvedValue([])

    const result = await checkAndGrantAchievements(1)

    expect(result).toEqual([])
    expect(mockedPrisma.userAchievement.create).not.toHaveBeenCalled()
  })

  it('5本・10本クリアで「5本クリア」と「10本クリア」が同時に新規付与される', async () => {
    // first_clear は取得済みとして除外し、5本・10本の判定だけを見る
    mockedPrisma.userAchievement.findMany.mockResolvedValue([
      { achievement: { conditionKey: 'first_clear' } },
    ])
    // クリア10本・総数20本 → 消化率50%なので城王(80%以上)・コンプリート(全クリア)は成立しない
    mockGameCounts(10, 20)
    mockedPrisma.playSession.findMany.mockResolvedValue([])

    const result = await checkAndGrantAchievements(1)

    expect(result).toEqual(['📚 5本クリア', '🎯 10本クリア'])
  })

  it('消化率80%以上で「積みゲー城王」が新規付与される', async () => {
    // first_clear は取得済みとして除外
    mockedPrisma.userAchievement.findMany.mockResolvedValue([
      { achievement: { conditionKey: 'first_clear' } },
    ])
    // クリア4本・総数5本 → 消化率80%ちょうど。5本未満なので five_clears は成立しない
    mockGameCounts(4, 5)
    mockedPrisma.playSession.findMany.mockResolvedValue([])

    const result = await checkAndGrantAchievements(1)

    expect(result).toEqual(['👑 積みゲー城王'])
  })

  it('全ゲームクリアで「コンプリート」が新規付与される', async () => {
    // first_clear と castle_king(全クリアなら消化率100%で同時に条件を満たすため)は取得済みとして除外
    mockedPrisma.userAchievement.findMany.mockResolvedValue([
      { achievement: { conditionKey: 'first_clear' } },
      { achievement: { conditionKey: 'castle_king' } },
    ])
    // クリア3本・総数3本 → 全クリア。5本未満なので five_clears は成立しない
    mockGameCounts(3, 3)
    mockedPrisma.playSession.findMany.mockResolvedValue([])

    const result = await checkAndGrantAchievements(1)

    expect(result).toEqual(['🏆 コンプリート'])
  })

  it('ゲームが0件のときは消化率系の実績(城王・コンプリート)が付与されない', async () => {
    mockedPrisma.userAchievement.findMany.mockResolvedValue([])
    mockGameCounts(0, 0) // 総数0本 → ゼロ除算を避けるガードが効くはず
    mockedPrisma.playSession.findMany.mockResolvedValue([])

    const result = await checkAndGrantAchievements(1)

    expect(result).toEqual([])
  })
})
