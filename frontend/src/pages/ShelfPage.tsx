import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import StatsBar from "../components/StatsBar";
import FilterTabs from "../components/FilterTabs";
import ItemCard from "../components/ItemCard";
import { useNavigate } from "react-router-dom"; // NEW — lets us navigate to another page
import type { FilterType } from "../components/FilterTabs";
import type { Item } from "../types";
import { fetchItems, createItem, deleteItem, updateItem } from "../api"; // import API functions

function ShelfPage() {
  const navigate = useNavigate(); // gives us a function to jump to a different URL

  const [items, setItems] = useState<Item[]>([]); // start empty, will load from Flask
  const [loading, setLoading] = useState(true); // true while waiting for Flask
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<FilterType>("all");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"book" | "movie">("movie");
  const [newDesc, setNewDesc] = useState("");

  // LOAD ITEMS FROM FLASK ON PAGE LOAD

  useEffect(() => {
    // useEffect itself can't be async directly, so we define an async function inside and call it
    async function loadItems() {
      try {
        const data = await fetchItems(); // call API helper
        setItems(data); // put real items into state
      } catch {
        setError("Couldn't load items. Is Flask running?");
      } finally {
        setLoading(false); // whether it worked or not, done loading
      } // "finally" always runs, like a no matter what block
    }

    loadItems(); // call it immediately
  }, []); // empty [] = run once when component mounts

  // ADD ITEM

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await createItem({
        title: newTitle,
        type: newType,
        description: newDesc,
      });

      // Flask returns new item with its real database ID
      // add it to top of list

      setItems([created, ...items]);
      setNewTitle("");
      setNewType("movie");
      setNewDesc("");
      setShowForm(false);
    } catch {
      setError("Could not add item.");
    }
  }

  // MARK DONE

  async function handleMarkDone(id: number) {
    try {
      await updateItem(id, { status: "done" }); // tell Flask to update
      setItems(items.map((i) => (i.id === id ? { ...i, status: "done" } : i)));
    } catch {
      setError("Could not update item.");
    }
  }

  // DELETE ITEM

  async function handleDelete(id: number) {
    try {
      await deleteItem(id); // tell Flask to delete
      setItems(items.filter((i) => i.id !== id)); // remove from local state
    } catch {
      setError("Could not delete item.");
    }
  }

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "books") return item.type === "book";
    if (filter === "movies") return item.type === "movie";
    if (filter === "done") return item.status === "done";
    if (filter === "to_watch") return item.status === "to_watch";
    return true;
  });

  const total = items.length;
  const finished = items.filter((i) => i.status === "done").length;
  const ratings = items
    .filter((i) => i.rating !== null)
    .map((i) => i.rating as number);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-stone-100 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <Navbar onAdd={() => setShowForm(!showForm)} showForm={showForm} />

        {/* error banner — only shows if something went wrong */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="bg-white border border-stone-200 rounded-xl p-4 mb-6 flex flex-col gap-3"
          >
            <input
              type="text"
              placeholder="Title (e.g. Inception, Dune...)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as "book" | "movie")}
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="movie">Movie</option>
              <option value="book">Book</option>
            </select>
            <textarea
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Add to shelf
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm px-4 py-2 rounded-lg border border-stone-200 text-gray-500 hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <StatsBar total={total} finished={finished} avgRating={avgRating} />
        <FilterTabs current={filter} onChange={setFilter} />

        {/* loading state — shows while waiting for Flask */}
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-16">
            Loading your shelf...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onMarkDone={handleMarkDone}
                  onDelete={handleDelete}
                  onClick={() => navigate(`/item/${item.id}`)}
                  // navigate() changes the URL — React Router shows DetailPage automatically
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-16">
                Nothing here yet.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ShelfPage;
