import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchItems } from "../api";
import Navbar from "../components/Navbar";
import type { Item } from "../types";

const posterBase = "https://image.tmdb.org/t/p/w342";

function Cover({ item }: { item: Item }) {
  const src = item.type === "movie" && item.posterPath ? posterBase + item.posterPath : item.type === "book" ? item.coverUrl : undefined;
  return src ? <img src={src} alt={item.title + " cover"} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center bg-[#e6d6b9] p-2 text-center font-serif text-sm">{item.title}</div>;
}

function HomePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { fetchItems().then(setItems).catch(() => setItems([])); }, []);
  const recent = items.slice(0, 6);
  const nightstand = items.filter((item) => item.status === "queued" || item.status === "in_progress").slice(0, 3);
  const rated = items.filter((item) => item.rating !== null);
  const average = rated.length ? (rated.reduce((sum, item) => sum + (item.rating ?? 0), 0) / rated.length).toFixed(1) : "—";

  return <main className="min-h-screen bg-[#fbf2e5] text-[#352218]">
    <Navbar onAdd={() => navigate("/shelf", { state: { openAddForm: true } })} showForm={false} />
    <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:px-10">
      <div className="max-w-xl">
        <p className="font-hand text-lg tracking-wide text-[#b4442a]">welcome in — stay a while, the kettle&apos;s on</p>
        <h1 className="mt-6 font-serif text-5xl leading-[.96] tracking-tight sm:text-6xl lg:text-7xl">Every story I&apos;ve collected, each with its own shelf.</h1>
        <p className="mt-6 max-w-md text-base leading-7 text-[#60483a]">I have a slight obsession: I can&apos;t finish a film or a book without writing something down. A line I loved, a character I couldn&apos;t stand, one word for how it felt. This is where those notes live, kept like little collectibles.</p>
        <p className="mt-6 font-hand text-lg italic">— chesca</p>
        
        <div className="mt-6 grid max-w-md grid-cols-4 gap-3">
          <Stat value={String(items.length)} label="collected in 2026" /><Stat value={String(items.filter((i) => i.type === "movie").length) + " / " + String(items.filter((i) => i.type === "book").length)} label="films / books" /><Stat value={average + "★"} label="average" /><Stat value={String(items.filter((i) => i.status === "done").length)} label="rewatched" />
        </div>
      </div>
      <div>
        <div>
          <div className="grid grid-cols-3 gap-5">{recent.slice(0, 3).map((item, index) => <ShelfItem item={item} key={item.id} index={index} />)}</div>
          <div className="mt-9 grid grid-cols-3 gap-5">{recent.slice(3, 6).map((item, index) => <ShelfItem item={item} key={item.id} index={index + 3} />)}</div>
        </div>
        <div className="mt-3 flex justify-between text-sm text-[#806858]"><span>Recently added</span><button type="button" onClick={() => navigate("/shelf")} className="text-[#a13e27] underline">See the whole shelf →</button></div>
      </div>
    </section>
    <section id="nightstand" className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
      <div className="flex items-end justify-between border-b border-[#8c7766] pb-2"><h2 className="font-serif text-3xl">On the nightstand <span className="ml-2 font-sans text-sm font-normal text-[#806858]">not shelved yet</span></h2><button type="button" onClick={() => navigate("/nightstand")} className="text-sm text-[#a13e27] underline">See all →</button></div>
      <div className="mt-4 grid gap-5 md:grid-cols-3">{nightstand.map((item) => <Nightstand item={item} key={item.id} />)}</div>
    </section>
  </main>;
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="rounded-md bg-[#4a2c1c] px-3 py-3 text-[#fff2da]"><p className="font-serif text-3xl leading-none">{value}</p><p className="mt-1 text-xs leading-4 text-[#e7caa4]">{label}</p></div>; }
function ShelfItem({ item, index }: { item: Item; index: number }) {
  const labels = ["magical", "cozy", "tender", "iconic", "dreamy", "witty"];
  return <article>
    <div className="relative aspect-[.72] overflow-hidden rounded-sm border border-[#d9cbb9] bg-[#f8eddb]">
      <span className="absolute -top-7 left-1/2 h-8 w-1 -translate-x-1/2 rotate-6 bg-[#8f684b]" />
      {index === 0 && <span className="absolute -left-3 -top-3 grid h-8 w-8 place-items-center rounded-full bg-[#b4442a] text-xs text-white">栞</span>}
      <span className="absolute right-2 top-2 z-10 -rotate-6 rounded bg-[#fff7df] px-2 py-1 font-hand text-[10px] text-[#704d32] shadow">{labels[index]}</span>
      <Cover item={item} />
    </div>
    <div className="h-2 border-y border-[#2d1a11] bg-[#593522] shadow-[0_5px_6px_-4px_rgba(54,31,18,.9)]" />
    <div className="min-h-22 px-1 pt-3 text-[#352218]"><div className="flex gap-2"><h3 className="line-clamp-2 flex-1 font-serif text-base leading-5">{item.title}</h3><span className="text-[10px] text-[#806858]">{item.releaseYear}</span></div><p className="mt-1 text-xs text-[#806858]">{item.type === "movie" ? "Movie" : "Book"}</p><p className="text-sm text-[#b4442a]">{"★".repeat(item.rating ?? 0)}{"☆".repeat(5 - (item.rating ?? 0))}</p></div>
  </article>;
}
function Nightstand({ item }: { item: Item }) { const detail = item.type === "movie" ? item.director || item.genre : "On your watchlist"; return <article className="flex min-h-34 gap-4 rounded-lg border border-[#e7d8c6] border-b-4 border-b-[#4a2c1c] bg-[#fff8ef] p-3"><div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-[#e6d6b9]"><Cover item={item} /></div><div className="min-w-0"><p className="text-[10px] uppercase tracking-[.16em] text-[#806858]">Film · queued to watch</p><h3 className="mt-1 font-serif text-lg leading-5">{item.title}</h3><p className="mt-1 text-xs text-[#806858]">{detail || "On your watchlist"}</p></div></article>; }
export default HomePage;
