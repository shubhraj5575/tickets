export function PageLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
