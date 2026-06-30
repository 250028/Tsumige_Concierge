import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

// ---------------------------------------------------------------------------
// Prisma クライアントのシングルトン
// ---------------------------------------------------------------------------
// 【なぜシングルトンにするか】
// Next.js の開発サーバーはファイルを変更するたびにモジュールを再読み込みする。
// そのたびに new PrismaClient() を実行すると、DB 接続が使い回されず
// 「接続が多すぎる（Too many connections）」エラーになる。
//
// 解決策：グローバル変数にインスタンスを保持し、
//         すでに存在する場合はそれを再利用する（= シングルトン）。
// ---------------------------------------------------------------------------

// TypeScript にグローバル変数の型を教える
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Prisma 7 ではアダプターに接続オプションを直接渡す
function createPrismaClient() {
  const dbUrl   = new URL(process.env.DATABASE_URL!)
  const adapter = new PrismaMariaDb({
    host:     dbUrl.hostname,
    port:     parseInt(dbUrl.port) || 3306,
    user:     dbUrl.username,
    password: dbUrl.password || undefined,
    database: dbUrl.pathname.slice(1),
  })
  return new PrismaClient({ adapter })
}

const prisma = globalThis.__prisma ?? createPrismaClient()

// 開発環境のみグローバルに保存（本番では毎回新規作成でよい）
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

export default prisma
