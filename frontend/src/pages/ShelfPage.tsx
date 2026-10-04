import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createItem, deleteItem, fetchItems, updateItem } from "../api";
import AddMovieModal from "../components/AddMovieModal";
import FilterTabs, { type FilterType } from "../components/FilterTabs";
import ItemCard from "../components/ItemCard";
import Navbar from "../components/Navbar";
import StatsBar from "../components/StatsBar";
import type { Item } from "../types";

function ShelfPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [showForm, setShowForm] = useState(false);

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

  async function handleMarkDone(id: number) {
    try {
      await updateItem(id, { status: "done" });
      setItems((current) => current.map((item) => item.id === id ? { ...item, status: "done" } : item));
    } catch { setError("Could not update item."); }
  }

  async function handleDelete(id: number) {
    try {
      await deleteItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch { setError("Could not delete item."); }
  }

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "books") return item.type === "book";
    if (filter === "movies") return item.type === "movie";
    return item.status === filter;
  });
  const finished = items.filter((item) => item.status === "done").length;
  const ratings = items.flatMap((item) => item.rating === null ? [] : [item.rating]);
  const avgRating = ratings.length ? (ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1) : "—";

  return (
    <div className="min-h-screen bg-stone-100 p-6 font-sans">
      <Navbar onAdd={() => setShowForm(true)} showForm={showForm} />
      <div className="mx-auto max-w-3xl">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        {showForm && <AddMovieModal onClose={() => setShowForm(false)} onSave={handleAdd} />}
        <StatsBar total={items.length} finished={finished} avgRating={avgRating} />
        <FilterTabs current={filter} onChange={setFilter} />
        {loading ? <div className="py-16 text-center text-sm text-gray-400">Loading your shelf...</div> : <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
            {filtered.map((item) => <ItemCard key={item.id} item={item} onMarkDone={handleMarkDone} onDelete={handleDelete} onClick={() => navigate(`/item/${item.id}`)} />)}
          </div>
          {!filtered.length && <div className="py-16 text-center text-sm text-gray-400">Nothing here yet.</div>}
        </>}
      </div>
    </div>
  );
}

export default ShelfPage;
