import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteItem, fetchItems, updateItem } from "../api";
import Navbar from "../components/Navbar";
import CompleteEntryModal from "../components/CompleteEntryModal";
import type { CompletionDatePayload } from "../components/CompletionDateField";
import type { Item } from "../types";

const posterBase = "https://image.tmdb.org/t/p/w342";

function Cover({ item }: { item: Item }) {
  const src = item.type === "movie" && item.posterPath ? posterBase + item.posterPath : item.type === "book" ? item.coverUrl : undefined;
  return src ? <img src={src} alt={`${item.title} cover`} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center bg-[#e6d6b9] p-2 text-center font-serif text-xs">{item.title}</div>;
}

function QueuePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [finishingItem, setFinishingItem] = useState<Item | null>(null);
  const [menuItem, setMenuItem] = useState<number | null>(null);
  const [removingItem, setRemovingItem] = useState<Item | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<Item | null>(null);
  const removalTimer = useRef<number | null>(null);

  useEffect(() => { fetchItems().then(setItems).catch(() => setError("Couldn't load your Queue. Is Flask running?")).finally(() => setLoading(false)); }, []);
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
  function confirmRemoval() {
    if (!removingItem) return;
    const removed = removingItem;
    setItems((current) => current.filter((item) => item.id !== removed.id));
    setRemovingItem(null); setMenuItem(null); setPendingRemoval(removed);
    removalTimer.current = window.setTimeout(async () => { try { await deleteItem(removed.id); } catch { setError("Could not remove this entry."); setItems((current) => [removed, ...current]); } finally { setPendingRemoval(null); } }, 6000);
  }
  function undoRemoval() {
    if (!pendingRemoval) return;
    if (removalTimer.current !== null) window.clearTimeout(removalTimer.current);
    setItems((current) => [pendingRemoval, ...current]); setPendingRemoval(null);
  }

  return <main className="min-h-screen bg-[#FBFAF7] text-[#352218]">
    <Navbar onAdd={() => navigate("/shelf", { state: { openAddForm: true } })} showForm={false} />
    <section className="mx-auto max-w-7xl px-6 pb-16 pt-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-hand text-lg text-[#b4442a]">栞 · saved for later</p><h1 className="mt-1 font-serif text-5xl sm:text-6xl">Queue <span className="font-sans text-xl text-[#806858]">{queued.length + inProgress.length}</span></h1></div><div className="rounded-full border border-[#dfcfba] bg-[#FFFFFF] px-4 py-3 text-xs text-[#60483a]"><span className="font-semibold">1 Queued</span><span className="mx-3 text-[#b99876]">→</span><span className="font-semibold">2 In progress</span><span className="mx-3 text-[#b99876]">→</span><span className="font-semibold">3 In collection</span></div></div>
      {error && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {finishingItem && <CompleteEntryModal item={finishingItem} onClose={() => setFinishingItem(null)} onComplete={(rating, review, date) => complete(finishingItem, rating, review, date)} />}
      {removingItem && <RemoveDialog item={removingItem} onCancel={() => setRemovingItem(null)} onConfirm={confirmRemoval} />}
      {loading ? <p className="py-20 text-center text-sm text-[#806858]">Loading your queue…</p> : <>
        <section className="mt-10"><SectionTitle title="In progress" count={inProgress.length} note="entries you left open while you were still with them" />
          <div className="mt-4 space-y-4">{inProgress.map((item) => <ProgressCard key={item.id} item={item} busy={updating === item.id} onFinish={() => setFinishingItem(item)} onOpen={() => navigate(`/item/${item.id}`)} menuOpen={menuItem === item.id} onMenu={() => setMenuItem(menuItem === item.id ? null : item.id)} onRemove={() => setRemovingItem(item)} />)}</div>
          {!inProgress.length && <Empty copy="Nothing is in progress right now. Start something from your queue when you’re ready." />}
        </section>
        <section className="mt-12"><SectionTitle title="Queued" count={queued.length} note="pick up what calls to you next" />
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{queued.map((item) => <QueueCard key={item.id} item={item} busy={updating === item.id} onStart={() => changeStatus(item, "in_progress")} onOpen={() => navigate(`/item/${item.id}`)} menuOpen={menuItem === item.id} onMenu={() => setMenuItem(menuItem === item.id ? null : item.id)} onRemove={() => setRemovingItem(item)} />)}</div>
          {!queued.length && <Empty copy="Your queue is clear. Add a title to save it for later." />}
        </section>
      </>}
    </section>
    {pendingRemoval && <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-5 rounded-full bg-[#352218] px-6 py-4 text-sm text-[#fff5df] shadow-xl">Removed {pendingRemoval.title} from your Queue <button onClick={undoRemoval} className="rounded-full bg-[#fff2da] px-4 py-2 font-semibold text-[#352218]">Undo</button></div>}
  </main>;
}

function SectionTitle({ title, count, note }: { title: string; count: number; note: string }) { return <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#806858] pb-2"><h2 className="font-serif text-3xl">{title} <span className="font-sans text-sm text-[#806858]">{count}</span></h2><p className="text-sm text-[#806858]">{note}</p></div>; }
function Empty({ copy }: { copy: string }) { return <p className="rounded-xl border border-dashed border-[#d9cbb9] px-5 py-8 text-center text-sm text-[#806858]">{copy}</p>; }
function QueueMenu({ open, onToggle, onFinish, onRemove }: { open: boolean; onToggle: () => void; onFinish?: () => void; onRemove: () => void }) { return <div className="relative"><button type="button" onClick={onToggle} aria-label="Entry menu" className="grid h-10 w-10 place-items-center rounded-full border border-[#d9cbb9] text-xl">⋯</button>{open && <div className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-xl border border-[#e0d1bd] bg-white shadow-xl">{onFinish && <button onClick={onFinish} className="block w-full px-4 py-3 text-left text-sm hover:bg-[#fbf4ea]">▸ &nbsp; Mark as finished</button>}<button onClick={onRemove} className="block w-full border-t border-[#eadfce] px-4 py-3 text-left text-sm font-semibold text-[#b4442a] hover:bg-[#fff6f2]">× &nbsp; Remove from Queue</button></div>}</div>; }
function ProgressCard({ item, busy, onFinish, onOpen, menuOpen, onMenu, onRemove }: { item: Item; busy: boolean; onFinish: () => void; onOpen: () => void; menuOpen: boolean; onMenu: () => void; onRemove: () => void }) { const source = item.type === "movie" ? item.whereWatched || item.director : item.author; return <article className="flex flex-wrap items-center gap-4 rounded-xl border border-[#e7d8c6] border-b-4 border-b-[#4a2c1c] bg-[#FFFFFF] p-4"><button type="button" onClick={onOpen} className="h-28 w-20 shrink-0 overflow-hidden rounded-md bg-[#e6d6b9]"><Cover item={item} /></button><button type="button" onClick={onOpen} className="min-w-48 flex-1 text-left"><p className="text-[10px] uppercase tracking-[.16em] text-[#806858]">{item.type === "movie" ? item.mediaType === "series" ? "Series" : "Movie" : "Book"} · in progress</p><h3 className="mt-1 font-serif text-2xl leading-tight">{item.title}</h3><p className="mt-2 text-sm text-[#806858]">{source || "Saved to finish later"}</p></button><div className="ml-auto flex gap-2"><button type="button" onClick={onOpen} className="rounded-full border border-[#d9cbb9] px-4 py-2.5 text-sm">Open entry</button><button type="button" disabled={busy} onClick={onFinish} className="rounded-full bg-[#b4442a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : "Finished ✓"}</button><QueueMenu open={menuOpen} onToggle={onMenu} onFinish={onFinish} onRemove={onRemove} /></div></article>; }
function QueueCard({ item, busy, onStart, onOpen, menuOpen, onMenu, onRemove }: { item: Item; busy: boolean; onStart: () => void; onOpen: () => void; menuOpen: boolean; onMenu: () => void; onRemove: () => void }) { return <article className="flex gap-4 rounded-xl border border-[#e7d8c6] bg-[#FFFFFF] p-4"><button type="button" onClick={onOpen} className="h-24 w-16 shrink-0 overflow-hidden rounded bg-[#e6d6b9]"><Cover item={item} /></button><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-[.16em] text-[#806858]">{item.type === "movie" ? item.mediaType === "series" ? "Series" : "Movie" : "Book"}</p><button type="button" onClick={onOpen} className="mt-1 text-left font-serif text-xl leading-tight">{item.title}</button><p className="mt-1 truncate text-xs text-[#806858]">{item.type === "movie" ? item.director || item.genre : item.author}</p><div className="mt-3 flex items-center justify-between"><button type="button" disabled={busy} onClick={onStart} className="rounded-full bg-[#4a2c1c] px-4 py-2 text-sm text-white disabled:opacity-60">{busy ? "Starting…" : "Start ›"}</button><QueueMenu open={menuOpen} onToggle={onMenu} onRemove={onRemove} /></div></div></article>; }
function RemoveDialog({ item, onCancel, onConfirm }: { item: Item; onCancel: () => void; onConfirm: () => void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/45 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" className="w-full max-w-lg overflow-hidden rounded-2xl bg-[#FBFAF7] shadow-2xl"><div className="h-3 bg-[repeating-linear-gradient(90deg,#62361f_0_68px,#4d2a1a_68px_136px)]" /><div className="p-7"><h2 className="font-serif text-3xl">Remove “{item.title}” from your Queue?</h2><p className="mt-4 text-sm text-[#654a39]">This can&apos;t be undone once the Undo window closes. You&apos;ll lose any saved notes for this entry.</p><div className="mt-4 rounded-xl bg-[#f5ebdb] p-4 text-sm text-[#654a39]">• Your review, quote & moments<br />• Any logged viewings<br />• Its place in your Yearbook stats</div><footer className="mt-7 flex justify-end gap-3"><button onClick={onCancel} className="rounded-full border border-[#d5bfa5] px-5 py-3">Keep it</button><button onClick={onConfirm} className="rounded-full bg-[#b4442a] px-5 py-3 font-semibold text-white">Remove from Queue</button></footer></div></section></div>; }

export default QueuePage;
