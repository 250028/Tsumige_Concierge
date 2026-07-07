'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  role: 'user' | 'assistant'
  text: string
}

type Persona = 'butler' | 'gamer' | 'fairy'

const PERSONA_LABELS: Record<Persona, string> = {
  butler: '🎩 執事',
  gamer: '🎮 ゲーマー仲間',
  fairy: '🧚 ゲームの妖精',
}

type Props = {
  // ドロワー内で使う場合に閉じるボタンのコールバックを受け取る
  onClose?: () => void
}

export default function ChatPanel({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [persona, setPersona] = useState<Persona>('butler')
  const bottomRef = useRef<HTMLDivElement>(null)

  // 新しいメッセージが来たら自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, persona }),
      })
      const data = await res.json()
      const replyText = data.reply ?? data.error ?? '返答できませんでした'
      setMessages(prev => [...prev, { role: 'assistant', text: replyText }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '通信エラーが発生しました。もう一度お試しください。' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-200 bg-white flex items-center justify-between">
        <p className="text-sm font-bold text-gray-700">💬 AIコンシェルジュ</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="閉じる"
          >
            ✕
          </button>
        )}
      </div>

      {/* ペルソナ切り替え */}
      <div className="px-4 py-2 bg-white border-b border-gray-100 flex gap-2">
        {(Object.keys(PERSONA_LABELS) as Persona[]).map(p => (
          <button
            key={p}
            onClick={() => setPersona(p)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              persona === p
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-purple-100'
            }`}
          >
            {PERSONA_LABELS[p]}
          </button>
        ))}
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm pt-8">
            <p>「スカッとしたい」「2時間ある」など、</p>
            <p>気分や状況を話しかけてみてください。</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-gray-400">
              考え中…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="「スカッとしたい」「2時間ある」など…"
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-full bg-gray-100 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-300 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-semibold disabled:opacity-40 hover:bg-purple-700 transition-colors"
        >
          送信
        </button>
      </div>
    </div>
  )
}
