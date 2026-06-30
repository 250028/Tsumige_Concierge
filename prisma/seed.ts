// =============================================================
//  Prisma シードスクリプト
//  実行コマンド: npx prisma db seed
//
//  投入するデータ:
//    1. 実績マスター（achievements）6件
//    2. テストユーザー（users）1件  パスワード: test111
//    3. 積みゲーリスト（games）6件
//    4. チャット履歴（chat_logs）3件
// =============================================================

import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

// Prisma 7 ではアダプターに接続オプションを直接渡す
const dbUrl   = new URL(process.env.DATABASE_URL!)
const adapter = new PrismaMariaDb({
  host:     dbUrl.hostname,
  port:     parseInt(dbUrl.port) || 3306,
  user:     dbUrl.username,
  password: dbUrl.password || undefined,
  database: dbUrl.pathname.slice(1),
})
const prisma  = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 シードデータの投入を開始します...')

  // ----------------------------------------------------------
  //  1. 実績マスター
  //     upsert を使うことで、すでにデータがあっても安全に実行できる
  //     conditionKey がユニークキーなので重複しない
  // ----------------------------------------------------------
  const achievementsData = [
    { name: '初クリア',   icon: '⚔️', description: '初めてゲームをクリアした',           conditionKey: 'first_clear' },
    { name: '5本クリア',  icon: '📚', description: '累計5本のゲームをクリアした',         conditionKey: 'five_clears' },
    { name: '連続3日',    icon: '🎯', description: '3日連続でプレイセッションを記録した', conditionKey: 'streak_3days' },
    { name: '10本クリア', icon: '🔥', description: '累計10本のゲームをクリアした',        conditionKey: 'ten_clears' },
    { name: '城の王',     icon: '👑', description: 'クリア率が80%を超えた',               conditionKey: 'castle_king' },
    { name: '全クリア',   icon: '💎', description: '登録した全ゲームをクリアした',         conditionKey: 'all_clear' },
  ]

  for (const achievement of achievementsData) {
    await prisma.achievement.upsert({
      where:  { conditionKey: achievement.conditionKey },
      update: achievement,
      create: achievement,
    })
  }
  console.log(`  ✅ 実績マスター: ${achievementsData.length}件`)

  // ----------------------------------------------------------
  //  2. テストユーザー
  //     パスワード「test111」を bcryptjs でハッシュ化した値
  //     email がユニークキーなので upsert で重複を防ぐ
  // ----------------------------------------------------------
  const testUser = await prisma.user.upsert({
    where:  { email: 'test@example.com' },
    update: {},
    create: {
      name:        '由梨花',
      email:       'test@example.com',
      password:    '$2b$10$4U0PtAJA4Bw9DcfIlrDfpOszg9NlokxnMN9o18CXxhF784Jnw/hR.',
      personaType: 'butler',
      points:      480,
      gamingSince: 2014,
    },
  })
  console.log(`  ✅ テストユーザー: ${testUser.name}（id: ${testUser.id}）`)

  // ----------------------------------------------------------
  //  3. 積みゲーリスト（モックの6本）
  //     テストユーザーに紐づくゲームを登録する
  //     既存データがある場合は削除してから再投入する
  // ----------------------------------------------------------
  await prisma.game.deleteMany({ where: { userId: testUser.id } })

  const gamesData = [
    {
      userId:            testUser.id,
      title:             'ゼルダの伝説 ティアーズ オブ ザ キングダム',
      genre:             'アドベンチャー',
      platform:          'Switch',
      status:            '序盤で放置' as const,
      estimatedPlaytime: 60,
      purchaseDate:      new Date('2023-05-12'),
    },
    {
      userId:            testUser.id,
      title:             'モンスターハンター ワイルズ',
      genre:             'アクションRPG',
      platform:          'PS5',
      status:            '未開封' as const,
      estimatedPlaytime: 50,
      purchaseDate:      new Date('2025-02-28'),
    },
    {
      userId:            testUser.id,
      title:             'ペルソナ5 ロイヤル',
      genre:             'JRPG',
      platform:          'Switch',
      status:            '中断中' as const,
      estimatedPlaytime: 100,
      purchaseDate:      new Date('2022-10-21'),
    },
    {
      userId:        testUser.id,
      title:         'スプラトゥーン3',
      genre:         'シューター',
      platform:      'Switch',
      status:        'プレイ中' as const,
      purchaseDate:  new Date('2022-09-09'),
    },
    {
      userId:        testUser.id,
      title:         'あつまれ どうぶつの森',
      genre:         'シミュレーション',
      platform:      'Switch',
      status:        '序盤で放置' as const,
      purchaseDate:  new Date('2020-03-20'),
    },
    {
      userId:            testUser.id,
      title:             'Elden Ring',
      genre:             'アクションRPG',
      platform:          'PS5',
      status:            '未開封' as const,
      estimatedPlaytime: 60,
      purchaseDate:      new Date('2022-02-25'),
    },
  ]

  await prisma.game.createMany({ data: gamesData })
  console.log(`  ✅ 積みゲーリスト: ${gamesData.length}件`)

  // ----------------------------------------------------------
  //  4. チャット履歴（モックの会話サンプル）
  //     既存データがある場合は削除してから再投入する
  // ----------------------------------------------------------
  await prisma.chatLog.deleteMany({ where: { userId: testUser.id } })

  const chatLogsData = [
    {
      userId:  testUser.id,
      role:    'assistant' as const,
      message: 'ご帰還なさいませ。本日はどのようなゲーム体験をご所望でしょうか？',
    },
    {
      userId:  testUser.id,
      role:    'user' as const,
      message: '2時間あります。スカッとしたい',
    },
    {
      userId:  testUser.id,
      role:    'assistant' as const,
      message: '承知いたしました。「スプラトゥーン3」のナワバリバトルが最適かと存じます！',
    },
  ]

  await prisma.chatLog.createMany({ data: chatLogsData })
  console.log(`  ✅ チャット履歴: ${chatLogsData.length}件`)

  console.log('\n🎉 シードデータの投入が完了しました！')
}

main()
  .catch((e) => {
    console.error('❌ シード中にエラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    // 処理が終わったら必ずDB接続を閉じる
    await prisma.$disconnect()
  })
