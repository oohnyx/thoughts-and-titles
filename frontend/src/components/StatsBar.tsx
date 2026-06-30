type StatsBarProps = {
  total: number
  finished: number
  avgRating: string    // string because it might be "—" when there are no ratings
}

function StatsBar({ total, finished, avgRating }: StatsBarProps) {
  return (
    // grid with 3 equal columns
    <div className="grid grid-cols-3 gap-3 mb-6">

      <div className="bg-white rounded-xl p-4 border border-stone-200">
        <span className="block text-2xl font-bold">{total}</span>
        <span className="block text-xs text-gray-400 mt-1">Total saved</span>
      </div>

      <div className="bg-white rounded-xl p-4 border border-stone-200">
        <span className="block text-2xl font-bold text-emerald-500">{finished}</span>
        <span className="block text-xs text-gray-400 mt-1">Finished</span>
      </div>

      <div className="bg-white rounded-xl p-4 border border-stone-200">
        <span className="block text-2xl font-bold text-amber-400">{avgRating}</span>
        <span className="block text-xs text-gray-400 mt-1">Avg rating</span>
      </div>

    </div>
  )
}

export default StatsBar