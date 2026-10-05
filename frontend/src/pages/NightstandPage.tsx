import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchItems, updateItem } from "../api";
import Navbar from "../components/Navbar";
import CompleteEntryModal from "../components/CompleteEntryModal";
import type { CompletionDatePayload } from "../components/CompletionDateField";
import type { Item } from "../types";

const posterBase = "https://image.tmdb.org/t/p/w342";

function Cover({ item }: { item: Item }) {
  const src = item.type === "movie" && item.posterPath ? posterBase + item.posterPath : item.type === "book" ? item.coverUrl : undefined;
  return src ? <img src={src} alt={`${item.title} cover`} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center bg-[#e6d6b9] p-2 text-center font-serif text-xs">{item.title}</div>;
}

function NightstandPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [finishingItem, setFinishingItem] = useState<Item | null>(null);

  useEffect(() => { fetchItems().then(setItems).catch(() => setError("Couldn't load your Nightstand. Is Flask running?")).finally(() => setLoading(false)); }, []);
  const queued = items.filter((item) => item.status === "queued");
  const inProgress = items.filter((item) => item.status === "in_progress");

  async function changeStatus(item: Item, status: Item["status"]) {
    setUpdating(item.id); setError("");
    try {
      const saved = await updateItem(item.id, { status });
      setItems((current) => current.map((entry) => entry.id === saved.id ? saved : entry));
    } catch { setError("Could not update this entry. Please try again."); }
    finally { setUpdating(null); }
  }

  async function complete(item: Item, rating: number, review: string, date: CompletionDatePayload) {
    const saved = await updateItem(item.id, { status: "done", rating, review, ...date });
    setItems((current) => current.map((entry) => entry.id === saved.id ? saved : entry));
    setFinishingItem(null);
    navigate(`/item/${item.id}`);
  }

  return <main className="min-h-screen bg-[#fbf2e5] text-[#352218]">
    <Navbar onAdd={() => navigate("/shelf", { state: { openAddForm: true } })} showForm={false} />
    <section className="mx-auto max-w-7xl px-6 pb-16 pt-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-hand text-lg text-[#b4442a]">栞 · not shelved yet</p><h1 className="mt-1 font-serif text-5xl sm:text-6xl">Nightstand <span className="font-sans text-xl text-[#806858]">{queued.length + inProgress.length}</span></h1></div><div className="rounded-full border border-[#dfcfba] bg-[#fff9f0] px-4 py-3 text-xs text-[#60483a]"><span className="font-semibold">1 Queued</span><span className="mx-3 text-[#b99876]">→</span><span className="font-semibold">2 In progress</span><span className="mx-3 text-[#b99876]">→</span><span className="font-semibold">3 Shelved</span></div></div>
      {error && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {finishingItem && <CompleteEntryModal item={finishingItem} onClose={() => setFinishingItem(null)} onComplete={(rating, review, date) => complete(finishingItem, rating, review, date)} />}
      {loading ? <p className="py-20 text-center text-sm text-[#806858]">Loading your nightstand…</p> : <>
        <section className="mt-10"><SectionTitle title="In progress" count={inProgress.length} note="entries you left open while you were still with them" />
          <div className="mt-4 space-y-4">{inProgress.map((item) => <ProgressCard key={item.id} item={item} busy={updating === item.id} onFinish={() => setFinishingItem(item)} onOpen={() => navigate(`/item/${item.id}`)} />)}</div>
          {!inProgress.length && <Empty copy="Nothing is in progress right now. Start something from your queue when you’re ready." />}
        </section>
        <section className="mt-12"><SectionTitle title="Queued" count={queued.length} note="pick up what calls to you next" />
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{queued.map((item) => <QueueCard key={item.id} item={item} busy={updating === item.id} onStart={() => changeStatus(item, "in_progress")} onOpen={() => navigate(`/item/${item.id}`)} />)}</div>
          {!queued.length && <Empty copy="Your queue is clear. Add a title to save it for later." />}
        </section>
      </>}
    </section>
  </main>;
}

function SectionTitle({ title, count, note }: { title: string; count: number; note: string }) { return <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#806858] pb-2"><h2 className="font-serif text-3xl">{title} <span className="font-sans text-sm text-[#806858]">{count}</span></h2><p className="text-sm text-[#806858]">{note}</p></div>; }
function Empty({ copy }: { copy: string }) { return <p className="rounded-xl border border-dashed border-[#d9cbb9] px-5 py-8 text-center text-sm text-[#806858]">{copy}</p>; }
function ProgressCard({ item, busy, onFinish, onOpen }: { item: Item; busy: boolean; onFinish: () => void; onOpen: () => void }) { const source = item.type === "movie" ? item.whereWatched || item.director : item.author; return <article className="flex flex-wrap items-center gap-4 rounded-xl border border-[#e7d8c6] border-b-4 border-b-[#4a2c1c] bg-[#fffaf2] p-4"><button type="button" onClick={onOpen} className="h-28 w-20 shrink-0 overflow-hidden rounded-md bg-[#e6d6b9]"><Cover item={item} /></button><button type="button" onClick={onOpen} className="min-w-48 flex-1 text-left"><p className="text-[10px] uppercase tracking-[.16em] text-[#806858]">{item.type === "movie" ? item.mediaType === "series" ? "Series" : "Movie" : "Book"} · in progress</p><h3 className="mt-1 font-serif text-2xl leading-tight">{item.title}</h3><p className="mt-2 text-sm text-[#806858]">{source || "Saved to finish later"}</p></button><div className="ml-auto flex gap-2"><button type="button" onClick={onOpen} className="rounded-full border border-[#d9cbb9] px-4 py-2.5 text-sm">Open entry</button><button type="button" disabled={busy} onClick={onFinish} className="rounded-full bg-[#b4442a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : "Finished ✓"}</button></div></article>; }
function QueueCard({ item, busy, onStart, onOpen }: { item: Item; busy: boolean; onStart: () => void; onOpen: () => void }) { return <article className="flex gap-4 rounded-xl border border-[#e7d8c6] bg-[#fffaf2] p-4"><button type="button" onClick={onOpen} className="h-24 w-16 shrink-0 overflow-hidden rounded bg-[#e6d6b9]"><Cover item={item} /></button><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-[.16em] text-[#806858]">{item.type === "movie" ? item.mediaType === "series" ? "Series" : "Movie" : "Book"}</p><button type="button" onClick={onOpen} className="mt-1 text-left font-serif text-xl leading-tight">{item.title}</button><p className="mt-1 truncate text-xs text-[#806858]">{item.type === "movie" ? item.director || item.genre : item.author}</p><button type="button" disabled={busy} onClick={onStart} className="mt-3 rounded-full bg-[#4a2c1c] px-4 py-2 text-sm text-white disabled:opacity-60">{busy ? "Starting…" : "Start ›"}</button></div></article>; }

export default NightstandPage;
