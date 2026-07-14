'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  // マウント時に現在のテーマ状態を読み取る（layout.tsxのインラインスクリプトが既にclassを適用済み）
  // サイドバーのようにページ遷移をまたいで生き続けるインスタンスがあるため、
  // 他の場所（設定画面など）でテーマが変わったときも同期できるようイベントを購読する
  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'))
    // サーバー側ではisDark=falseで描画されるため（hydrationミスマッチ回避）、
    // マウント後に実際のDOMの状態へ同期する
    sync()
    window.addEventListener('themechange', sync)
    return () => window.removeEventListener('themechange', sync)
  }, [])

  function toggle() {
    // 自分のstateではなく実際のDOMの状態を基準にする
    // （複数箇所に配置されたインスタンス間でstateがズレていても正しく反転させるため）
    const next = !document.documentElement.classList.contains('dark')
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    window.dispatchEvent(new Event('themechange'))
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <span className="flex items-center gap-2">
        <span>{isDark ? '🌙' : '☀️'}</span>
        {isDark ? 'ダークモード' : 'ライトモード'}
      </span>
      <span
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
          isDark ? 'bg-purple-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            isDark ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  )
}
