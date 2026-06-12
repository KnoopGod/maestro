export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-64 rounded-lg bg-gray-900/80" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-xl border border-gray-800 bg-gray-900/50" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-36 rounded-2xl border border-gray-800 bg-gray-900/40" />
        ))}
      </div>
    </div>
  )
}
