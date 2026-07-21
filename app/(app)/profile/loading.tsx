export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-lg font-bold text-purple-600">プロフィール</h1>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-6 animate-pulse">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 p-6 space-y-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 p-6 grid grid-cols-2 gap-3">
          <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl" />
          <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl" />
          <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl" />
          <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 p-6 h-20" />
      </div>
    </div>
  )
}
