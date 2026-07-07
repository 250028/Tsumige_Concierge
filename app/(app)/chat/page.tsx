import ChatPanel from '@/components/ChatPanel'

export default function ChatPage() {
  return (
    // スマホ用：全画面チャット（ボトムタブの高さ分を引く）
    <div className="h-[calc(100vh-4rem)]">
      <ChatPanel />
    </div>
  )
}
