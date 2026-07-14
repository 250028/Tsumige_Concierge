type Props = {
  message: string
  subMessage?: string
}

// 空データ時に表示する共通イラスト（空の箱）＋メッセージ
export default function EmptyState({ message, subMessage }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <svg
        viewBox="0 0 120 100"
        className="w-28 h-24 mb-3"
        aria-hidden="true"
      >
        {/* 開いた空き箱 */}
        <path
          d="M15 45 L60 30 L105 45 L105 75 Q105 80 100 81 L62 90 Q60 90.5 58 90 L20 81 Q15 80 15 75 Z"
          className="fill-purple-100 dark:fill-gray-700"
        />
        <path
          d="M15 45 L60 58 L105 45"
          className="fill-none stroke-purple-300 dark:stroke-gray-600"
          strokeWidth="2"
        />
        <path
          d="M60 58 L60 90"
          className="fill-none stroke-purple-300 dark:stroke-gray-600"
          strokeWidth="2"
        />
        {/* 蓋（左右に開いている） */}
        <path
          d="M12 44 L58 28 L58 38 L18 52 Z"
          className="fill-purple-200 dark:fill-gray-600"
        />
        <path
          d="M108 44 L62 28 L62 38 L102 52 Z"
          className="fill-purple-200 dark:fill-gray-600"
        />
        {/* きらり */}
        <path
          d="M60 12 L63 20 L71 22 L63 24 L60 32 L57 24 L49 22 L57 20 Z"
          className="fill-amber-300 dark:fill-amber-500"
        />
      </svg>
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
      {subMessage && <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">{subMessage}</p>}
    </div>
  )
}
