import { useState } from "react";
import { fetchMovieDetails, searchMovies } from "../api";
import type { MovieSearchResult } from "../types";

const TMDB_POSTER_URL = "https://image.tmdb.org/t/p/w342";

const EMPTY_MOVIE_FIELDS = {
  director: "",
  favoriteCharacter: "",
  leastFavoriteCharacter: "",
  sumUpInOneWord: "",
  genre: "",
  quote: "",
  whereWatched: "",
  bestMoment: "",
  worstMoment: "",
  dateWatched: "",
};

type MovieData = {
  title: string;
  type: "movie";
  status: "done" | "to_watch";
  mediaType: "movie" | "series";
  description: string;
  rating?: number;
  review: string;
  tmdbId: number;
  posterPath: string;
  releaseYear?: number;
} & typeof EMPTY_MOVIE_FIELDS;

type AddMovieModalProps = {
  onClose: () => void;
  onSave: (data: MovieData) => Promise<void>;
};

function AddMovieModal({ onClose, onSave }: AddMovieModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<"movie" | "series">("movie");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(null);
  const [movieFields, setMovieFields] = useState(EMPTY_MOVIE_FIELDS);
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [moreNotesOpen, setMoreNotesOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateField(field: keyof typeof EMPTY_MOVIE_FIELDS, value: string) {
    setMovieFields((current) => ({ ...current, [field]: value }));
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setIsSearching(true);
    setMessage("");
    try {
      const matches = await searchMovies(query, undefined, mediaType);
      setResults(matches);
      if (!matches.length) setMessage("No films found. Try another title.");
    } catch {
      setMessage("Could not search for films. Is Flask running?");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelect(movie: MovieSearchResult) {
    setSelectedMovie(movie);
    setResults([]);
    setMessage("");
    setStep(2);
    try {
      const details = await fetchMovieDetails(movie.tmdbId, mediaType);
      setMovieFields((current) => ({
        ...current,
        director: details.director ?? "",
        genre: details.genre ?? "",
      }));
      // The overview is a helpful starting point, but the review remains entirely theirs.
    } catch {
      setMessage("Film selected. Some details could not be filled automatically.");
    }
  }

  async function handleSave(status: "done" | "to_watch") {
    if (!selectedMovie) return;
    setIsSaving(true);
    setMessage("");
    try {
      await onSave({
        title: selectedMovie.title,
        type: "movie",
        mediaType,
        status,
        description: "",
        rating: rating ?? undefined,
        review,
        ...movieFields,
        tmdbId: selectedMovie.tmdbId,
        posterPath: selectedMovie.posterPath,
        releaseYear: selectedMovie.releaseYear ?? undefined,
      });
    } catch {
      setMessage("Could not save this film. Please try again.");
      setIsSaving(false);
    }
  }

  const movieSummary = selectedMovie && (
    <div className="flex items-center gap-4 rounded-2xl bg-[#f3eddf] p-3 sm:p-4">
      <img
        src={`${TMDB_POSTER_URL}${selectedMovie.posterPath}`}
        alt={`${selectedMovie.title} poster`}
        className="h-20 w-14 rounded-lg object-cover bg-stone-200"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-xl text-stone-900">{selectedMovie.title}</p>
        <p className="mt-1 text-sm text-stone-500">
          {[selectedMovie.releaseYear, movieFields.director, movieFields.genre].filter(Boolean).join(" · ")}
        </p>
      </div>
      <button type="button" onClick={() => setStep(1)} className="text-sm text-[#c94d32] underline underline-offset-2">Change</button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="add-film-title">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[22px] bg-[#fffcf6] shadow-2xl">
        <header className="flex items-start justify-between border-b border-[#e8e0d1] px-6 py-6 sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Step {step} of 2</p>
            <h2 id="add-film-title" className="mt-2 font-serif text-3xl text-stone-900">{step === 1 ? "What did you watch?" : "How was it?"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close add film dialog" className="grid h-10 w-10 place-items-center rounded-full border border-[#d9cfbd] text-2xl font-light text-stone-800 transition hover:bg-[#f3eddf]">×</button>
        </header>

        {step === 1 ? (
          <div className="overflow-y-auto px-6 py-6 sm:px-8">
            <div className="flex items-center gap-4 text-sm">
              <div className="inline-flex rounded-full border border-[#d9cfbd] p-1">
                <span className="rounded-full bg-stone-900 px-5 py-2 text-white">Film</span>
              </div>
              <span className="h-7 border-l border-[#d9cfbd]" aria-hidden="true" />
              <div className="inline-flex rounded-full border border-[#d9cfbd] p-1" aria-label="Film format">
                <button type="button" onClick={() => { setMediaType("movie"); setResults([]); }} className={`rounded-full px-5 py-2 transition ${mediaType === "movie" ? "border border-[#64844e] bg-[#edf2e5] font-semibold text-[#486833]" : "text-stone-700"}`}>Movie</button>
                <button type="button" onClick={() => { setMediaType("series"); setResults([]); }} className={`rounded-full px-5 py-2 transition ${mediaType === "series" ? "border border-[#64844e] bg-[#edf2e5] font-semibold text-[#486833]" : "text-stone-700"}`}>Series</button>
              </div>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); handleSearch(); }} className="mt-4">
              <div className="flex rounded-xl border-2 border-[#64844e] bg-white p-1 shadow-[0_0_0_4px_rgba(100,132,78,.13)]">
                <span className="grid w-10 place-items-center text-stone-500">⌕</span>
                <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for a film" className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none" />
                <button type="submit" disabled={isSearching} className="rounded-lg bg-[#5e8048] px-4 text-sm font-semibold text-white disabled:opacity-60">{isSearching ? "Searching…" : "Search"}</button>
              </div>
            </form>
            {message && <p className="mt-4 text-sm text-[#b44934]">{message}</p>}
            {results.length > 0 && <div className="mt-5 overflow-hidden rounded-xl border border-[#e3dac9]">
              {results.map((movie) => <button key={movie.tmdbId} type="button" onClick={() => handleSelect(movie)} className="flex w-full items-center gap-4 border-b border-[#e8e0d1] p-3 text-left last:border-0 hover:bg-[#edf2e5]">
                <img src={`${TMDB_POSTER_URL}${movie.posterPath}`} alt="" className="h-16 w-11 rounded-md object-cover bg-stone-200" />
                <span className="min-w-0 flex-1"><span className="block truncate font-serif text-lg text-stone-900">{movie.title}</span><span className="text-sm text-stone-500">{mediaType === "movie" ? "Movie" : "Series"} · {movie.releaseYear ?? "Year unavailable"}</span></span>
                <span className="text-sm font-semibold text-[#587641]">Select ↵</span>
              </button>)}
            </div>}
          </div>
        ) : (
          <div className="overflow-y-auto px-6 py-6 sm:px-8">
            {movieSummary}
            {message && <p className="mt-3 text-sm text-[#b44934]">{message}</p>}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <fieldset><legend className="mb-2 text-sm font-semibold text-stone-800">Rating</legend><div className="flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} stars`} className={`text-4xl leading-none ${value <= (rating ?? 0) ? "text-[#c94d32]" : "text-[#d9d1c1]"}`}>★</button>)}</div></fieldset>
              <label className="text-sm font-semibold text-stone-800">Date watched<input type="date" value={movieFields.dateWatched} onChange={(event) => updateField("dateWatched", event.target.value)} className="mt-2 block w-full rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 font-normal outline-none focus:border-[#64844e]" /></label>
              <label className="text-sm font-semibold text-stone-800">Sum it up in one word<input value={movieFields.sumUpInOneWord} onChange={(event) => updateField("sumUpInOneWord", event.target.value)} placeholder="e.g. cozy" className="mt-2 block w-full rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 font-normal outline-none focus:border-[#64844e]" /></label>
              <label className="text-sm font-semibold text-stone-800">Where you watched it<input value={movieFields.whereWatched} onChange={(event) => updateField("whereWatched", event.target.value)} placeholder="e.g. cinema, Netflix" className="mt-2 block w-full rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 font-normal outline-none focus:border-[#64844e]" /></label>
            </div>
            <label className="mt-5 block text-sm font-semibold text-stone-800">Your review<textarea value={review} onChange={(event) => setReview(event.target.value)} rows={4} placeholder="What did you think?" className="mt-2 block w-full resize-none rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 font-normal outline-none focus:border-[#64844e]" /></label>
            <button type="button" onClick={() => setMoreNotesOpen((open) => !open)} className="mt-5 flex w-full items-center justify-between rounded-xl border border-[#e3dac9] px-4 py-3 text-left"><span><span className="font-semibold">More notes</span><span className="ml-2 text-sm text-stone-500">· optional</span></span><span className="text-xl">{moreNotesOpen ? "−" : "+"}</span></button>
            {moreNotesOpen && <div className="mt-3 grid gap-3 sm:grid-cols-2"><input value={movieFields.favoriteCharacter} onChange={(event) => updateField("favoriteCharacter", event.target.value)} placeholder="Favorite character" className="rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 outline-none focus:border-[#64844e]" /><input value={movieFields.leastFavoriteCharacter} onChange={(event) => updateField("leastFavoriteCharacter", event.target.value)} placeholder="Least favorite character" className="rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 outline-none focus:border-[#64844e]" /><input value={movieFields.quote} onChange={(event) => updateField("quote", event.target.value)} placeholder="Favorite quote" className="rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 outline-none focus:border-[#64844e]" /><input value={movieFields.bestMoment} onChange={(event) => updateField("bestMoment", event.target.value)} placeholder="Best moment" className="rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 outline-none focus:border-[#64844e]" /><input value={movieFields.worstMoment} onChange={(event) => updateField("worstMoment", event.target.value)} placeholder="Worst moment" className="rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 outline-none focus:border-[#64844e]" /></div>}
          </div>
        )}

        <footer className="flex items-center justify-between border-t border-[#e8e0d1] px-6 py-4 sm:px-8">
          {step === 2 ? <button type="button" onClick={() => setStep(1)} className="text-sm text-stone-700">← Back</button> : <span className="text-sm text-[#5e8048]">Poster, director & genre fill in for you</span>}
          {step === 2 && <div className="flex gap-2"><button type="button" disabled={isSaving} onClick={() => handleSave("to_watch")} className="rounded-full border border-[#d9cfbd] px-4 py-3 text-sm font-medium disabled:opacity-60">Save to Up next</button><button type="button" disabled={isSaving} onClick={() => handleSave("done")} className="rounded-full bg-[#5e8048] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? "Saving…" : "Shelve it ↗"}</button></div>}
        </footer>
      </div>
    </div>
  );
}

export default AddMovieModal;
