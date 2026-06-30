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

function ItemCard({ item, onMarkDone, onDelete, onClick }: ItemCardProps) {
  const config = TYPE_CONFIG[item.type]

  return (
    <div 
        onClick={onClick}
        className="bg-white rounded-xl border border-stone-200 overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform"
    >

      {/* colored header with emoji */}
      <div className={`${config.bg} h-24 flex items-center justify-center text-4xl`}>
        {config.emoji}
      </div>

      <div className="p-3">

        {/* title — truncates with "..." if too long */}
        <p className="font-semibold text-sm text-gray-900 truncate mb-2">
          {item.title}
        </p>

        {/* badges row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${item.type === "book"
              ? "bg-purple-100 text-purple-700"
              : "bg-orange-100 text-orange-700"
            }`}>
            {item.type}
          </span>

          {item.status === "done"
            ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">Done</span>
            : <span className="text-xs text-gray-400">Up next</span>
          }
        </div>

        {/* star rating — only shows if rated */}
        {item.rating && (
          <div className="flex mb-2">
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
        {item.description && (
          <p className="text-xs text-gray-400 italic line-clamp-2">
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