import type { MovieEntry } from "../types";

const posterBase = "https://image.tmdb.org/t/p/w342";
const labels = ["magical", "cozy", "tender", "iconic", "dreamy", "witty", "sunny", "bright", "home", "wonder", "warm", "sisters"];

export function FilmPoster({ item, index, onClick }: { item: MovieEntry; index: number; onClick: () => void }) {
  const src = item.posterPath ? posterBase + item.posterPath : undefined;
  return <button type="button" onClick={onClick} className="min-w-0 text-left">
    <div className="relative aspect-[.69] overflow-hidden rounded-sm border border-[#d9cbb9] bg-[#f8eddb]">
      <span className="absolute -top-7 left-1/2 z-10 h-8 w-1 -translate-x-1/2 rotate-6 bg-[#8f684b]" />
      {index % 4 === 0 && <span className="absolute -left-2 -top-2 z-20 grid h-7 w-7 place-items-center rounded-full bg-[#b4442a] font-serif text-xs text-white">再</span>}
      <span className="absolute right-2 top-2 z-20 -rotate-6 rounded bg-[#fff7df] px-2 py-1 font-hand text-[10px] text-[#704d32] shadow">{labels[index % labels.length]}</span>
      {src ? <img src={src} alt={item.title + " poster"} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center px-4 text-center text-[#5d493b]"><span>▧</span><span className="mt-2 text-xs">drop poster — {item.title}</span></div>}
    </div>
  </button>;
}
export function FilmMetadata({ item, onClick }: { item: MovieEntry; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="min-w-0 pt-3 text-left text-[#352218]"><div className="flex items-start gap-2"><h3 className="line-clamp-2 min-h-10 flex-1 font-serif text-lg leading-5">{item.title}</h3><span className="pt-1 text-[10px] text-[#806858]">{item.releaseYear}</span></div><p className="mt-1 text-xs text-[#806858]">{item.mediaType === "series" ? "Series" : "Movie"}</p><p className="text-sm text-[#b4442a]">{"★".repeat(item.rating ?? 0)}{"☆".repeat(5 - (item.rating ?? 0))}</p></button>;
}
