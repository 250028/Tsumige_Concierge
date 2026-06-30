import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

// ログインなしでアクセスできるパス
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/register']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 公開パスはそのまま通す
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // セッションを確認
  const res     = NextResponse.next()
  const session = await getIronSession<SessionData>(req, res, sessionOptions)

  // 未ログインなら /login にリダイレクト
  if (!session.userId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

// proxy を適用するパスの範囲
export const config = {
  matcher: [
    // _next/static, _next/image, favicon.ico, api/health は除外
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
}
