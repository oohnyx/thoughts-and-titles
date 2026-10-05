export type CompletionDatePrecision = "exact" | "month" | "year" | "unknown";

export type CompletionDate = {
  precision: CompletionDatePrecision;
  exactDate: string;
  month: string;
  year: string;
};

export type CompletionDatePayload = {
  completedDatePrecision: CompletionDatePrecision;
  completedYear?: number;
  completedMonth?: number;
  completedDay?: number;
};

export function todayForInput() {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function completionDatePayload(value: CompletionDate): CompletionDatePayload {
  if (value.precision === "exact" && value.exactDate) {
    const [year, month, day] = value.exactDate.split("-").map(Number);
    return { completedDatePrecision: "exact", completedYear: year, completedMonth: month, completedDay: day };
  }
  if (value.precision === "month" && value.month) {
    const [year, month] = value.month.split("-").map(Number);
    return { completedDatePrecision: "month", completedYear: year, completedMonth: month };
  }
  if (value.precision === "year" && value.year) return { completedDatePrecision: "year", completedYear: Number(value.year) };
  return { completedDatePrecision: "unknown" };
}

export function CompletionDateField({ value, onChange, label = "When did you finish it?" }: { value: CompletionDate; onChange: (value: CompletionDate) => void; label?: string }) {
  return <fieldset className="mt-6"><legend className="text-sm font-semibold">{label} <span className="text-[#b4442a]">*</span></legend><p className="mt-1 text-xs font-normal text-stone-500">Choose the level of detail you remember.</p><div className="mt-3 flex flex-wrap gap-2">{(["exact", "month", "year", "unknown"] as const).map((precision) => <button key={precision} type="button" onClick={() => onChange({ ...value, precision })} className={`rounded-full border px-3 py-2 text-sm ${value.precision === precision ? "border-[#64844e] bg-[#edf2e5] font-semibold text-[#486833]" : "border-[#d9cfbd]"}`}>{precision === "exact" ? "Exact date" : precision === "month" ? "Month & year" : precision === "year" ? "Year only" : "I don’t remember"}</button>)}</div>
    {value.precision === "exact" && <input type="date" value={value.exactDate} onChange={(event) => onChange({ ...value, exactDate: event.target.value })} className="mt-3 block w-full rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 outline-none focus:border-[#64844e]" />}
    {value.precision === "month" && <input type="month" value={value.month} onChange={(event) => onChange({ ...value, month: event.target.value })} className="mt-3 block w-full rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 outline-none focus:border-[#64844e]" />}
    {value.precision === "year" && <input type="number" min="1" max="9999" inputMode="numeric" value={value.year} onChange={(event) => onChange({ ...value, year: event.target.value })} placeholder="e.g. 2021" className="mt-3 block w-full rounded-xl border border-[#d9cfbd] bg-white px-3 py-3 outline-none focus:border-[#64844e]" />}
  </fieldset>;
}
