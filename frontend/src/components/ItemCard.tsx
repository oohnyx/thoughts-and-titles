// import the Item type from App.tsx so we don't define it twice
// the "export" keyword in front of "type Item" in App.tsx makes it importable
import type { Item } from "../types"

type ItemCardProps = {
  item: Item
  onMarkDone: (id: number) => void    // called when user clicks "Done"
  onDelete: (id: number) => void      // called when user clicks delete
  onClick: () => void     // NEW — called when the card itself is clicked
}

// each type gets its own background color and emoji
const TYPE_CONFIG = {
  book:  { bg: "bg-purple-50",  emoji: "📖" },
  movie: { bg: "bg-orange-50",  emoji: "🎬" },
}

const TMDB_POSTER_URL = "https://image.tmdb.org/t/p/w342"

function ItemCard({ item, onMarkDone, onDelete, onClick }: ItemCardProps) {
  const config = TYPE_CONFIG[item.type]
  const posterUrl = item.type === "movie" && item.posterPath
    ? `${TMDB_POSTER_URL}${item.posterPath}`
    : null
  const bookCoverUrl = item.type === "book" && item.coverUrl
    ? item.coverUrl
    : null
  const coverUrl = posterUrl || bookCoverUrl

  return (
    <div 
        onClick={onClick}
        className="bg-white rounded-2xl border border-stone-200 overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all"
    >
      <div className="relative p-2 pb-0">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${item.title} cover`}
            className="aspect-[2/3] w-full rounded-xl object-cover bg-stone-100"
          />
        ) : (
          <div className={`${config.bg} aspect-[2/3] rounded-xl flex items-center justify-center text-5xl`}>
            {config.emoji}
          </div>
        )}

        <span className={`absolute right-4 top-4 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm ${
          item.status === "done"
            ? "bg-emerald-500 text-white"
            : "bg-white/90 text-gray-500"
        }`}>
          {item.status === "done" ? "Done" : "Up next"}
        </span>
      </div>

      <div className="p-3 pt-3">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 font-semibold text-sm leading-snug text-gray-900">
            {item.title}
          </p>
          {item.releaseYear && (
            <span className="shrink-0 text-sm font-medium text-gray-500">
              {item.releaseYear}
            </span>
          )}
        </div>

        <p className="mt-1 min-h-5 text-xs text-gray-400">
          {item.type === "movie" ? item.director || item.genre || "Movie" : item.author || "Book"}
        </p>

        {/* star rating — only shows if rated */}
        {item.rating && (
          <div className="flex mt-2">
            {[...Array(5)].map((_, i) => (
              // Array(5) creates an empty array of 5 slots — we use it just to loop 5 times
              <span key={i} className={i < item.rating! ? "text-amber-400" : "text-gray-200"}>
                ★
                {/* the ! after item.rating is a TypeScript "non-null assertion"
                    it means "trust me, I know this isn't null here" */}
              </span>
            ))}
          </div>
        )}

        {/* description preview — only shows if there is one */}
        {item.type === "book" && item.description && (
          <p className="mt-2 text-xs text-gray-400 italic line-clamp-2">
            "{item.description}"
            {/* line-clamp-2 is a Tailwind class that cuts text to 2 lines with "..." */}
          </p>
        )}

        {/* action buttons */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
          {item.status !== "done" && (
            <button
              onClick={(e) => {
                e.stopPropagation()  // prevents the card's onClick from also firing
                onMarkDone(item.id)
              }}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
            >
              ✓ Done
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()  // prevents the card's onClick from also firing
              onDelete(item.id)
            }}
            className="text-xs text-red-400 hover:text-red-600 ml-auto"
            // ml-auto pushes the delete button to the far right
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  )
}

export default ItemCard
