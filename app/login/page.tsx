'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab]           = useState<Tab>('login')
  const [loginId, setLoginId]   = useState('')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // ログイン処理
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ loginId, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  // 新規登録処理
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ loginId, name, email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">

        {/* タイトル */}
        <h1 className="text-center text-2xl font-bold text-purple-600 mb-2">
          積みゲー・コンシェルジュ
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          あなたの罪悪感をワクワクに変える
        </p>

        {/* タブ切り替え */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => { setTab('login'); setError('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'login'
                ? 'bg-purple-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => { setTab('register'); setError('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'register'
                ? 'bg-purple-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            新規登録
          </button>
        </div>

        <form
          onSubmit={tab === 'login' ? handleLogin : handleRegister}
          className="space-y-4"
        >
          {/* ログインID（共通） */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              ログインID
            </label>
            <input
              type="text"
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              placeholder="3文字以上の半角英数字"
              required
              className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* 名前・メールアドレス（新規登録のみ） */}
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-sm text-gray-700 mb-1">名前</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="由梨花"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
                />
              </div>
            </>
          )}

          {/* パスワード（共通） */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={tab === 'register' ? '6文字以上' : ''}
              required
              className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* エラーメッセージ */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {loading
              ? '処理中...'
              : tab === 'login' ? 'ログイン' : 'アカウントを作成'
            }
          </button>
        </form>

        {/* テスト用ヒント */}
        <p className="text-center text-gray-400 text-xs mt-6">
          テスト: yurika / test111
        </p>
      </div>
    </div>
  )
}
