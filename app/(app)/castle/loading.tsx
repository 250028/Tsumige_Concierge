export default function CastleLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-lg font-bold text-purple-600">積みゲー城</h1>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-6 animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl" />
          <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl" />
          <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
