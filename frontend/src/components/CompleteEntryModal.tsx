import { useState } from "react";
import type { Item } from "../types";
import { CompletionDateField, completionDatePayload, todayForInput, type CompletionDate, type CompletionDatePayload } from "./CompletionDateField";

type Props = {
  item: Item;
  onClose: () => void;
  onComplete: (rating: number, review: string, date: CompletionDatePayload) => Promise<void>;
};

function CompleteEntryModal({ item, onClose, onComplete }: Props) {
  const [rating, setRating] = useState<number | null>(item.rating);
  const [review, setReview] = useState(item.review);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState<CompletionDate>(() => ({ precision: "exact", exactDate: item.completedDatePrecision === "exact" && item.completedYear && item.completedMonth && item.completedDay ? `${item.completedYear}-${String(item.completedMonth).padStart(2, "0")}-${String(item.completedDay).padStart(2, "0")}` : todayForInput(), month: item.completedYear && item.completedMonth ? `${item.completedYear}-${String(item.completedMonth).padStart(2, "0")}` : "", year: item.completedYear?.toString() ?? "" }));

  async function submit() {
    if (!rating || !review.trim()) {
      setError("Add a rating and a review before placing this on the shelf.");
      return;
    }
    setSaving(true); setError("");
    if ((date.precision === "exact" && !date.exactDate) || (date.precision === "month" && !date.month) || (date.precision === "year" && !date.year)) {
      setError("Choose the date details you remember.");
      return;
    }
    try { await onComplete(rating, review.trim(), completionDatePayload(date)); }
    catch { setError("Could not place this on the shelf. Please try again."); setSaving(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="complete-entry-title">
    <div className="w-full max-w-xl rounded-[22px] bg-[#fffcf6] p-6 text-[#352218] shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-4"><div><p className="font-hand text-sm text-[#b4442a]">one last thought before it reaches the shelf</p><h2 id="complete-entry-title" className="mt-1 font-serif text-3xl">How was {item.title}?</h2></div><button type="button" onClick={onClose} aria-label="Close completion form" className="grid h-10 w-10 place-items-center rounded-full border border-[#d9cfbd] text-2xl font-light">×</button></div>
      <fieldset className="mt-7"><legend className="text-sm font-semibold">Rating <span className="text-[#b4442a]">*</span></legend><div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} stars`} className={`text-4xl leading-none ${value <= (rating ?? 0) ? "text-[#b4442a]" : "text-[#d9d1c1]"}`}>★</button>)}</div></fieldset>
      <label className="mt-6 block text-sm font-semibold">Your review <span className="text-[#b4442a]">*</span><textarea autoFocus value={review} onChange={(event) => setReview(event.target.value)} rows={5} placeholder="What did you think?" className="mt-2 block w-full resize-none rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 font-normal outline-none focus:border-[#64844e]" /></label>
      <CompletionDateField value={date} onChange={setDate} />
      {error && <p className="mt-3 text-sm text-[#b44934]">{error}</p>}
      <footer className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={onClose} disabled={saving} className="rounded-full border border-[#d9cfbd] px-5 py-3 text-sm">Keep in Queue</button><button type="button" disabled={saving} onClick={submit} className="rounded-full bg-[#b4442a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Placing…" : "Add to collection ↗"}</button></footer>
    </div>
  </div>;
}

export default CompleteEntryModal;
