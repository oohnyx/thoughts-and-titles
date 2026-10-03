import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { deleteItem, fetchItem, updateItem } from "../api"
import type { BaseItem, Item, MovieEntry } from "../types"

type StarRatingProps = {
    rating: number | null
    editing: boolean
    onRate: (star: number) => void
}

function StarRating({ rating, editing, onRate }: StarRatingProps) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => editing && onRate(star)}
            // only clickable in edit mode — clicking sets the rating to this star's number
            className={`text-2xl transition-colors
              ${(rating ?? 0) >= star ? "text-amber-400" : "text-gray-200"}
              ${editing ? "cursor-pointer hover:text-amber-300" : ""}
            `}
          >
            ★
          </span>
        ))}
        <span className="text-sm text-gray-400 self-center ml-2">
          {rating ? `${rating} / 5` : "Not rated yet"}
        </span>
      </div>
    )
  }
// useParams reads the :id from the URL
// e.g. if the URL is /item/3, then params.id === "3"

const TYPE_CONFIG = {
  book:  { bg: "bg-purple-50", emoji: "📖", color: "text-purple-600" },
  movie: { bg: "bg-orange-50", emoji: "🎬", color: "text-orange-500" },
}

type MovieJournalField = Exclude<keyof MovieEntry, keyof BaseItem>

const MOVIE_JOURNAL_FIELDS: Array<{
  key: MovieJournalField
  label: string
  placeholder: string
  multiline?: boolean
  inputType?: "date"
}> = [
  { key: "director", label: "Director", placeholder: "Add the director" },
  { key: "genre", label: "Genre", placeholder: "Add a genre" },
  { key: "dateWatched", label: "Date watched", placeholder: "", inputType: "date" },
  { key: "favoriteCharacter", label: "Favorite character", placeholder: "Who did you love?" },
  { key: "leastFavoriteCharacter", label: "Least favorite character", placeholder: "Who was not for you?" },
  { key: "sumUpInOneWord", label: "Sum it up in one word", placeholder: "Your one-word verdict" },
  { key: "whereWatched", label: "Where I watched it", placeholder: "Cinema, Netflix, etc." },
  { key: "quote", label: "Quote from the movie", placeholder: "A line worth remembering", multiline: true },
  { key: "bestMoment", label: "Best moment", placeholder: "Your favorite scene", multiline: true },
  { key: "worstMoment", label: "Worst moment", placeholder: "The weakest scene", multiline: true },
]

function DetailPage() {
  const { id } = useParams()          // grab the id from the URL
  const navigate = useNavigate()       // for the back button
  const itemId = Number(id)

  const [item, setItem] = useState<Item | null>(null)
  const [draftItem, setDraftItem] = useState<Item | null>(null)
  const [editing, setEditing] = useState(false)  // toggle edit mode on/off
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadItem() {
      if (Number.isNaN(itemId)) {
        setLoading(false)
        return
      }

      try {
        const fetchedItem = await fetchItem(itemId)
        setItem(fetchedItem)
        setDraftItem(fetchedItem)
      } catch {
        setError("Could not load this item.")
      } finally {
        setLoading(false)
      }
    }

    loadItem()
  }, [itemId])

  async function handleSave() {
    if (!draftItem) return

    try {
      const updatedItem = await updateItem(draftItem.id, {
        status: draftItem.status,
        rating: draftItem.rating,
        description: draftItem.description,
        review: draftItem.review,
        ...(draftItem.type === "movie" ? {
          director: draftItem.director,
          favoriteCharacter: draftItem.favoriteCharacter,
          leastFavoriteCharacter: draftItem.leastFavoriteCharacter,
          sumUpInOneWord: draftItem.sumUpInOneWord,
          genre: draftItem.genre,
          quote: draftItem.quote,
          whereWatched: draftItem.whereWatched,
          bestMoment: draftItem.bestMoment,
          worstMoment: draftItem.worstMoment,
          dateWatched: draftItem.dateWatched,
        } : {}),
      })
      setItem(updatedItem)
      setDraftItem(updatedItem)
      setEditing(false)
      setError("")
    } catch {
      setError("Could not save changes.")
    }
  }

  function handleCancel() {
    setDraftItem(item)
    setEditing(false)
  }

  function updateMovieField(field: MovieJournalField, value: string) {
    setDraftItem((current) => {
      if (!current || current.type !== "movie") return current
      return { ...current, [field]: value }
    })
  }

  async function handleToggleStatus() {
    if (!item) return

    try {
      const updatedItem = await updateItem(item.id, {
        status: item.status === "done" ? "to_watch" : "done",
        rating: item.rating,
        description: item.description,
        review: item.review,
      })
      setItem(updatedItem)
      setDraftItem(updatedItem)
      setError("")
    } catch {
      setError("Could not update item.")
    }
  }

  async function handleDelete() {
    if (!item) return

    try {
      await deleteItem(item.id)
      navigate("/")
    } catch {
      setError("Could not delete item.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 p-6 font-sans flex items-center justify-center">
        <p className="text-gray-400">Loading item...</p>
      </div>
    )
  }

  // if the URL has an id that doesn't exist, show a fallback
  if (!item) {
    return (
      <div className="min-h-screen bg-stone-100 p-6 font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{error || "Item not found."}</p>
          <button onClick={() => navigate("/")} className="text-sm text-gray-600 underline">
            Back to shelf
          </button>
        </div>
      </div>
    )
  }

  const config = TYPE_CONFIG[item.type]

  return (
    <div className="min-h-screen bg-stone-100 p-6 font-sans">
      <div className="max-w-xl mx-auto">

        {/* ── BACK BUTTON ── */}
        <button
          onClick={() => navigate("/")}
          className="text-sm text-gray-400 hover:text-gray-700 mb-5 flex items-center gap-1"
        >
          ← Back to shelf
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">

          {/* ── HERO HEADER ── */}
          <div className={`${config.bg} p-6 flex items-center gap-5`}>
            <div className="bg-white rounded-xl w-16 h-16 flex items-center justify-center text-3xl border border-stone-100 shadow-sm">
              {config.emoji}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{item.title}</h1>
              <p className={`text-sm ${config.color} mt-0.5`}>{item.type}</p>
              <div className="flex gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${item.type === "book" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>
                  {item.type}
                </span>
                {item.status === "done"
                  ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">✓ Finished</span>
                  : <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-stone-100 text-stone-500">Up next</span>
                }
              </div>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6">

            {/* ── DESCRIPTION ── */}
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Description</p>
              {editing ? (
                <textarea
                  value={draftItem?.description ?? ""}
                  onChange={(e) =>
                    setDraftItem((current) =>
                      current ? { ...current, description: e.target.value } : current
                    )
                  }
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
                />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed bg-stone-50 rounded-lg p-3 border border-stone-100">
                  {item.description || <span className="text-gray-300">No description yet.</span>}
                </p>
              )}
            </div>

            {/* ── RATING ── */}
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">My rating</p>
              <StarRating 
                rating={editing ? draftItem?.rating ?? null : item.rating}
                editing={editing}
                onRate={(star) =>
                  setDraftItem((current) =>
                    current ? { ...current, rating: star } : current
                  )
                }
              />
              {editing && (
                <p className="text-xs text-gray-300 mt-1">Click a star to rate</p>
              )}
            </div>

            {/* ── REVIEW ── */}
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">My review</p>
              {editing ? (
                <textarea
                  value={draftItem?.review ?? ""}
                  onChange={(e) =>
                    setDraftItem((current) =>
                      current ? { ...current, review: e.target.value } : current
                    )
                  }
                  placeholder="Write your review..."
                  rows={4}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
                />
              ) : (
                <div className="text-sm text-gray-700 leading-relaxed italic border-l-2 border-purple-200 pl-3">
                  {item.review || <span className="text-gray-300 not-italic">No review yet.</span>}
                </div>
              )}
            </div>

            {item.type === "movie" && (
              <div className="border-t border-orange-100 pt-6">
                <p className="text-xs uppercase tracking-widest text-orange-500 mb-4">Movie journal</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {MOVIE_JOURNAL_FIELDS.map((field) => {
                    const value = editing && draftItem?.type === "movie"
                      ? draftItem[field.key] ?? ""
                      : item[field.key] ?? ""

                    return (
                      <div
                        key={field.key}
                        className={field.multiline ? "sm:col-span-2" : ""}
                      >
                        <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                          {field.label}
                        </p>
                        {editing ? (
                          field.multiline ? (
                            <textarea
                              value={value}
                              onChange={(e) => updateMovieField(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              rows={3}
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
                            />
                          ) : (
                            <input
                              type={field.inputType ?? "text"}
                              value={value}
                              onChange={(e) => updateMovieField(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                          )
                        ) : (
                          <p className="min-h-10 rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm text-gray-700">
                            {value || <span className="text-gray-300">Not added yet.</span>}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── ACTION BUTTONS ── */}
            <div className="flex gap-2 pt-4 border-t border-stone-100">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Save changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-sm px-4 py-2 rounded-lg border border-stone-200 text-gray-500 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setDraftItem(item)
                      setEditing(true)
                    }}
                    className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    ✏ Edit
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    className="text-sm px-4 py-2 rounded-lg border border-stone-200 text-gray-600 hover:bg-stone-50"
                  >
                    {item.status === "done" ? "↩ Mark unread" : "✓ Mark done"}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-sm px-4 py-2 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 ml-auto"
                  >
                    🗑 Delete
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default DetailPage
