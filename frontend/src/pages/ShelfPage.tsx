import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createItem, fetchItems } from "../api";
import AddMovieModal from "../components/AddMovieModal";
import { FilmMetadata, FilmPoster } from "../components/FilmShelfCard";
import Navbar from "../components/Navbar";
import type { Item, MovieEntry } from "../types";

function ShelfPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "to_watch" | "done">("all");
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mediaFilter, setMediaFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("Any");

  useEffect(() => {
    async function loadItems() {
      try { setItems(await fetchItems()); }
      catch { setError("Couldn't load items. Is Flask running?"); }
      finally { setLoading(false); }
    }
    loadItems();
  }, []);

  async function handleAdd(data: Parameters<typeof createItem>[0]) {
    try {
      const created = await createItem(data);
      setItems((current) => [created, ...current]);
      setShowForm(false);
    } catch {
      setError("Could not add item.");
      throw new Error("Could not add item.");
    }
  }

  const filtered = items.filter((item) => {
    if (item.type !== "movie") return false;
    if (filter !== "all" && item.status !== filter) return false;
    if (mediaFilter === "Movies only" && (item.mediaType ?? "movie") !== "movie") return false;
    if (mediaFilter === "Series only" && item.mediaType !== "series") return false;
    if (yearFilter !== "All") {
      const year = item.releaseYear;
      if (!year) return false;
      if (yearFilter === "Earlier" ? year >= 2024 : year !== Number(yearFilter)) return false;
    }
    if (genreFilter !== "All" && !(item.genre ?? "").toLowerCase().includes(genreFilter.toLowerCase())) return false;
    const rating = item.rating ?? 0;
    if (ratingFilter === "5 stars" && rating !== 5) return false;
    if (ratingFilter === "4+ stars" && rating < 4) return false;
    if (ratingFilter === "Unrated" && rating !== 0) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#fbf2e5] font-sans">
      <Navbar onAdd={() => setShowForm(true)} showForm={showForm} />
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        {showForm && <AddMovieModal onClose={() => setShowForm(false)} onSave={handleAdd} />}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="font-hand text-sm text-[#b4442a]">映画 · watched &amp; kept</p><h1 className="mt-1 font-serif text-5xl">Films <span className="text-xl text-[#806858]">{items.filter((item) => item.type === "movie").length}</span></h1></div><div className="flex flex-wrap gap-2 text-xs text-[#4b382b]"><FilterMenu label="Type" options={["All", "Movies only", "Series only"]} value={mediaFilter} onChange={setMediaFilter} openFilter={openFilter} setOpenFilter={setOpenFilter} /><FilterMenu label="Year" options={["All", "2026", "2025", "2024", "Earlier"]} value={yearFilter} onChange={setYearFilter} openFilter={openFilter} setOpenFilter={setOpenFilter} /><FilterMenu label="Genre" options={["All", "Comedy", "Drama", "Romance", "Animation"]} value={genreFilter} onChange={setGenreFilter} openFilter={openFilter} setOpenFilter={setOpenFilter} /><FilterMenu label="Rating" options={["Any", "5 stars", "4+ stars", "Unrated"]} value={ratingFilter} onChange={setRatingFilter} openFilter={openFilter} setOpenFilter={setOpenFilter} /><button type="button" onClick={() => setFilter(filter === "to_watch" ? "all" : "to_watch")} className="rounded-full border border-[#d9cbb9] px-3 py-2 transition hover:bg-[#f1e6d7]">{filter === "to_watch" ? "✓ " : "□ "}Rewatched</button></div></div>
        {loading ? <div className="py-16 text-center text-sm text-gray-400">Loading your shelf...</div> : <>
          <div className="space-y-10">{Array.from({ length: Math.ceil(filtered.length / 4) }, (_, row) => { const rowItems = filtered.slice(row * 4, row * 4 + 4); return <div key={row}><div className="grid grid-cols-2 gap-x-5 sm:grid-cols-3 lg:grid-cols-4">{rowItems.map((item, index) => <FilmPoster key={item.id} item={item as MovieEntry} index={row * 4 + index} onClick={() => navigate(`/item/${item.id}`)} />)}</div><div className="-mx-2 h-3 border-y-2 border-[#2d1a11] bg-[#593522] shadow-[0_6px_7px_-4px_rgba(54,31,18,.9)]" /><div className="grid grid-cols-2 gap-x-5 sm:grid-cols-3 lg:grid-cols-4">{rowItems.map((item) => <FilmMetadata key={item.id} item={item as MovieEntry} onClick={() => navigate(`/item/${item.id}`)} />)}</div></div>; })}</div>
          {!filtered.length && <div className="py-16 text-center text-sm text-gray-400">Nothing here yet.</div>}
        </>}
      </div>
    </div>
  );
}

function FilterMenu({
  label,
  options,
  value,
  onChange,
  openFilter,
  setOpenFilter,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  openFilter: string | null;
  setOpenFilter: (label: string | null) => void;
}) {
  const open = openFilter === label;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpenFilter(label)}
      onMouseLeave={() => setOpenFilter(null)}
    >
      <button
        type="button"
        onClick={() => setOpenFilter(open ? null : label)}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#d9cbb9] px-3 py-2 transition hover:bg-[#f1e6d7]"
      >
        <span>{label} · {value}</span>

        <span className="flex h-4 w-4 items-center justify-center text-[#806858]">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="h-3 w-3"
            aria-hidden="true"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 pt-2">
          <div className="w-40 overflow-hidden rounded-xl border border-[#d9cbb9] bg-[#fff8ef] p-1 shadow-lg">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpenFilter(null);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left transition hover:bg-[#f1e6d7]"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ShelfPage;
