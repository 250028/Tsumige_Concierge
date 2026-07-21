export default function GameDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <h1 className="text-base font-bold text-purple-600">ゲーム詳細</h1>
      </header>

      <div className="w-full max-w-md mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  )
}
