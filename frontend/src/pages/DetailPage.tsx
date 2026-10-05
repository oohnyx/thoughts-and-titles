import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { deleteItem, fetchItem, fetchMovieDetails, searchMovies, updateItem } from "../api"
import type { BaseItem, Item, MovieEntry, MovieSearchResult } from "../types"

const POSTER_URL = "https://image.tmdb.org/t/p/w500"
type MovieField = Exclude<keyof MovieEntry, keyof BaseItem | "type">

function formatDate(value?: string) {
  if (!value) return "Not logged yet"
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date)
}

function formatCompletionDate(item: Item) {
  if (item.completedDatePrecision === "unknown") return "Date not remembered"
  if (item.completedYear && item.completedDatePrecision === "year") return String(item.completedYear)
  if (item.completedYear && item.completedMonth && item.completedDatePrecision === "month") return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(item.completedYear, item.completedMonth - 1, 1)))
  if (item.completedYear && item.completedMonth && item.completedDay && item.completedDatePrecision === "exact") return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(item.completedYear, item.completedMonth - 1, item.completedDay)))
  return formatDate(item.type === "movie" ? item.dateWatched : item.dateRead)
}

function Stars({ rating, editing, onRate }: { rating: number | null; editing: boolean; onRate: (value: number) => void }) {
  return <div className="flex text-2xl tracking-tight text-[#b4442a]">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" disabled={!editing} onClick={() => onRate(star)} className={editing ? "cursor-pointer hover:scale-110" : "cursor-default"}>{(rating ?? 0) >= star ? "★" : "☆"}</button>)}</div>
}

function LinedField({ label, value, editing, multiline, onChange }: { label: string; value: string; editing: boolean; multiline?: boolean; onChange: (value: string) => void }) {
  return <div><p className="text-sm font-bold uppercase tracking-[.18em] text-[#715e4d]">{label}</p>{editing ? multiline ? <textarea value={value} rows={2} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full resize-none border-b border-[#dcc8a9] bg-transparent font-hand text-xl outline-none" /> : <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border-b border-[#dcc8a9] bg-transparent pb-1 text-xl outline-none" /> : <p className="mt-2 min-h-8 border-b border-[#dcc8a9] pb-1 font-hand text-xl">{value || "—"}</p>}</div>
}

function DetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<Item | null>(null)
  const [draft, setDraft] = useState<Item | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [posterSearch, setPosterSearch] = useState(false)
  const [year, setYear] = useState("")
  const [results, setResults] = useState<MovieSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const entry = await fetchItem(Number(id))
        setItem(entry); setDraft(entry)
        if (entry.type === "movie") setYear(entry.releaseYear?.toString() ?? "")
      } catch { setError("Could not load this entry.") } finally { setLoading(false) }
    }
    load()
  }, [id])

  const update = (key: string, value: string | number) => setDraft((current) => current ? { ...current, [key]: value } : current)
  const updateMovie = (key: MovieField, value: string) => setDraft((current) => current?.type === "movie" ? { ...current, [key]: value } : current)
  async function save() {
    if (!draft) return
    try {
      const changes = draft.type === "movie" ? { ...draft } : draft
      const saved = await updateItem(draft.id, changes)
      setItem(saved); setDraft(saved); setEditing(false)
    } catch { setError("Could not save changes.") }
  }
  async function moveToNightstand(status: "queued" | "in_progress") {
    if (!item) return
    try {
      const saved = await updateItem(item.id, { status })
      setItem(saved); setDraft(saved); setMoveOpen(false)
    } catch { setError("Could not move this entry to the Nightstand.") }
  }
  async function remove() {
    if (!item || !window.confirm(`Remove “${item.title}” from your shelf?`)) return
    try { await deleteItem(item.id); navigate("/shelf") } catch { setError("Could not remove entry.") }
  }
  async function findPosters() {
    if (!item || item.type !== "movie") return
    setSearching(true)
    try { setResults(await searchMovies(item.title, year)) } catch { setError("Could not search for posters.") } finally { setSearching(false) }
  }
  async function choosePoster(result: MovieSearchResult) {
    if (!item || item.type !== "movie") return
    try {
      let details: { director: string | null; genre: string | null; overview: string | null } | null = null
      try { details = await fetchMovieDetails(result.tmdbId, item.mediaType) } catch { /* optional metadata */ }
      const saved = await updateItem(item.id, { tmdbId: result.tmdbId, posterPath: result.posterPath, releaseYear: result.releaseYear ?? undefined, director: details?.director ?? item.director, genre: details?.genre ?? item.genre, description: item.description || details?.overview || "" })
      setItem(saved); setDraft(saved); setPosterSearch(false); setResults([])
    } catch { setError("Could not save poster.") }
  }

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#766b60] font-sans text-[#fff8ef]">Loading entry…</div>
  if (!item) return <div className="grid min-h-screen place-items-center bg-[#766b60] font-sans text-[#fff8ef]"><div className="text-center"><p>{error || "Entry not found."}</p><button onClick={() => navigate("/shelf")} className="mt-4 underline">Back to shelf</button></div></div>

  const movie = item.type === "movie" ? item : null
  const shown = editing && draft ? draft : item
  const shownMovie = shown.type === "movie" ? shown : null
  const poster = movie?.posterPath ? POSTER_URL + movie.posterPath : null
  const details = item.type === "movie" ? [item.releaseYear, item.director && `dir. ${item.director}`, item.genre].filter(Boolean).join("  ·  ") : [item.releaseYear, item.author, item.genre].filter(Boolean).join("  ·  ")

  return <main className="min-h-screen bg-[#766b60] px-4 py-7 font-sans sm:px-8 lg:px-12 lg:py-12"><section className="mx-auto max-w-[1420px] overflow-hidden rounded-[24px] bg-[#fffaf2] text-[#352218] shadow-2xl">
    <div className="h-6 border-y-4 border-[#3e2114] bg-[repeating-linear-gradient(90deg,#62361f_0_68px,#4d2a1a_68px_136px)]" />
    <div className="px-6 pb-8 pt-8 sm:px-12 lg:px-14">
      <div className="flex items-center justify-between text-sm uppercase tracking-[.24em] text-[#735f4e]"><span>Entry · No. {String(item.id).padStart(3, "0")}</span><button type="button" onClick={() => navigate("/shelf")} className="grid h-12 w-12 place-items-center rounded-full border border-[#d5bfa5] text-3xl font-light normal-case tracking-normal hover:bg-[#f7ead7]">×</button></div>
      {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-10 lg:grid-cols-[410px_minmax(0,1fr)] lg:gap-14">
        <aside><div className="rounded-lg border-[16px] border-[#4d2b1b] bg-[#8e603a] p-3 shadow-[0_12px_16px_-10px_rgba(44,24,13,.8)]"><div className="relative aspect-[.69] overflow-hidden bg-[#efd0a4]"><span className="absolute left-1/2 top-0 z-10 h-4 w-36 -translate-x-1/2 rounded-b-sm bg-[#fff2cf]" />{poster ? <img src={poster} alt={item.title + " poster"} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center border-2 border-dashed border-[#a68462] p-8 text-center text-[#6a513d]"><span className="text-3xl">▧</span><span className="mt-3 font-serif text-lg">{item.title}</span><span className="mt-1 text-sm">poster not added</span></div>}<span className="absolute right-4 top-8 -rotate-6 rounded bg-[#fff9e9] px-4 py-2 font-hand text-sm shadow-md">{movie?.sumUpInOneWord || "kept"}</span></div></div>
          <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-xl border border-[#d5bfa5]"><div className="border-r border-dashed border-[#d5bfa5] p-4"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#715e4d]">{movie ? "Finished watching" : "Finished reading"}</p><p className="mt-2 font-serif text-2xl">{formatCompletionDate(item)}</p></div><div className="p-4"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#715e4d]">Where</p><p className="mt-2 font-serif text-2xl">{movie?.whereWatched || "—"}</p></div></div>
          <div className="mt-6 flex items-center gap-3 text-[#654a39]"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#b4442a] text-lg text-white">再</span><span>{item.status === "done" ? "Shelved · finished" : item.status === "in_progress" ? "On the nightstand · in progress" : "On the nightstand · queued"}</span></div></aside>
        <article className="min-w-0"><div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="font-serif text-5xl leading-none sm:text-6xl lg:text-7xl">{item.title}</h1><div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-lg text-[#6a5647]"><span className="rounded-full bg-[#f6e7c7] px-3 py-1 text-base font-bold text-[#60402e]">{movie?.mediaType === "series" ? "Series" : item.type === "book" ? "Book" : "Movie"}</span><span>{details || "Details to be added"}</span></div></div><Stars rating={shown.rating} editing={editing} onRate={(value) => update("rating", value)} /></div>
          <div className="mt-10 font-hand text-xl leading-8 text-[#564233]">{editing ? <textarea value={draft?.description ?? ""} rows={3} onChange={(event) => update("description", event.target.value)} className="w-full resize-none border-b border-[#dcc8a9] bg-transparent outline-none" /> : item.description || "A story still waiting for its notes."}</div>
          {movie && <div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2"><LinedField label="Favorite character" value={shownMovie?.favoriteCharacter ?? ""} editing={editing} onChange={(value) => updateMovie("favoriteCharacter", value)} /><LinedField label="Least favorite" value={shownMovie?.leastFavoriteCharacter ?? ""} editing={editing} onChange={(value) => updateMovie("leastFavoriteCharacter", value)} /></div>}
          <section className="mt-8"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#715e4d]">My review</p>{editing ? <textarea value={draft?.review ?? ""} rows={4} onChange={(event) => update("review", event.target.value)} className="mt-3 w-full resize-none border-y border-[#dcc8a9] bg-transparent py-2 font-hand text-xl leading-8 outline-none" /> : <p className="mt-3 border-y border-[#dcc8a9] py-2 font-hand text-xl leading-8">{item.review || "No review written yet."}</p>}</section>
          {movie && <section className="mt-8 rounded-xl bg-[#f6e5bf] px-7 py-6"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#715e4d]">A line I kept</p>{editing ? <textarea value={shownMovie?.quote ?? ""} rows={2} onChange={(event) => updateMovie("quote", event.target.value)} className="mt-3 w-full resize-none bg-transparent font-serif text-2xl outline-none" /> : <p className="mt-3 font-serif text-2xl leading-relaxed">{movie.quote ? `“${movie.quote}”` : "No line saved yet."}</p>}</section>}
          {movie && <div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2"><LinedField label="Best moment" multiline value={shownMovie?.bestMoment ?? ""} editing={editing} onChange={(value) => updateMovie("bestMoment", value)} /><LinedField label="Worst moment" multiline value={shownMovie?.worstMoment ?? ""} editing={editing} onChange={(value) => updateMovie("worstMoment", value)} /></div>}
          {editing && movie && <div className="mt-8 border-t border-[#dcc8a9] pt-6"><button type="button" onClick={() => setPosterSearch(!posterSearch)} className="text-sm font-bold text-[#b4442a] underline underline-offset-4">{posterSearch ? "Hide poster search" : poster ? "Change poster" : "Find a poster"}</button>{posterSearch && <div className="mt-4 rounded-xl border border-[#d5bfa5] p-4"><div className="flex gap-2"><input type="number" value={year} onChange={(event) => setYear(event.target.value)} placeholder="Release year" className="w-36 rounded-lg border border-[#d5bfa5] bg-white px-3 py-2" /><button type="button" disabled={searching} onClick={findPosters} className="rounded-lg bg-[#b4442a] px-4 py-2 text-sm font-bold text-white">{searching ? "Searching…" : "Find poster"}</button></div>{results.length > 0 && <div className="mt-4 grid grid-cols-3 gap-3">{results.map((result) => <button key={result.tmdbId} type="button" onClick={() => choosePoster(result)} className="overflow-hidden rounded border border-[#d5bfa5] text-left"><img src={POSTER_URL + result.posterPath} alt={result.title + " poster"} className="aspect-[2/3] w-full object-cover" /><span className="block p-2 text-xs">{result.title}</span></button>)}</div>}</div>}</div>}
        </article>
      </div>
    </div>
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#dcc8a9] px-6 py-5 text-[#765e4d] sm:px-12 lg:px-14"><p>{item.status === "done" ? "shelved" : "on the nightstand"} · entry {String(item.id).padStart(3, "0")}</p><div className="flex flex-wrap gap-3">{editing ? <><button type="button" onClick={() => { setDraft(item); setEditing(false); setPosterSearch(false) }} className="rounded-full border border-[#d5bfa5] px-6 py-3">Cancel</button><button type="button" onClick={save} className="rounded-full bg-[#b4442a] px-6 py-3 font-bold text-white">Save entry</button></> : <>{item.status === "done" && <div className="relative"><button type="button" onClick={() => setMoveOpen((open) => !open)} className="rounded-full border border-[#d5bfa5] px-6 py-3">Move to Nightstand</button>{moveOpen && <div className="absolute bottom-full right-0 z-20 mb-2 w-60 rounded-xl border border-[#d5bfa5] bg-[#fffaf2] p-2 shadow-xl"><button type="button" onClick={() => moveToNightstand("queued")} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f7ead7]"><strong>Queued</strong><span className="mt-0.5 block text-xs">I may revisit this later</span></button><button type="button" onClick={() => moveToNightstand("in_progress")} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f7ead7]"><strong>In progress</strong><span className="mt-0.5 block text-xs">I&apos;m actively revisiting it</span></button></div>}</div>}<button type="button" onClick={() => { setDraft(item); setEditing(true) }} className="rounded-full bg-[#b4442a] px-6 py-3 font-bold text-white">Edit entry</button><button type="button" onClick={remove} className="px-2 text-sm text-[#a84432] underline">Delete</button></>}</div></footer>
  </section></main>
}

export default DetailPage
